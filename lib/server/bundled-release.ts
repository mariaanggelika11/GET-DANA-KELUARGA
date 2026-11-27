import "server-only";
import artifact from "../content/bundled-release.json";
import { bundledApkBase64 } from "./bundled-apk-bytes";
import { bucket, db, env } from "./core";
import { ensure, sha256 } from "./security";

const objectKey = `apks/${artifact.id}/${artifact.sha256}.apk`;
const markerKey = `bundled-release:${artifact.id}`;

/** Import the verified deployment APK into private R2 once. Later admin decisions win. */
export async function seedBundledRelease() {
  if (env.DISABLE_BUNDLED_RELEASE === "1") return;
  const database = db();
  const marker = await database
    .prepare("SELECT key FROM content WHERE key = ?")
    .bind(markerKey)
    .first();
  if (marker) return;
  const now = new Date().toISOString();
  const existing = await database
    .prepare("SELECT id FROM releases WHERE version_code = ?")
    .bind(artifact.versionCode)
    .first<{ id: string }>();
  if (existing && existing.id !== artifact.id) {
    await database
      .prepare(
        "INSERT OR IGNORE INTO content (key,value,updated_at) VALUES (?,?,?)",
      )
      .bind(
        markerKey,
        JSON.stringify({ registeredAt: now, skippedVersionConflict: true }),
        now,
      )
      .run();
    return;
  }
  const binary = atob(bundledApkBase64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  ensure(
    bytes.length === artifact.fileSize &&
      (await sha256(bytes)) === artifact.sha256,
    503,
    "Artefak rilis bawaan tidak cocok dengan checksum yang telah diverifikasi.",
  );
  const storage = bucket();
  const object = await storage.head(objectKey);
  if (
    !object ||
    object.size !== bytes.length ||
    object.customMetadata?.sha256 !== artifact.sha256
  ) {
    await storage.put(objectKey, bytes, {
      httpMetadata: { contentType: "application/vnd.android.package-archive" },
      customMetadata: {
        sha256: artifact.sha256,
        signerSha256: artifact.signerSha256,
      },
    });
  }
  await database.batch([
    database
      .prepare(
        `INSERT OR IGNORE INTO releases
      (id,version_name,version_code,release_date,file_name,file_size,min_android,min_sdk,sha256,signer_sha256,object_key,release_notes,status,active,downloads,created_at)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'published',
      CASE WHEN EXISTS (SELECT 1 FROM releases WHERE status = 'published' AND version_code >= ?) THEN 0 ELSE 1 END,0,?
      WHERE NOT EXISTS (SELECT 1 FROM content WHERE key = ?)`,
      )
      .bind(
        artifact.id,
        artifact.versionName,
        artifact.versionCode,
        artifact.releaseDate,
        artifact.fileName,
        artifact.fileSize,
        artifact.minAndroid,
        artifact.minSdk,
        artifact.sha256,
        artifact.signerSha256,
        objectKey,
        JSON.stringify(artifact.releaseNotes),
        artifact.versionCode,
        now,
        markerKey,
      ),
    database
      .prepare(
        "UPDATE releases SET active = 0 WHERE id != ? AND active = 1 AND EXISTS (SELECT 1 FROM releases WHERE id = ? AND active = 1) AND NOT EXISTS (SELECT 1 FROM content WHERE key = ?)",
      )
      .bind(artifact.id, artifact.id, markerKey),
    database
      .prepare(
        "INSERT OR IGNORE INTO content (key,value,updated_at) VALUES (?,?,?)",
      )
      .bind(
        markerKey,
        JSON.stringify({ registeredAt: now, sha256: artifact.sha256 }),
        now,
      ),
  ]);
}
