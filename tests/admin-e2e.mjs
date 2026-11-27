/** Browser QA. Run against local preview with explicit ADMIN_USER_IDS=local_seedy.
 * CHROME_EXECUTABLE=/absolute/path/to/chrome BASE_URL=http://127.0.0.1:5173 node tests/admin-e2e.mjs
 * Tests restore content and remove their uploaded screenshot in finally.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_EXECUTABLE ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let originalContent;
let screenshotId;
const passed = [];
const check = (name) => {
  passed.push(name);
  console.log("PASS", name);
};
async function json(url, options = {}) {
  const response = await context.request.fetch(base + url, {
    ...options,
    headers: { Origin: new URL(base).origin, ...(options.headers || {}) },
  });
  assert.ok(
    response.ok(),
    `${url}: ${response.status()} ${await response.text()}`,
  );
  return response.json();
}
async function noOverflow(label) {
  const metrics = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(
    metrics.scroll <= metrics.width + 1,
    `${label}: horizontal overflow ${JSON.stringify(metrics)}`,
  );
  check(label);
}
try {
  await page.goto(base + "/admin");
  await page
    .getByRole("heading", { name: "Selamat datang kembali." })
    .waitFor();
  assert.equal((await json("/api/admin/session")).authorized, false);
  const unauth = await context.request.get(base + "/api/admin/releases");
  assert.equal(unauth.status(), 401);
  check("Anonymous admin gate and API authorization");
  await page.getByRole("link", { name: "Masuk dengan ChatGPT" }).click();
  await page.getByRole("heading", { name: "Semua dalam kendali." }).waitFor();
  assert.equal((await json("/api/admin/session")).authorized, true);
  await page.locator(".admin-stat").first().waitFor();
  const initialReleases = (await json("/api/admin/releases")).releases;
  assert.equal(
    await page
      .locator(".admin-stat")
      .nth(1)
      .locator(":scope > strong")
      .innerText(),
    String(initialReleases.length),
  );
  check("Development sign-in and actual dashboard counts");
  await noOverflow("Desktop 1440 px layout");

  originalContent = await json("/api/admin/content");
  await page
    .getByRole("button", { name: "Konten website", exact: true })
    .click();
  await page.getByRole("heading", { name: "Cerita Dana Keluarga" }).waitFor();
  const unique = "QA sementara " + Date.now();
  if (!(originalContent.faqs || []).length)
    await page.getByRole("button", { name: "Tambah FAQ" }).click();
  const firstFaq = page.locator(".admin-faq-editor").first();
  await firstFaq.getByLabel("Pertanyaan", { exact: false }).fill(unique + "?");
  await firstFaq
    .getByLabel("Jawaban", { exact: false })
    .fill("Jawaban pengujian sementara, dikembalikan setelah pengujian.");
  await page.getByRole("button", { name: "Simpan konten website" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Konten website berhasil disimpan." })
    .waitFor();
  const savedContent = await json("/api/admin/content");
  assert.equal(savedContent.faqs[0].question, unique + "?");
  await json("/api/admin/content", { method: "PUT", data: originalContent });
  assert.deepEqual(await json("/api/admin/content"), originalContent);
  check("FAQ edit persists and original content restored");

  await page
    .getByRole("button", { name: "Galeri aplikasi", exact: true })
    .click();
  await page.getByRole("heading", { name: "Tambah screenshot" }).waitFor();
  const fixture = path.resolve("public/brand/app-icon.png");
  await page.getByLabel("File screenshot").setInputFiles(fixture);
  await page.getByLabel("Judul tampilan").fill(unique);
  await page
    .getByLabel("Deskripsi untuk aksesibilitas")
    .fill("Ikon resmi aplikasi untuk pengujian sementara.");
  await page
    .getByRole("button", { name: "Tambah screenshot", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Screenshot berhasil ditambahkan" })
    .waitFor();
  const created = (await json("/api/admin/screenshots")).screenshots.find(
    (item) => item.title === unique,
  );
  assert.ok(created);
  screenshotId = created.id;
  const media = await context.request.get(base + created.url);
  assert.ok(media.ok());
  assert.match(media.headers()["content-type"], /^image\/png/);
  check("Screenshot upload and public media endpoint");
  await page
    .getByRole("button", { name: `Edit ${unique}`, exact: true })
    .click();
  const card = page
    .locator(".admin-screenshot-card")
    .filter({ has: page.locator(`input[name="title"][value="${unique}"]`) });
  await card.getByLabel("Judul", { exact: true }).fill(unique + " diedit");
  await card.getByLabel("Urutan", { exact: true }).fill("3");
  await card.getByRole("button", { name: "Simpan", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Informasi screenshot berhasil diperbarui" })
    .waitFor();
  const edited = (await json("/api/admin/screenshots")).screenshots.find(
    (item) => item.id === screenshotId,
  );
  assert.equal(edited.title, unique + " diedit");
  assert.equal(edited.sortOrder, 3);
  check("Screenshot metadata edit persists");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: `Hapus ${unique} diedit`, exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Screenshot berhasil dihapus." })
    .waitFor();
  assert.ok(
    !(await json("/api/admin/screenshots")).screenshots.some(
      (item) => item.id === screenshotId,
    ),
  );
  screenshotId = undefined;
  check("Screenshot delete and cleanup");

  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow("Mobile 390 px gallery layout");
  await page.getByRole("button", { name: "Buka menu", exact: true }).click();
  await page
    .locator(".admin-sidebar nav")
    .getByRole("button", { name: /Versi aplikasi/ })
    .click();
  await page.getByRole("heading", { name: "Unggah versi baru" }).waitFor();
  await noOverflow("Mobile APK form layout and sidebar navigation");
  await page
    .getByLabel("File APK release")
    .setInputFiles({
      name: "invalid.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("invalid apk fixture"),
    });
  await page
    .getByLabel("Bukti verifikasi")
    .setInputFiles({
      name: "receipt.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
  await page
    .getByLabel("Catatan pembaruan")
    .fill("Pengujian penolakan file tidak valid.");
  await page.getByRole("button", { name: "Unggah APK", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Pilih file aplikasi Android dengan ekstensi .apk." })
    .waitFor();
  assert.equal(
    (await json("/api/admin/releases")).releases.length,
    initialReleases.length,
  );
  check("Invalid APK blocked by client with clear validation");
  await page
    .getByLabel("File APK release")
    .setInputFiles({
      name: "invalid.apk",
      mimeType: "application/vnd.android.package-archive",
      buffer: Buffer.from("invalid apk fixture"),
    });
  await page.getByRole("button", { name: "Unggah APK", exact: true }).click();
  await page.locator(".admin-notice.is-error").waitFor();
  assert.equal(
    (await json("/api/admin/releases")).releases.length,
    initialReleases.length,
  );
  check("Unsigned invalid APK rejected by server");
  await page.setViewportSize({ width: 768, height: 1024 });
  await noOverflow("Tablet 768 px APK form layout");
  assert.deepEqual(errors, [], `Browser runtime errors: ${errors.join("; ")}`);
  check("No browser runtime exceptions");
  console.log(
    JSON.stringify({ passed: passed.length, checks: passed }, null, 2),
  );
} finally {
  if (originalContent)
    await context.request
      .put(base + "/api/admin/content", {
        data: originalContent,
        headers: { Origin: new URL(base).origin },
      })
      .catch(() => {});
  if (screenshotId)
    await context.request
      .delete(base + `/api/admin/screenshots/${screenshotId}`, {
        headers: { Origin: new URL(base).origin },
      })
      .catch(() => {});
  await browser.close();
}
