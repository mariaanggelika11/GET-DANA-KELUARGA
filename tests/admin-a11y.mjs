import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
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
const failures = [];
let count = 0;
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
    });
    const page = await context.newPage();
    await page.goto(base + "/admin");
    await page
      .getByRole("heading", { name: "Selamat datang kembali." })
      .waitFor();
    async function audit(state) {
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      count++;
      const violations = result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      }));
      if (violations.length) failures.push({ width, state, violations });
      console.log(JSON.stringify({ width, state, violations }));
    }
    await audit("anonymous");
    await page.getByRole("link", { name: "Masuk dengan ChatGPT" }).click();
    await page.getByRole("heading", { name: "Semua dalam kendali." }).waitFor();
    await audit("overview");
    for (const tab of ["Versi aplikasi", "Galeri aplikasi", "Konten website"]) {
      if (width === 390)
        await page
          .getByRole("button", { name: "Buka menu", exact: true })
          .click();
      await page
        .locator(".admin-sidebar nav")
        .getByRole("button", { name: new RegExp(tab) })
        .click();
      await page.locator(".admin-loading").waitFor({ state: "hidden" });
      await audit(tab);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
assert.deepEqual(failures, [], JSON.stringify(failures, null, 2));
console.log(`PASS ${count} admin accessibility scans`);
