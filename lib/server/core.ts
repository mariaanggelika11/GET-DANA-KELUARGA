import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../app/chatgpt-auth";
import { HttpError, ensure, sameOrigin } from "./security";
import type { Release, Screenshot, SiteSettings, FAQ } from "../types";
import { defaultSettings, defaultFaqs } from "../content/public";

export const defaults: SiteSettings = defaultSettings;
export function db() {
  ensure(env.DB, 503, "Pusat data belum tersedia. Silakan coba lagi nanti.");
  return env.DB;
}
export function bucket() {
  ensure(env.BUCKET, 503, "Penyimpanan aplikasi belum tersedia.");
  return env.BUCKET;
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    console.error(
      "Website API failure",
      error instanceof Error ? error.name : "unknown",
    );
    return json(
      { error: "Layanan sedang mengalami gangguan. Silakan coba lagi." },
      503,
    );
  }
}
export async function session() {
  const user = await getChatGPTUser();
  const allowed = (env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return {
    authenticated: !!user,
    authorized: !!user && allowed.includes(user.userId),
    configured: allowed.length > 0,
    user: user
      ? { id: user.userId, email: user.email, name: user.displayName }
      : null,
  };
}
export async function admin(request?: Request) {
  const s = await session();
  ensure(
    s.authenticated,
    401,
    "Masuk terlebih dahulu untuk mengakses administrasi.",
  );
  ensure(s.authorized, 403, "Akun ini tidak memiliki akses administrator.");
  if (request && !["GET", "HEAD"].includes(request.method)) sameOrigin(request);
  return s.user!;
}
export async function log(actor: string, action: string, target: string) {
  await db()
    .prepare(
      "INSERT INTO audit (id, actor, action, target, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), actor, action, target, new Date().toISOString())
    .run();
}
type Row = Record<string, unknown>;
export function release(row: Row): Release {
  return {
    id: String(row.id),
    versionName: String(row.version_name),
    versionCode: Number(row.version_code),
    releaseDate: String(row.release_date),
    fileName: String(row.file_name),
    fileSize: Number(row.file_size),
    minAndroid: String(row.min_android),
    sha256: String(row.sha256),
    releaseNotes: JSON.parse(String(row.release_notes)),
    status: row.status as Release["status"],
    downloads: Number(row.downloads),
    active: !!row.active,
    downloadUrl: `/api/download/${row.id}`,
  };
}
export function screenshot(row: Row): Screenshot {
  return {
    id: String(row.id),
    title: String(row.title),
    alt: String(row.alt),
    url: `/api/media/${row.id}`,
    sortOrder: Number(row.sort_order),
  };
}
export async function readContent() {
  const rows = await db()
    .prepare("SELECT key,value FROM content")
    .all<{ key: string; value: string }>();
  const map = Object.fromEntries(
    rows.results.map((r) => [r.key, JSON.parse(r.value)]),
  );
  return {
    settings: { ...defaults, ...(map.settings ?? {}) } as SiteSettings,
    faqs: (map.faqs ?? defaultFaqs) as FAQ[],
  };
}
export { env };
