import { seedBundledRelease } from "../../../../lib/server/bundled-release";
import { db, bucket, handle, json } from "../../../../lib/server/core";
import { ensure, id } from "../../../../lib/server/security";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await seedBundledRelease();
    const value = id((await context.params).id);
    const row = await db()
      .prepare("SELECT * FROM releases WHERE id = ? AND status = 'published'")
      .bind(value)
      .first<Record<string, unknown>>();
    ensure(row, 404, "Versi aplikasi ini belum tersedia untuk diunduh.");
    const object = await bucket().get(String(row.object_key));
    ensure(
      object && object.size === Number(row.file_size),
      503,
      "File aplikasi sementara tidak tersedia. Hubungi pengelola.",
    );
    await db()
      .prepare("UPDATE releases SET downloads = downloads + 1 WHERE id = ?")
      .bind(value)
      .run();
    return new Response(object.body, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${row.file_name}"`,
        "Content-Length": String(object.size),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-APK-SHA256": String(row.sha256),
      },
    });
  });
}
export async function HEAD(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await seedBundledRelease();
    const row = await db()
      .prepare(
        "SELECT file_size,object_key FROM releases WHERE id = ? AND status = 'published'",
      )
      .bind(id((await context.params).id))
      .first<{ file_size: number; object_key: string }>();
    ensure(row, 404, "Versi tidak ditemukan.");
    const object = await bucket().head(row.object_key);
    ensure(
      object && object.size === row.file_size,
      503,
      "File aplikasi sementara tidak tersedia.",
    );
    return new Response(null, {
      headers: {
        "Content-Length": String(row.file_size),
        "Content-Type": "application/vnd.android.package-archive",
        "Cache-Control": "no-store",
      },
    });
  });
}
