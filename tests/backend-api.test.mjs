/** Real route handlers, real SQLite migrations; only platform identity and R2 are in-memory adapters. */
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { createHash, createHmac } from "node:crypto";
import { build } from "esbuild";

const state = { env: {}, user: null };
globalThis.__danaBackendTest = state;
const routes = {};
const signer = "a".repeat(64);
const secret = "backend-integration-private-testing-secret";
const origin = "https://official.test";
let sqlite;
const objects = new Map();
const headers = { origin, "sec-fetch-site": "same-origin" };
function prepared(sql, args = []) {
  return {
    bind(...values) {
      return prepared(sql, values);
    },
    async first() {
      return sqlite.prepare(sql).get(...args) ?? null;
    },
    async all() {
      return { results: sqlite.prepare(sql).all(...args) };
    },
    async run() {
      return sqlite.prepare(sql).run(...args);
    },
  };
}
const DB = {
  prepare: prepared,
  async batch(statements) {
    sqlite.exec("BEGIN");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  },
};
const BUCKET = {
  async put(key, value) {
    const bytes = new Uint8Array(value);
    objects.set(key, bytes.slice());
    return { key, size: bytes.length };
  },
  async get(key) {
    const bytes = objects.get(key);
    return bytes ? { body: bytes.slice(), size: bytes.length } : null;
  },
  async head(key) {
    const bytes = objects.get(key);
    return bytes ? { size: bytes.length } : null;
  },
  async delete(key) {
    objects.delete(key);
  },
};
before(async () => {
  const entries = {
    public: "app/api/public/route.ts",
    session: "app/api/admin/session/route.ts",
    releases: "app/api/admin/releases/route.ts",
    release: "app/api/admin/releases/[id]/route.ts",
    download: "app/api/download/[id]/route.ts",
    screenshots: "app/api/admin/screenshots/route.ts",
    screenshot: "app/api/admin/screenshots/[id]/route.ts",
    content: "app/api/admin/content/route.ts",
  };
  for (const [name, entry] of Object.entries(entries)) {
    const result = await build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      format: "esm",
      platform: "node",
      target: "es2022",
      plugins: [
        {
          name: "platform-test-adapters",
          setup(b) {
            b.onResolve({ filter: /^server-only$/ }, () => ({
              path: "server-only",
              namespace: "test",
            }));
            b.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
              path: "env",
              namespace: "test",
            }));
            b.onResolve({ filter: /app\/chatgpt-auth$/ }, () => ({
              path: "identity",
              namespace: "test",
            }));
            b.onLoad({ filter: /.*/, namespace: "test" }, (args) => ({
              contents:
                args.path === "server-only"
                  ? "export {};"
                  : args.path === "env"
                    ? "export const env=globalThis.__danaBackendTest.env;"
                    : "export async function getChatGPTUser(){return globalThis.__danaBackendTest.user;}",
              loader: "js",
            }));
          },
        },
      ],
    });
    routes[name] = await import(
      `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
    );
  }
});
beforeEach(() => {
  sqlite?.close();
  sqlite = new DatabaseSync(":memory:");
  for (const file of readdirSync("drizzle")
    .filter((name) => name.endsWith(".sql"))
    .sort())
    sqlite.exec(readFileSync(`drizzle/${file}`, "utf8"));
  objects.clear();
  state.user = null;
  Object.assign(state.env, {
    DB,
    BUCKET,
    ADMIN_USER_IDS: "trusted-admin",
    RELEASE_VERIFICATION_KEY: secret,
    ANDROID_SIGNING_CERT_SHA256: signer,
    APK_EXPECTED_PACKAGE: "id.danakeluarga.app",
    DISABLE_BUNDLED_RELEASE: "1",
  });
});
after(() => {
  sqlite?.close();
  delete globalThis.__danaBackendTest;
});
function signIn(id = "trusted-admin") {
  state.user = {
    userId: id,
    email: "admin@example.test",
    displayName: "Admin",
  };
}
function request(path, method = "GET", body, extra = {}) {
  return new Request(`${origin}${path}`, {
    method,
    ...(body === undefined ? {} : { body }),
    headers: { ...headers, ...extra },
  });
}
function params(id) {
  return { params: Promise.resolve({ id }) };
}
async function upload(versionCode = 1, alter = {}) {
  const bytes = new Uint8Array([
    0x50,
    0x4b,
    3,
    4,
    ...new TextEncoder().encode(`private-test-fixture-${versionCode}`),
  ]);
  const payload = {
    schema: 1,
    packageId: "id.danakeluarga.app",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    fileSize: bytes.length,
    versionName: `1.0.${versionCode}`,
    versionCode,
    minSdk: 24,
    minAndroid: "7.0",
    signerSha256: signer,
    debuggable: false,
    verifiedAt: new Date().toISOString(),
    ...alter,
  };
  const signature = createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
  const form = new FormData();
  form.set("apk", new File([bytes], "release.apk"));
  form.set(
    "receipt",
    new File([JSON.stringify({ payload, signature })], "verification.json"),
  );
  form.set(
    "releaseNotes",
    JSON.stringify(["Integration test only, never published externally."]),
  );
  form.set("releaseDate", "2026-01-01");
  return {
    response: await routes.releases.POST(
      request("/api/admin/releases", "POST", form),
    ),
    bytes,
  };
}
async function patch(id, body) {
  return routes.release.PATCH(
    request(`/api/admin/releases/${id}`, "PATCH", JSON.stringify(body), {
      "content-type": "application/json",
    }),
    params(id),
  );
}

test("all administrative APIs fail closed for anonymous and nonallowlisted users", async () => {
  for (const name of ["releases", "screenshots", "content"])
    assert.equal(
      (await routes[name].GET(request(`/api/admin/${name}`))).status,
      401,
    );
  signIn("stranger");
  assert.equal(
    (await routes.releases.GET(request("/api/admin/releases"))).status,
    403,
  );
  state.env.ADMIN_USER_IDS = "";
  signIn();
  assert.equal(
    (await routes.releases.GET(request("/api/admin/releases"))).status,
    403,
  );
  const session = await (await routes.session.GET()).json();
  assert.equal(session.authorized, false);
  assert.equal(session.configured, false);
});
test("fresh database exposes honest empty releases and validated default editorial content", async () => {
  const response = await routes.public.GET();
  assert.equal(response.status, 200);
  const value = await response.json();
  assert.equal(value.release, null);
  assert.deepEqual(value.releases, []);
  assert.ok(value.faqs.length >= 8);
  assert.equal(value.settings.supportEmail, "");
  assert.ok(!value.settings.aboutText.includes("alokasi"));
  delete state.env.DB;
  assert.equal((await routes.public.GET()).status, 503);
});
test("APK upload, publish, download, checksum, count and active version work together", async () => {
  signIn();
  const { response, bytes } = await upload();
  assert.equal(response.status, 201);
  const first = (await response.json()).release;
  assert.equal(first.status, "draft");
  assert.equal((await (await routes.public.GET()).json()).release, null);
  assert.equal(
    (
      await routes.download.GET(
        request(`/api/download/${first.id}`),
        params(first.id),
      )
    ).status,
    404,
  );
  assert.equal(
    (await patch(first.id, { status: "published", active: true })).status,
    200,
  );
  const file = await routes.download.GET(
    request(`/api/download/${first.id}`),
    params(first.id),
  );
  assert.equal(file.status, 200);
  assert.equal(
    file.headers.get("content-type"),
    "application/vnd.android.package-archive",
  );
  assert.ok(file.headers.get("content-disposition").includes("attachment"));
  assert.equal(file.headers.get("x-apk-sha256"), first.sha256);
  assert.deepEqual(new Uint8Array(await file.arrayBuffer()), bytes);
  assert.equal(
    (
      await routes.download.HEAD(
        request(`/api/download/${first.id}`, "HEAD"),
        params(first.id),
      )
    ).status,
    200,
  );
  let latest = (await (await routes.public.GET()).json()).release;
  assert.equal(latest.downloads, 1);
  const second = (await (await upload(2)).response.json()).release;
  assert.equal(
    (await patch(second.id, { status: "published", active: true })).status,
    200,
  );
  let data = await (await routes.public.GET()).json();
  assert.equal(data.release.id, second.id);
  assert.equal(data.releases.filter((item) => item.active).length, 1);
  assert.equal((await patch(second.id, { status: "archived" })).status, 200);
  data = await (await routes.public.GET()).json();
  assert.equal(data.release.id, first.id);
  assert.equal(
    (
      await routes.download.GET(
        request(`/api/download/${second.id}`),
        params(second.id),
      )
    ).status,
    404,
  );
});
test("wrong package, duplicate versions and absent stored file cannot be published", async () => {
  signIn();
  const wrong = await upload(1, { packageId: "com.attacker.app" });
  assert.equal(wrong.response.status, 400);
  assert.equal(objects.size, 0);
  const first = (await (await upload(1)).response.json()).release;
  assert.equal((await upload(1)).response.status, 409);
  objects.clear();
  assert.equal(
    (await patch(first.id, { status: "published", active: true })).status,
    409,
  );
  assert.equal((await (await routes.public.GET()).json()).release, null);
});
test("content writes reject cross-origin requests, unsafe support URLs and duplicate FAQ IDs", async () => {
  signIn();
  const initial = await (
    await routes.content.GET(request("/api/admin/content"))
  ).json();
  let response = await routes.content.PUT(
    request("/api/admin/content", "PUT", JSON.stringify(initial), {
      "content-type": "application/json",
      origin: "https://attacker.test",
    }),
  );
  assert.equal(response.status, 403);
  response = await routes.content.PUT(
    request(
      "/api/admin/content",
      "PUT",
      JSON.stringify({
        ...initial,
        settings: { ...initial.settings, supportUrl: "javascript:alert(1)" },
      }),
      { "content-type": "application/json" },
    ),
  );
  assert.equal(response.status, 400);
  response = await routes.content.PUT(
    request(
      "/api/admin/content",
      "PUT",
      JSON.stringify({ ...initial, faqs: [initial.faqs[0], initial.faqs[0]] }),
      { "content-type": "application/json" },
    ),
  );
  assert.equal(response.status, 400);
  response = await routes.content.PUT(
    request(
      "/api/admin/content",
      "PUT",
      JSON.stringify({
        ...initial,
        settings: { ...initial.settings, supportEmail: "team@example.test" },
        faqs: initial.faqs.slice(0, 2),
      }),
      { "content-type": "application/json" },
    ),
  );
  assert.equal(response.status, 200);
  const updated = await (await routes.public.GET()).json();
  assert.equal(updated.settings.supportEmail, "team@example.test");
  assert.equal(updated.faqs.length, 2);
});
test("screenshot upload checks bytes and supports persistent edit/delete metadata", async () => {
  signIn();
  const invalid = new FormData();
  invalid.set(
    "image",
    new File(["<svg onload='alert(1)'/>"], "fake.png", { type: "image/png" }),
  );
  invalid.set("title", "Fake");
  invalid.set("alt", "Fake");
  assert.equal(
    (
      await routes.screenshots.POST(
        request("/api/admin/screenshots", "POST", invalid),
      )
    ).status,
    400,
  );
  const form = new FormData();
  form.set(
    "image",
    new File(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+cZ1EAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      "real.png",
    ),
  );
  form.set("title", "Test only");
  form.set("alt", "Private test fixture");
  form.set("sortOrder", "2");
  const response = await routes.screenshots.POST(
    request("/api/admin/screenshots", "POST", form),
  );
  assert.equal(response.status, 201);
  const item = (await response.json()).screenshot;
  assert.equal(
    (
      await routes.screenshot.PATCH(
        request(
          `/api/admin/screenshots/${item.id}`,
          "PATCH",
          JSON.stringify({ title: "Edited" }),
          { "content-type": "application/json" },
        ),
        params(item.id),
      )
    ).status,
    200,
  );
  assert.equal(
    (await (await routes.public.GET()).json()).screenshots[0].title,
    "Edited",
  );
  assert.equal(
    (
      await routes.screenshot.DELETE(
        request(`/api/admin/screenshots/${item.id}`, "DELETE"),
        params(item.id),
      )
    ).status,
    200,
  );
  assert.equal(objects.size, 0);
});

test("bundled verified release registers once and counts managed downloads", async () => {
  const artifact = JSON.parse(
    readFileSync("lib/content/bundled-release.json", "utf8"),
  );
  state.env.DISABLE_BUNDLED_RELEASE = "0";
  const first = await (await routes.public.GET()).json();
  assert.equal(first.release.id, artifact.id);
  assert.equal(first.release.versionName, artifact.versionName);
  assert.equal(first.release.sha256, artifact.sha256);
  assert.equal(first.release.downloads, 0);
  assert.equal(first.release.active, true);
  assert.equal(first.release.downloadUrl, `/api/download/${artifact.id}`);
  const head = await routes.download.HEAD(
    request(first.release.downloadUrl, "HEAD"),
    params(artifact.id),
  );
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("content-length"), String(artifact.fileSize));
  assert.equal((await (await routes.public.GET()).json()).release.downloads, 0);
  const file = await routes.download.GET(
    request(first.release.downloadUrl),
    params(artifact.id),
  );
  assert.equal(file.status, 200);
  const downloaded = new Uint8Array(await file.arrayBuffer());
  assert.equal(downloaded.length, artifact.fileSize);
  assert.equal(
    createHash("sha256").update(downloaded).digest("hex"),
    artifact.sha256,
  );
  assert.equal(file.headers.get("x-apk-sha256"), artifact.sha256);
  assert.equal((await (await routes.public.GET()).json()).release.downloads, 1);
  signIn();
  assert.equal(
    (await patch(artifact.id, { releaseNotes: ["Reviewed operator notes"] }))
      .status,
    200,
  );
  const second = await (
    await routes.releases.GET(request("/api/admin/releases"))
  ).json();
  assert.equal(second.releases.length, 1);
  assert.deepEqual(second.releases[0].releaseNotes, [
    "Reviewed operator notes",
  ]);
  assert.equal(second.releases[0].downloads, 1);
});

test("archived or deleted bundled release does not resurrect on future requests", async () => {
  state.env.DISABLE_BUNDLED_RELEASE = "0";
  const first = (await (await routes.public.GET()).json()).release;
  signIn();
  assert.equal((await patch(first.id, { status: "archived" })).status, 200);
  assert.equal((await (await routes.public.GET()).json()).release, null);
  assert.equal(
    (await routes.download.GET(request(first.downloadUrl), params(first.id)))
      .status,
    404,
  );
  assert.equal(
    (
      await routes.download.HEAD(
        request(first.downloadUrl, "HEAD"),
        params(first.id),
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await routes.release.DELETE(
        request(`/api/admin/releases/${first.id}`, "DELETE"),
        params(first.id),
      )
    ).status,
    200,
  );
  assert.equal((await (await routes.public.GET()).json()).release, null);
  assert.equal(
    sqlite.prepare("SELECT COUNT(*) AS count FROM releases").get().count,
    0,
  );
  assert.equal(objects.size, 0);
  assert.ok(
    sqlite
      .prepare("SELECT key FROM content WHERE key = ?")
      .get(`bundled-release:${first.id}`),
  );
});

test("bundled registration preserves an existing active release and ignores version conflicts", async () => {
  signIn();
  const existing = (await (await upload(99)).response.json()).release;
  assert.equal(
    (await patch(existing.id, { status: "published", active: true })).status,
    200,
  );
  state.env.DISABLE_BUNDLED_RELEASE = "0";
  const publicData = await (await routes.public.GET()).json();
  assert.equal(publicData.release.id, existing.id);
  assert.equal(publicData.releases.length, 2);
  assert.equal(publicData.releases.filter((item) => item.active).length, 1);
});

test("missing bundled R2 file fails closed and is not resurrected after initialization", async () => {
  state.env.DISABLE_BUNDLED_RELEASE = "0";
  const first = (await (await routes.public.GET()).json()).release;
  objects.clear();
  assert.equal(
    (await routes.download.GET(request(first.downloadUrl), params(first.id)))
      .status,
    503,
  );
  assert.equal(
    (
      await routes.download.HEAD(
        request(first.downloadUrl, "HEAD"),
        params(first.id),
      )
    ).status,
    503,
  );
  signIn();
  assert.equal(
    (await patch(first.id, { status: "published", active: true })).status,
    409,
  );
  assert.equal(
    sqlite.prepare("SELECT downloads FROM releases WHERE id = ?").get(first.id)
      .downloads,
    0,
  );
  assert.equal(objects.size, 0);
});

test("bundled seed never overwrites a stored version-code conflict", async () => {
  signIn();
  const stored = (
    await (
      await upload(
        JSON.parse(readFileSync("lib/content/bundled-release.json", "utf8"))
          .versionCode,
      )
    ).response.json()
  ).release;
  state.env.DISABLE_BUNDLED_RELEASE = "0";
  await routes.public.GET();
  const list = await (
    await routes.releases.GET(request("/api/admin/releases"))
  ).json();
  assert.equal(list.releases.length, 1);
  assert.equal(list.releases[0].id, stored.id);
  assert.equal(list.releases[0].sha256, stored.sha256);
  assert.equal(list.releases[0].status, "draft");
  assert.equal((await (await routes.public.GET()).json()).release, null);
});
