import {
  admin,
  bucket,
  db,
  handle,
  json,
  log,
  release,
} from "../../../../../lib/server/core";
import {
  date,
  ensure,
  id,
  jsonBody,
  notes,
} from "../../../../../lib/server/security";
export const dynamic = "force-dynamic";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const actor = await admin(request);
    const releaseId = id((await context.params).id);
    const body = await jsonBody(request);
    const row = await db()
      .prepare("SELECT * FROM releases WHERE id = ?")
      .bind(releaseId)
      .first<Record<string, unknown>>();
    ensure(row, 404, "Versi tidak ditemukan.");
    const status = body.status ?? row.status;
    ensure(
      ["draft", "published", "archived"].includes(String(status)),
      400,
      "Status rilis tidak valid.",
    );
    const releaseDate =
      body.releaseDate === undefined
        ? row.release_date
        : date(body.releaseDate);
    const releaseNotes =
      body.releaseNotes === undefined
        ? String(row.release_notes)
        : JSON.stringify(notes(body.releaseNotes));
    if (body.active !== undefined)
      ensure(
        typeof body.active === "boolean",
        400,
        "Status aktif tidak valid.",
      );
    const active =
      status === "published" &&
      (body.active === undefined ? !!row.active : body.active);
    if (status === "published") {
      const object = await bucket().head(String(row.object_key));
      ensure(
        object && object.size === Number(row.file_size),
        409,
        "File APK belum tersedia atau ukurannya berubah. Rilis tidak dapat diterbitkan.",
      );
    }
    const statements = [];
    if (active)
      statements.push(
        db().prepare("UPDATE releases SET active = 0 WHERE active = 1"),
      );
    statements.push(
      db()
        .prepare(
          "UPDATE releases SET status = ?, active = ?, release_date = ?, release_notes = ? WHERE id = ?",
        )
        .bind(status, active ? 1 : 0, releaseDate, releaseNotes, releaseId),
    );
    await db().batch(statements);
    await log(actor.id, `release.${status}`, releaseId);
    const updated = await db()
      .prepare("SELECT * FROM releases WHERE id = ?")
      .bind(releaseId)
      .first<Record<string, unknown>>();
    return json({ release: release(updated!) });
  });
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const actor = await admin(request);
    const releaseId = id((await context.params).id);
    const row = await db()
      .prepare("SELECT status,object_key FROM releases WHERE id = ?")
      .bind(releaseId)
      .first<Record<string, unknown>>();
    ensure(row, 404, "Versi tidak ditemukan.");
    ensure(
      row.status !== "published",
      409,
      "Arsipkan rilis sebelum menghapus file.",
    );
    await db()
      .prepare("DELETE FROM releases WHERE id = ?")
      .bind(releaseId)
      .run();
    await bucket().delete(String(row.object_key));
    await log(actor.id, "release.delete", releaseId);
    return json({ ok: true });
  });
}
