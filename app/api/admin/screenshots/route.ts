import {
  admin,
  bucket,
  db,
  handle,
  json,
  log,
  screenshot,
} from "../../../../lib/server/core";
import {
  IMAGE_LIMIT,
  ensure,
  imageType,
  multipartBody,
  text,
} from "../../../../lib/server/security";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return handle(async () => {
    await admin(request);
    const rows = await db()
      .prepare("SELECT * FROM screenshots ORDER BY sort_order,created_at")
      .all<Record<string, unknown>>();
    return json({ screenshots: rows.results.map(screenshot) });
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    const actor = await admin(request);
    const form = await multipartBody(request, IMAGE_LIMIT + 64 * 1024);
    const image = form.get("image");
    ensure(
      image instanceof File && image.size > 0 && image.size <= IMAGE_LIMIT,
      400,
      "Pilih gambar PNG, JPEG, atau WebP, maksimum 5 MiB.",
    );
    const title = text(form.get("title"), "Judul", 100);
    const alt = text(form.get("alt"), "Deskripsi aksesibilitas", 500);
    const sortOrder = Number(form.get("sortOrder") ?? 0);
    ensure(
      Number.isSafeInteger(sortOrder) && sortOrder >= 0 && sortOrder < 10000,
      400,
      "Urutan tidak valid.",
    );
    const count = await db()
      .prepare("SELECT COUNT(*) AS total FROM screenshots")
      .first<{ total: number }>();
    ensure(
      (count?.total ?? 0) < 30,
      409,
      "Maksimum 30 screenshot. Hapus gambar lama terlebih dahulu.",
    );
    const bytes = new Uint8Array(await image.arrayBuffer());
    const contentType = imageType(bytes);
    const id = crypto.randomUUID();
    const key = `screenshots/${id}`;
    await bucket().put(key, bytes, { httpMetadata: { contentType } });
    try {
      await db()
        .prepare(
          "INSERT INTO screenshots (id,title,alt,object_key,content_type,sort_order,created_at) VALUES (?,?,?,?,?,?,?)",
        )
        .bind(
          id,
          title,
          alt,
          key,
          contentType,
          sortOrder,
          new Date().toISOString(),
        )
        .run();
    } catch (error) {
      await bucket().delete(key);
      throw error;
    }
    await log(actor.id, "screenshot.upload", id);
    return json(
      { screenshot: { id, title, alt, sortOrder, url: `/api/media/${id}` } },
      201,
    );
  });
}
