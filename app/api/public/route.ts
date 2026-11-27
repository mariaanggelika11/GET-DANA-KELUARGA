import { seedBundledRelease } from "../../../lib/server/bundled-release";
import {
  db,
  handle,
  json,
  readContent,
  release,
  screenshot,
} from "../../../lib/server/core";
export const dynamic = "force-dynamic";
export async function GET() {
  return handle(async () => {
    await seedBundledRelease();
    const [releaseRows, shotRows, content] = await Promise.all([
      db()
        .prepare(
          "SELECT * FROM releases WHERE status = 'published' ORDER BY active DESC, version_code DESC",
        )
        .all<Record<string, unknown>>(),
      db()
        .prepare("SELECT * FROM screenshots ORDER BY sort_order,created_at")
        .all<Record<string, unknown>>(),
      readContent(),
    ]);
    const releases = releaseRows.results.map(release);
    return json({
      release: releases[0] ?? null,
      releases,
      screenshots: shotRows.results.map(screenshot),
      ...content,
    });
  });
}
