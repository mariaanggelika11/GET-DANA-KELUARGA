import {
  admin,
  db,
  handle,
  json,
  log,
  readContent,
} from "../../../../lib/server/core";
import { ensure, jsonBody, text } from "../../../../lib/server/security";
import type { FAQ, SiteSettings } from "../../../../lib/types";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return handle(async () => {
    await admin(request);
    return json(await readContent());
  });
}
export async function PUT(request: Request) {
  return handle(async () => {
    const actor = await admin(request);
    const body = await jsonBody(request);
    ensure(
      body.settings &&
        typeof body.settings === "object" &&
        !Array.isArray(body.settings),
      400,
      "Pengaturan diperlukan.",
    );
    const source = body.settings as Record<string, unknown>;
    const settings: SiteSettings = {
      supportEmail: text(source.supportEmail, "Email bantuan", 254, 0),
      supportUrl: text(source.supportUrl, "Tautan bantuan", 1000, 0),
      heroTitle: text(source.heroTitle, "Judul utama", 180),
      heroDescription: text(source.heroDescription, "Deskripsi utama", 800),
      aboutText: text(source.aboutText, "Tentang aplikasi", 3000),
    };
    ensure(
      !settings.supportEmail ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail),
      400,
      "Email bantuan tidak valid.",
    );
    if (settings.supportUrl) {
      let url: URL;
      try {
        url = new URL(settings.supportUrl);
      } catch {
        return json({ error: "Tautan bantuan tidak valid." }, 400);
      }
      ensure(
        url.protocol === "https:" && !url.username && !url.password,
        400,
        "Tautan bantuan harus HTTPS.",
      );
    }
    ensure(
      Array.isArray(body.faqs) && body.faqs.length <= 40,
      400,
      "Maksimum 40 FAQ.",
    );
    const faqs: FAQ[] = body.faqs.map((item, index) => {
      ensure(item && typeof item === "object", 400, "FAQ tidak valid.");
      return {
        id: text(item.id, "ID FAQ", 80),
        question: text(item.question, "Pertanyaan", 300),
        answer: text(item.answer, "Jawaban", 3000),
        sortOrder: index,
      };
    });
    ensure(
      new Set(faqs.map((f) => f.id)).size === faqs.length,
      400,
      "ID FAQ harus unik.",
    );
    const now = new Date().toISOString();
    await db().batch([
      db()
        .prepare(
          "INSERT INTO content (key,value,updated_at) VALUES ('settings',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at",
        )
        .bind(JSON.stringify(settings), now),
      db()
        .prepare(
          "INSERT INTO content (key,value,updated_at) VALUES ('faqs',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at",
        )
        .bind(JSON.stringify(faqs), now),
    ]);
    await log(actor.id, "content.update", "landing");
    return json({ settings, faqs });
  });
}
