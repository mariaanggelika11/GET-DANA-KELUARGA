import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareLocalDatabase } from "../scripts/local-database.mjs";
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const initialName = "0000_empty_millenium_guard.sql";
const initial = await readFile(
  path.join(projectRoot, "drizzle", initialName),
  "utf8",
);
async function fixture(fn) {
  const directory = await mkdtemp(
    path.join(tmpdir(), "dana-local-database-test-"),
  );
  const db = new DatabaseSync(":memory:");
  const calls = [];
  const runWrangler = async (args, options = {}) => {
    calls.push(args);
    assert.ok(args.includes("--local"));
    assert.ok(!args.includes("--remote"));
    if (args[1] === "execute") {
      const sql = args[args.indexOf("--command") + 1];
      let results = [];
      if (/^SELECT /i.test(sql)) results = db.prepare(sql).all();
      else {
        db.exec("BEGIN");
        try {
          db.exec(sql);
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      }
      return JSON.stringify([{ results, success: true }]);
    }
    assert.deepEqual(args.slice(0, 3), ["d1", "migrations", "apply"]);
    const config = JSON.parse(
      await readFile(args[args.indexOf("--config") + 1], "utf8"),
    );
    assert.equal(
      config.d1_databases[0].database_id,
      "00000000-0000-4000-8000-000000000000",
    );
    assert.equal(
      config.d1_databases[0].migrations_dir,
      path.join(projectRoot, "drizzle"),
    );
    db.exec(
      "CREATE TABLE IF NOT EXISTS d1_migrations(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE,applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)",
    );
    if (
      !db
        .prepare("SELECT name FROM d1_migrations WHERE name = ?")
        .get(initialName)
    ) {
      db.exec("BEGIN");
      try {
        db.exec(initial);
        db.prepare("INSERT INTO d1_migrations(name) VALUES (?)").run(
          initialName,
        );
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
  };
  const options = {
    projectRoot,
    stateDirectory: path.join(directory, "state"),
    runtimeDirectory: path.join(directory, "runtime"),
    runWrangler,
    log: () => {},
  };
  try {
    await fn({ db, options, calls });
  } finally {
    db.close();
    await rm(directory, { recursive: true, force: true });
  }
}
test("fresh local DB initializes once and repeated launch preserves content", async () =>
  fixture(async ({ db, options }) => {
    assert.equal((await prepareLocalDatabase(options)).adoptedLegacy, false);
    db.prepare(
      "INSERT INTO content(key,value,updated_at) VALUES ('settings','{}','2026-01-01')",
    ).run();
    await prepareLocalDatabase(options);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM d1_migrations").get().n, 1);
    assert.equal(db.prepare("SELECT value FROM content").get().value, "{}");
  }));
test("legacy manual initial schema is adopted without resetting existing rows", async () =>
  fixture(async ({ db, options }) => {
    db.exec(initial);
    db.prepare(
      "INSERT INTO content(key,value,updated_at) VALUES ('settings','{\"saved\":true}','2026-01-01')",
    ).run();
    assert.equal((await prepareLocalDatabase(options)).adoptedLegacy, true);
    assert.equal(
      db.prepare("SELECT value FROM content").get().value,
      '{"saved":true}',
    );
    await prepareLocalDatabase(options);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM d1_migrations").get().n, 1);
  }));
test("partial schema fails before mutation or native migration", async () =>
  fixture(async ({ db, options, calls }) => {
    db.exec(
      "CREATE TABLE content(key TEXT PRIMARY KEY,value TEXT,updated_at TEXT)",
    );
    await assert.rejects(
      prepareLocalDatabase(options),
      /Struktur database lokal berbeda/,
    );
    assert.equal(
      db
        .prepare("SELECT name FROM sqlite_master WHERE name='d1_migrations'")
        .get(),
      undefined,
    );
    assert.equal(
      calls.some((args) => args[1] === "migrations"),
      false,
    );
  }));
test("schema drift after tracked migration is rejected and user data retained", async () =>
  fixture(async ({ db, options }) => {
    await prepareLocalDatabase(options);
    db.exec("ALTER TABLE content ADD COLUMN unexpected TEXT");
    await assert.rejects(
      prepareLocalDatabase(options),
      /Struktur database lokal berbeda/,
    );
    assert.ok(
      db
        .prepare("PRAGMA table_info(content)")
        .all()
        .some((column) => column.name === "unexpected"),
    );
  }));
test("unknown migration history fails closed", async () =>
  fixture(async ({ db, options }) => {
    await prepareLocalDatabase(options);
    db.prepare("INSERT INTO d1_migrations(name) VALUES (?)").run(
      "9999_unknown.sql",
    );
    await assert.rejects(
      prepareLocalDatabase(options),
      /Riwayat migrasi lokal tidak sesuai/,
    );
  }));
