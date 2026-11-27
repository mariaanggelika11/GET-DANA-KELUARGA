/** LOCAL ONLY. Requires TEST_APK and TEST_RECEIPT created using scripts/test-apk-fixture.mjs.
 * Never run against production. Cleans uploaded fixture in finally. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
assert.equal(
  new URL(base).hostname,
  "127.0.0.1",
  "Release fixture test only permits loopback",
);
const apk = process.env.TEST_APK,
  receipt = process.env.TEST_RECEIPT;
assert.ok(apk && receipt, "TEST_APK and TEST_RECEIPT required");
const proof = JSON.parse(await readFile(receipt, "utf8"));
assert.equal(proof.payload.packageId, "test.danakeluarga.verification");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_EXECUTABLE
    ? { executablePath: process.env.CHROME_EXECUTABLE }
    : {}),
});
const context = await browser.newContext();
const page = await context.newPage();
let id;
const headers = { Origin: new URL(base).origin };
async function api(path, options = {}) {
  const r = await context.request.fetch(base + path, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  assert.ok(r.ok(), `${path} ${r.status()} ${await r.text()}`);
  return r.json();
}
try {
  await page.goto(base + "/signin-with-chatgpt?return_to=%2Fadmin");
  await page
    .getByRole("heading", { name: "Semua dalam kendali.", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Versi aplikasi", exact: true })
    .click();
  await page.locator('input[name="apk"]').setInputFiles(apk);
  await page.locator('input[name="receipt"]').setInputFiles(receipt);
  await page
    .locator('input[name="releaseDate"]')
    .fill(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
        new Date(),
      ),
    );
  await page
    .locator('textarea[name="notes"]')
    .fill("Fixture privat untuk menguji distribusi. Bukan APK Dana Keluarga.");
  await page.getByRole("button", { name: "Unggah APK", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "APK tersimpan sebagai draft." })
    .waitFor();
  const draft = (await api("/api/admin/releases")).releases.find(
    (r) => r.versionName === "1.0-test",
  );
  assert.ok(draft);
  id = draft.id;
  assert.equal(draft.status, "draft");
  assert.equal(
    (await context.request.get(base + draft.downloadUrl)).status(),
    404,
  );
  await page
    .getByRole("button", { name: "Publikasikan & aktifkan", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Versi aplikasi berhasil diperbarui." })
    .waitFor();
  const publicPage = await context.newPage();
  await publicPage.goto(base + "/#download");
  const download = publicPage.getByRole("link", {
    name: "Download APK",
    exact: true,
  });
  await download.waitFor();
  assert.equal(await download.getAttribute("href"), draft.downloadUrl);
  const r = await context.request.get(base + draft.downloadUrl);
  assert.equal(r.status(), 200);
  assert.ok(r.headers()["content-disposition"].startsWith("attachment;"));
  const checksum = createHash("sha256")
    .update(await r.body())
    .digest("hex");
  assert.equal(checksum, proof.payload.sha256);
  assert.equal(r.headers()["x-apk-sha256"], checksum);
  const latest = await api("/api/public");
  assert.equal(latest.release.id, id);
  assert.equal(latest.release.downloads, 1);
  assert.ok(latest.release.releaseNotes[0].includes("Fixture"));
  const pending = publicPage.waitForEvent("download");
  await download.click();
  const file = await pending;
  assert.ok(file.suggestedFilename().endsWith(".apk"));
  assert.equal(await file.failure(), null);
  await api("/api/admin/releases/" + id, {
    method: "PATCH",
    data: { status: "archived", active: false },
  });
  assert.equal(
    (await context.request.get(base + draft.downloadUrl)).status(),
    404,
  );
  await publicPage.reload();
  await publicPage
    .getByRole("link", { name: "Download APK", exact: true })
    .last()
    .waitFor();
  console.log(
    "PASS actual APK upload UI, signature receipt, draft gate, publish/activate, public metadata, download attachment bytes/checksum/count, browser download, archive withdrawal.",
  );
} finally {
  if (id) {
    await api("/api/admin/releases/" + id, {
      method: "PATCH",
      data: { status: "archived", active: false },
    });
    await api("/api/admin/releases/" + id, { method: "DELETE" });
  }
  await browser.close();
}
