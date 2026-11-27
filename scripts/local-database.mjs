import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const schemaQuery =
  "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type, name";
const migrationTable = `CREATE TABLE IF NOT EXISTS d1_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
)`;

function applicationObjects(rows) {
  return rows.filter(
    (row) =>
      !row.name.startsWith("sqlite_") &&
      !row.name.startsWith("_cf_") &&
      row.name !== "d1_migrations",
  );
}
function normalizeSql(sql) {
  // Compare token spelling while preserving SQL string literals. Only identifier
  // quotes and irrelevant whitespace/case differ between SQLite frontends.
  return sql
    .match(
      /'(?:''|[^'])*'|`[^`]+`|"(?:""|[^"])+"|\[[^\]]+\]|[A-Za-z_][A-Za-z_0-9]*|[^\s]/g,
    )
    .map((token) =>
      token.startsWith("'")
        ? token
        : token.replace(/^`|`$|^"|"$|^\[|\]$/g, "").toLowerCase(),
    )
    .filter((token) => token !== ";")
    .join(" ");
}
function assertSchema(actual, expected) {
  const signatures = (rows) =>
    rows
      .map(({ type, name, sql }) => `${type}:${name}:${normalizeSql(sql)}`)
      .sort();
  if (
    JSON.stringify(signatures(actual)) !== JSON.stringify(signatures(expected))
  ) {
    throw new Error(
      "Struktur database lokal berbeda atau migrasi lama belum lengkap. Data tetap dipertahankan. Tinjau database/migrasi atau gunakan direktori data lokal baru; launcher tidak menghapus database Anda.",
    );
  }
}
function parseResults(stdout) {
  let data;
  try {
    data = JSON.parse(stdout.trim());
  } catch {
    const json = stdout
      .replace(/\u001b\[[0-9;]*m/g, "")
      .match(/(\[\s*\{[\s\S]*\}\s*\])\s*$/)?.[1];
    if (!json)
      throw new Error("Respons pemeriksaan database lokal tidak dapat dibaca.");
    data = JSON.parse(json);
  }
  if (
    !Array.isArray(data) ||
    data.some((result) => result.success === false) ||
    !Array.isArray(data[0]?.results)
  ) {
    throw new Error("Pemeriksaan database lokal tidak berhasil.");
  }
  return data[0].results;
}
async function expectedObjects(migrations) {
  const { DatabaseSync } = await import("node:sqlite");
  const database = new DatabaseSync(":memory:");
  try {
    for (const migration of migrations) database.exec(migration.sql);
    return applicationObjects(database.prepare(schemaQuery).all());
  } finally {
    database.close();
  }
}

/** Prepare only local D1 storage. No remote connection or production manifest change. */
export async function prepareLocalDatabase({
  projectRoot,
  stateDirectory = path.join(projectRoot, ".wrangler/state"),
  runtimeDirectory = path.join(projectRoot, ".sites-runtime/local-run"),
  runWrangler,
  log = console.log,
}) {
  if (typeof runWrangler !== "function")
    throw new TypeError("runWrangler diperlukan.");
  projectRoot = path.resolve(projectRoot);
  stateDirectory = path.resolve(stateDirectory);
  runtimeDirectory = path.resolve(runtimeDirectory);
  const migrationsDirectory = path.join(projectRoot, "drizzle");
  const journal = JSON.parse(
    await readFile(
      path.join(migrationsDirectory, "meta/_journal.json"),
      "utf8",
    ),
  );
  if (!Array.isArray(journal.entries) || !journal.entries.length)
    throw new Error("Daftar migrasi database belum tersedia.");
  const migrations = await Promise.all(
    journal.entries.map(async ({ tag }) => {
      if (typeof tag !== "string" || !/^[A-Za-z0-9_-]+$/.test(tag))
        throw new Error("Nama migrasi database tidak valid.");
      return {
        name: `${tag}.sql`,
        sql: await readFile(
          path.join(migrationsDirectory, `${tag}.sql`),
          "utf8",
        ),
      };
    }),
  );
  await mkdir(runtimeDirectory, { recursive: true });
  await mkdir(stateDirectory, { recursive: true });
  const configPath = path.join(runtimeDirectory, "wrangler.json");
  await writeFile(
    configPath,
    JSON.stringify(
      {
        name: "dana-keluarga-local-database",
        compatibility_date: "2026-05-15",
        d1_databases: [
          {
            binding: "DB",
            database_name: "site-creator-d1",
            database_id: "00000000-0000-4000-8000-000000000000",
            migrations_dir: migrationsDirectory,
          },
        ],
      },
      null,
      2,
    ) + "\n",
  );
  const shared = [
    "DB",
    "--local",
    "--config",
    configPath,
    "--persist-to",
    stateDirectory,
  ];
  const execute = async (sql) =>
    parseResults(
      await runWrangler(
        ["d1", "execute", ...shared, "--command", sql, "--json"],
        { capture: true },
      ),
    );
  const objects = await execute(schemaQuery);
  const application = applicationObjects(objects);
  const hasHistory = objects.some(
    (object) => object.type === "table" && object.name === "d1_migrations",
  );
  const history = hasHistory
    ? await execute("SELECT name FROM d1_migrations ORDER BY id")
    : [];
  let adoptedLegacy = false;
  if (history.length) {
    const names = new Set(history.map((entry) => entry.name));
    const applied = migrations.filter((migration) => names.has(migration.name));
    if (
      applied.length !== names.size ||
      migrations
        .slice(0, names.size)
        .some((migration) => !names.has(migration.name))
    ) {
      throw new Error(
        "Riwayat migrasi lokal tidak sesuai source proyek. Database tidak diubah; gunakan source yang sesuai atau tinjau riwayat migrasi.",
      );
    }
    assertSchema(application, await expectedObjects(applied));
  } else if (application.length) {
    // The original setup used d1 execute --file without a migration ledger.
    // Adopt only its exact initial schema; never replay CREATE against user data.
    assertSchema(application, await expectedObjects([migrations[0]]));
    const initialName = migrations[0].name.replaceAll("'", "''");
    await execute(
      `${migrationTable}; INSERT INTO d1_migrations (name) VALUES ('${initialName}');`,
    );
    adoptedLegacy = true;
    log(
      "Database lokal sebelumnya dikenali. Data dipertahankan dan riwayat migrasi disiapkan.",
    );
  }
  log("Memeriksa migrasi database lokal…");
  await runWrangler(["d1", "migrations", "apply", ...shared]);
  assertSchema(
    applicationObjects(await execute(schemaQuery)),
    await expectedObjects(migrations),
  );
  return { configPath, stateDirectory, adoptedLegacy };
}
