import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  HttpError,
  sameOrigin,
  boundedBody,
  verifyReceipt,
  sha256,
  canonicalPayload,
  imageType,
  date,
  notes,
} from "../lib/server/security.ts";
const secret = "security-test-key-with-at-least-32-characters";
const signer = "a".repeat(64);
const bytes = new Uint8Array([0x50, 0x4b, 3, 4, 1, 2, 3, 4]);
async function receipt(overrides = {}) {
  const payload = {
    schema: 1,
    packageId: "id.danakeluarga.app",
    sha256: await sha256(bytes),
    fileSize: bytes.length,
    versionName: "1.2.3",
    versionCode: 4,
    minSdk: 24,
    minAndroid: "7.0",
    signerSha256: signer,
    debuggable: false,
    verifiedAt: new Date().toISOString(),
    ...overrides,
  };
  return {
    payload,
    signature: createHmac("sha256", secret)
      .update(canonicalPayload(payload))
      .digest("hex"),
  };
}
const rejectStatus = (status) => (error) =>
  error instanceof HttpError && error.status === status;
test("CSRF rejects absent, mismatched and cross-site origins", () => {
  for (const headers of [
    {},
    { origin: "https://attacker.test" },
    { origin: "https://official.test", "sec-fetch-site": "cross-site" },
  ])
    assert.throws(
      () =>
        sameOrigin(
          new Request("https://official.test/api/admin/releases", {
            method: "POST",
            headers,
          }),
        ),
      rejectStatus(403),
    );
  sameOrigin(
    new Request("https://official.test/api/admin/releases", {
      method: "POST",
      headers: {
        origin: "https://official.test",
        "sec-fetch-site": "same-origin",
      },
    }),
  );
});
test("body limit checks declared and actual streamed size", async () => {
  await assert.rejects(
    boundedBody(
      new Request("https://site.test", {
        method: "POST",
        body: "12345",
        headers: { "content-length": "5" },
      }),
      4,
    ),
    rejectStatus(413),
  );
  await assert.rejects(
    boundedBody(
      new Request("https://site.test", { method: "POST", body: "12345" }),
      4,
    ),
    rejectStatus(413),
  );
  assert.equal(
    new TextDecoder().decode(
      await boundedBody(
        new Request("https://site.test", { method: "POST", body: "123" }),
        4,
      ),
    ),
    "123",
  );
});
test("valid HMAC receipt is bound to exact APK bytes and expected identity", async () => {
  const proof = await receipt();
  assert.equal(
    (await verifyReceipt(proof, bytes, secret, signer, "id.danakeluarga.app"))
      .versionCode,
    4,
  );
  const modified = new Uint8Array(bytes);
  modified[7] = 9;
  await assert.rejects(
    verifyReceipt(proof, modified, secret, signer, "id.danakeluarga.app"),
    rejectStatus(400),
  );
  await assert.rejects(
    verifyReceipt(proof, bytes, secret, signer, "com.other.app"),
    rejectStatus(400),
  );
});
test("unsigned, forged, debug and untrusted signed receipts fail closed", async () => {
  await assert.rejects(
    verifyReceipt(
      await receipt(),
      bytes,
      undefined,
      signer,
      "id.danakeluarga.app",
    ),
    rejectStatus(503),
  );
  await assert.rejects(
    verifyReceipt(await receipt(), bytes, secret, signer, undefined),
    rejectStatus(503),
  );
  const proof = await receipt();
  proof.signature = "0".repeat(64);
  await assert.rejects(
    verifyReceipt(proof, bytes, secret, signer, "id.danakeluarga.app"),
    rejectStatus(400),
  );
  await assert.rejects(
    verifyReceipt(
      await receipt({ debuggable: true }),
      bytes,
      secret,
      signer,
      "id.danakeluarga.app",
    ),
    rejectStatus(400),
  );
  await assert.rejects(
    verifyReceipt(
      await receipt({ signerSha256: "b".repeat(64) }),
      bytes,
      secret,
      signer,
      "id.danakeluarga.app",
    ),
    rejectStatus(400),
  );
});
test("APK envelope rejects nonzip payload even with authenticated receipt", async () => {
  const nonzip = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const proof = await receipt({ sha256: await sha256(nonzip) });
  await assert.rejects(
    verifyReceipt(proof, nonzip, secret, signer, "id.danakeluarga.app"),
    rejectStatus(400),
  );
});
test("malformed images and invalid release metadata are rejected", () => {
  assert.throws(
    () => imageType(new TextEncoder().encode('<svg onload="alert(1)">')),
    rejectStatus(400),
  );
  assert.throws(() => date("2026-02-30"), rejectStatus(400));
  assert.throws(() => notes([]), rejectStatus(400));
  assert.throws(() => notes([" "]), rejectStatus(400));
});
