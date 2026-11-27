import { db, bucket, handle } from "../../../../lib/server/core";
import { ensure, id } from "../../../../lib/server/security";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const row = await db()
      .prepare("SELECT * FROM screenshots WHERE id = ?")
      .bind(id((await context.params).id))
      .first<Record<string, unknown>>();
    ensure(row, 404, "Gambar tidak ditemukan.");
    const object = await bucket().get(String(row.object_key));
    ensure(object, 404, "Gambar tidak tersedia.");
    return new Response(object.body, {
      headers: {
        "Content-Type": String(row.content_type),
        "Content-Length": String(object.size),
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
