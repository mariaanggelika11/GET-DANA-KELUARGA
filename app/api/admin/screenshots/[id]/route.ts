import {
  admin,
  bucket,
  db,
  handle,
  json,
  log,
} from "../../../../../lib/server/core";
import { ensure, id, jsonBody, text } from "../../../../../lib/server/security";
export const dynamic = "force-dynamic";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const actor = await admin(request);
    const value = id((await context.params).id);
    const body = await jsonBody(request);
    const row = await db()
      .prepare("SELECT * FROM screenshots WHERE id = ?")
      .bind(value)
      .first<Record<string, unknown>>();
    ensure(row, 404, "Screenshot tidak ditemukan.");
    const title =
      body.title === undefined ? row.title : text(body.title, "Judul", 100);
    const alt =
      body.alt === undefined ? row.alt : text(body.alt, "Deskripsi", 500);
    const sortOrder =
      body.sortOrder === undefined
        ? Number(row.sort_order)
        : Number(body.sortOrder);
    ensure(
      Number.isSafeInteger(sortOrder) && sortOrder >= 0 && sortOrder < 10000,
      400,
      "Urutan tidak valid.",
    );
    await db()
      .prepare("UPDATE screenshots SET title=?,alt=?,sort_order=? WHERE id=?")
      .bind(title, alt, sortOrder, value)
      .run();
    await log(actor.id, "screenshot.edit", value);
    return json({ ok: true });
  });
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const actor = await admin(request);
    const value = id((await context.params).id);
    const row = await db()
      .prepare("SELECT object_key FROM screenshots WHERE id = ?")
      .bind(value)
      .first<{ object_key: string }>();
    ensure(row, 404, "Screenshot tidak ditemukan.");
    await db()
      .prepare("DELETE FROM screenshots WHERE id = ?")
      .bind(value)
      .run();
    await bucket().delete(row.object_key);
    await log(actor.id, "screenshot.delete", value);
    return json({ ok: true });
  });
}
