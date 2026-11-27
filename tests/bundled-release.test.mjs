import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const metadata = JSON.parse(
  readFileSync(
    new URL("../lib/content/bundled-release.json", import.meta.url),
    "utf8",
  ),
);
test("verified production APK and private bootstrap are identical with no public debug artifact", () => {
  assert.equal(metadata.debuggable, false);
  assert.equal(metadata.versionName, "1.0.1");
  assert.equal(metadata.packageId, "com.bulmartech.danakeluarga");
  assert.equal(
    metadata.signerSha256,
    "86259bebb0301dc8029b81a4d58c8edbab54923478143424fe6a764344bfa77b",
  );
  const bytes = readFileSync(
    new URL("../artifacts/releases/" + metadata.fileName, import.meta.url),
  );
  assert.equal(bytes.length, metadata.fileSize);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    metadata.sha256,
  );
  const source = readFileSync(
    new URL("../lib/server/bundled-apk-bytes.ts", import.meta.url),
    "utf8",
  );
  const encoded = JSON.parse(
    source.match(/export const bundledApkBase64 = ("[A-Za-z0-9+/=]+")/)[1],
  );
  assert.deepEqual(Buffer.from(encoded, "base64"), bytes);
  assert.equal(
    existsSync(
      new URL("../public/downloads/" + metadata.fileName, import.meta.url),
    ),
    false,
  );
  assert.equal(
    existsSync(
      new URL(
        "../public/downloads/dana-keluarga-0.1.0-debug-b07a0d56.apk",
        import.meta.url,
      ),
    ),
    false,
  );
  assert.equal(metadata.downloadUrl, "/api/download/" + metadata.id);
});
