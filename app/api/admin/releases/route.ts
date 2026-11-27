import { seedBundledRelease } from "../../../../lib/server/bundled-release";
import {
  admin,
  bucket,
  db,
  env,
  handle,
  json,
  log,
  release,
} from "../../../../lib/server/core";
import {
  APK_LIMIT,
  date,
  ensure,
  multipartBody,
  notes,
  verifyReceipt,
} from "../../../../lib/server/security";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return handle(async () => {
    await admin(request);
    await seedBundledRelease();
    const rows = await db()
      .prepare("SELECT * FROM releases ORDER BY version_code DESC")
      .all<Record<string, unknown>>();
    return json({ releases: rows.results.map(release) });
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    const actor = await admin(request);
    await seedBundledRelease();
    const form = await multipartBody(request, APK_LIMIT + 128 * 1024);
    const apk = form.get("apk");
    const receipt = form.get("receipt");
    ensure(
      apk instanceof File &&
        apk.name.toLowerCase().endsWith(".apk") &&
        apk.size > 0 &&
        apk.size <= APK_LIMIT,
      400,
      "Pilih file APK release, maksimum 20 MiB.",
    );
    ensure(
      receipt instanceof File && receipt.size < 64 * 1024,
      400,
      "Lampirkan file bukti verifikasi JSON.",
    );
    let parsed: unknown;
    let rawNotes: unknown;
    try {
      parsed = JSON.parse(await receipt.text());
      rawNotes = JSON.parse(String(form.get("releaseNotes")));
    } catch {
      return json(
        { error: "Bukti verifikasi atau catatan rilis bukan JSON yang valid." },
        400,
      );
    }
    const releaseNotes = notes(rawNotes);
    const releaseDate = date(form.get("releaseDate"));
    const bytes = new Uint8Array(await apk.arrayBuffer());
    const verified = await verifyReceipt(
      parsed,
      bytes,
      env.RELEASE_VERIFICATION_KEY,
      env.ANDROID_SIGNING_CERT_SHA256,
      env.APK_EXPECTED_PACKAGE,
    );
    const duplicate = await db()
      .prepare("SELECT id FROM releases WHERE version_code = ?")
      .bind(verified.versionCode)
      .first();
    ensure(
      !duplicate,
      409,
      "Version code ini sudah terdaftar. Gunakan build baru dengan version code berbeda.",
    );
    const id = crypto.randomUUID();
    const key = `apks/${id}/${verified.sha256}.apk`;
    const fileName = `dana-keluarga-${verified.versionCode}.apk`;
    await bucket().put(key, bytes, {
      httpMetadata: { contentType: "application/vnd.android.package-archive" },
      customMetadata: {
        sha256: verified.sha256,
        signerSha256: verified.signerSha256,
      },
    });
    try {
      await db()
        .prepare(
          "INSERT INTO releases (id,version_name,version_code,release_date,file_name,file_size,min_android,min_sdk,sha256,signer_sha256,object_key,release_notes,status,active,downloads,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'draft',0,0,?)",
        )
        .bind(
          id,
          verified.versionName,
          verified.versionCode,
          releaseDate,
          fileName,
          bytes.length,
          verified.minAndroid,
          verified.minSdk,
          verified.sha256,
          verified.signerSha256,
          key,
          JSON.stringify(releaseNotes),
          new Date().toISOString(),
        )
        .run();
    } catch (error) {
      await bucket().delete(key);
      throw error;
    }
    await log(actor.id, "release.upload", id);
    const row = await db()
      .prepare("SELECT * FROM releases WHERE id = ?")
      .bind(id)
      .first<Record<string, unknown>>();
    return json({ release: release(row!) }, 201);
  });
}
