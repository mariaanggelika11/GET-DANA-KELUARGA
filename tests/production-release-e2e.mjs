import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
const artifact = JSON.parse(
  await readFile(
    new URL("../lib/content/bundled-release.json", import.meta.url),
    "utf8",
  ),
);
const response = await fetch(base + "/api/public");
assert.equal(response.status, 200);
const data = await response.json();
assert.equal(data.release.id, artifact.id);
assert.equal(data.release.versionName, "1.0.1");
const file = await fetch(base + data.release.downloadUrl);
assert.equal(file.status, 200);
const bytes = Buffer.from(await file.arrayBuffer());
assert.equal(bytes.length, artifact.fileSize);
assert.equal(createHash("sha256").update(bytes).digest("hex"), artifact.sha256);
assert.ok(file.headers.get("content-disposition").includes("attachment"));
assert.equal(file.headers.get("x-apk-sha256"), artifact.sha256);
if (process.env.TEST_APK_OUTPUT)
  await writeFile(process.env.TEST_APK_OUTPUT, bytes);
assert.equal(
  (await fetch(base + "/downloads/dana-keluarga-0.1.0-debug-b07a0d56.apk"))
    .status,
  404,
);
assert.equal(
  (await fetch(base + "/downloads/" + artifact.fileName)).status,
  404,
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_EXECUTABLE
    ? { executablePath: process.env.CHROME_EXECUTABLE }
    : {}),
});
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/#download", { waitUntil: "networkidle" });
    const link = page.getByRole("link", { name: "Download APK", exact: true });
    await link.waitFor();
    assert.equal(await link.getAttribute("href"), artifact.downloadUrl);
    const pending = page.waitForEvent("download");
    await link.click();
    const download = await pending;
    assert.equal(download.suggestedFilename(), artifact.fileName);
    assert.equal(await download.failure(), null);
    const received = await readFile(await download.path());
    assert.equal(
      createHash("sha256").update(received).digest("hex"),
      artifact.sha256,
    );
    assert.equal(
      await page.getByText("APK Pengujian (Debug)", { exact: true }).count(),
      0,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    const audit = await new AxeBuilder({ page })
      .include("#download")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => v.id),
      [],
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        width,
        version: artifact.versionName,
        bytes: artifact.fileSize,
        checksum: true,
        browserDownload: true,
        debugLabel: false,
        axe: 0,
      }),
    );
    await context.close();
  }
} finally {
  await browser.close();
}
