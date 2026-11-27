import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import jsQR from "jsqr";
import { PNG } from "pngjs";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
const engine = process.env.TEST_BROWSER === "webkit" ? webkit : chromium;
const browser = await engine.launch({
  headless: true,
  ...(engine === chromium && process.env.CHROME_EXECUTABLE
    ? { executablePath: process.env.CHROME_EXECUTABLE }
    : {}),
});
const results = [];
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `overflow at ${width}`,
    );
    if (width < 850) {
      await page
        .getByRole("button", { name: "Buka navigasi", exact: true })
        .click();
      assert.equal(await page.locator("#mobile-nav").isVisible(), true);
    }
    await page
      .locator("#mobile-nav")
      .getByRole("link", { name: "Fitur", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Bagaimana cara bergabung dengan keluarga?",
        exact: true,
      })
      .click();
    assert.equal(await page.locator("#faq-account").isVisible(), true);
    assert.deepEqual(
      await page.locator('a[href^="#"]').evaluateAll((links) =>
        links
          .map((a) => a.getAttribute("href"))
          .filter((h) => h !== "#")
          .filter((h) => !document.querySelector(h)),
      ),
      [],
    );
    const qr = page.getByAltText(
      "QR Code menuju Pusat Unduhan Dana Keluarga pada alamat website ini",
    );
    await qr.waitFor();
    const data = await qr.getAttribute("src");
    assert.ok(data?.startsWith("data:image/png;base64,"));
    const png = PNG.sync.read(Buffer.from(data.split(",")[1], "base64"));
    const decoded = jsQR(
      new Uint8ClampedArray(png.data),
      png.width,
      png.height,
    );
    assert.equal(decoded?.data, new URL(base).origin + "/#download");
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    results.push({
      width,
      qr: true,
      errors,
      a11y: a11y.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    assert.deepEqual(errors, []);
    await context.close();
  }
  for (const path of [
    "/privasi",
    "/ketentuan",
    "/robots.txt",
    "/sitemap.xml",
    "/admin",
  ]) {
    const page = await browser.newPage();
    const r = await page.goto(base + path, { waitUntil: "networkidle" });
    assert.equal(r.status(), 200, path);
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  assert.equal(
    results.flatMap((r) => r.a11y).length,
    0,
    "Accessibility violations found",
  );
} finally {
  await browser.close();
}
