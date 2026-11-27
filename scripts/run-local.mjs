#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const runtimeRoot = path.join(projectRoot, ".sites-runtime");
const launcherLock = path.join(runtimeRoot, "run-local.lock");
const flags = new Set(process.argv.slice(2));
let child;
let lockOwned = false;
let stopping = false;
process.chdir(projectRoot);

function log(message) {
  console.log(`\n[Dana Keluarga] ${message}`);
}
function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
function releaseLock() {
  if (!lockOwned) return;
  try {
    if (JSON.parse(readFileSync(launcherLock, "utf8")).pid === process.pid)
      rmSync(launcherLock);
  } catch {}
  lockOwned = false;
}
function killChild(signal) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  try {
    process.platform === "win32"
      ? child.kill(signal)
      : process.kill(-child.pid, signal);
  } catch {}
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    killChild(signal);
    releaseLock();
    // Give Vite/Miniflare time to close files, ports, and their own lock.
    const timeout = setTimeout(() => {
      killChild("SIGKILL");
      process.exit(signal === "SIGINT" ? 130 : 143);
    }, 5000);
    child?.once("exit", () => {
      clearTimeout(timeout);
      process.exit(signal === "SIGINT" ? 130 : 143);
    });
    if (!child || child.exitCode !== null || child.signalCode !== null)
      process.exit(signal === "SIGINT" ? 130 : 143);
  });
}
process.on("exit", releaseLock);

function launch(binary, args, { capture = false } = {}) {
  let output = "",
    errors = "";
  const owned = spawn(binary, args, {
    cwd: projectRoot,
    env: process.env,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });
  child = owned;
  owned.stdout.on("data", (chunk) => {
    if (capture) output += chunk;
    else process.stdout.write(chunk);
  });
  owned.stderr.on("data", (chunk) => {
    if (capture) errors += chunk;
    else process.stderr.write(chunk);
  });
  const done = new Promise((resolve, reject) => {
    owned.once("error", reject);
    owned.once("exit", (code, signal) => {
      if (child === owned) child = undefined;
      if (code === 0) resolve(output);
      else
        reject(
          new Error(
            stopping
              ? "Server dihentikan."
              : `${path.basename(binary)} gagal (${signal || code}).${capture && errors ? "\n" + errors.slice(-3000) : ""}`,
          ),
        );
    });
  });
  return { process: owned, done };
}
async function runNode(args, options) {
  return launch(process.execPath, args, options).done;
}
async function runNpm(args) {
  if (!process.env.npm_execpath)
    throw new Error(
      "Jalankan melalui npm run start atau JALANKAN-WEBSITE.command.",
    );
  await runNode([process.env.npm_execpath, ...args]);
}
function readServerLock() {
  try {
    const lock = JSON.parse(
      readFileSync(path.join(projectRoot, ".vinext/dev/lock.json"), "utf8"),
    );
    const url = new URL(lock.appUrl);
    if (
      path.resolve(lock.cwd) === path.resolve(projectRoot) &&
      alive(lock.pid) &&
      url.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    )
      return { ...lock, origin: url.origin };
  } catch {}
  return null;
}
async function ready(origin) {
  try {
    const [publicResponse, sessionResponse] = await Promise.all([
      fetch(origin + "/api/public", { signal: AbortSignal.timeout(2500) }),
      fetch(origin + "/api/admin/session", {
        signal: AbortSignal.timeout(2500),
      }),
    ]);
    if (!publicResponse.ok || !sessionResponse.ok) return false;
    const [data, session] = await Promise.all([
      publicResponse.json(),
      sessionResponse.json(),
    ]);
    return (
      Array.isArray(data.releases) &&
      Array.isArray(data.screenshots) &&
      typeof data.settings?.heroTitle === "string" &&
      typeof session.authenticated === "boolean" &&
      typeof session.authorized === "boolean"
    );
  } catch {
    return false;
  }
}
async function openBrowser(origin) {
  if (flags.has("--no-open")) return;
  const [binary, args] =
    process.platform === "darwin"
      ? ["open", [origin]]
      : process.platform === "win32"
        ? ["rundll32.exe", ["url.dll,FileProtocolHandler", origin]]
        : ["xdg-open", [origin]];
  try {
    await new Promise((resolve, reject) => {
      const opener = spawn(binary, args, { stdio: "ignore" });
      opener.once("error", reject);
      opener.once("exit", (code) => (code === 0 ? resolve() : reject()));
    });
  } catch {
    log(`Buka alamat ini di browser: ${origin}`);
  }
}
function showReady(origin, reused = false) {
  log(
    `${reused ? "Website sudah berjalan." : "Website siap digunakan."}\n\n  Website : ${origin}\n  Admin   : ${origin}/admin\n\n${reused ? "Gunakan jendela Terminal yang sudah aktif untuk menghentikan server." : "Biarkan Terminal ini terbuka. Tekan Control+C untuk menghentikan server."}`,
  );
}
function acquireLock() {
  mkdirSync(runtimeRoot, { recursive: true });
  try {
    writeFileSync(launcherLock, JSON.stringify({ pid: process.pid }), {
      flag: "wx",
      mode: 0o600,
    });
    lockOwned = true;
    return true;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    let owner;
    try {
      owner = JSON.parse(readFileSync(launcherLock, "utf8"));
    } catch {
      log("Penyiapan sedang dimulai di jendela lain. Tunggu jendela tersebut.");
      return false;
    }
    if (alive(owner.pid)) {
      log(
        "Penyiapan website sudah berjalan di jendela Terminal lain. Tunggu sampai alamat website muncul.",
      );
      return false;
    }
    rmSync(launcherLock);
    return acquireLock();
  }
}
function installedDependenciesMatch(lock) {
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    );
    return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).every(
      (name) => {
        const installed = JSON.parse(
          readFileSync(
            path.join(projectRoot, "node_modules", name, "package.json"),
            "utf8",
          ),
        );
        return (
          installed.version === lock.packages[`node_modules/${name}`]?.version
        );
      },
    );
  } catch {
    return false;
  }
}
async function installDependencies() {
  const lockBytes = readFileSync(path.join(projectRoot, "package-lock.json"));
  const hash = createHash("sha256").update(lockBytes).digest("hex");
  const marker = path.join(runtimeRoot, "run-local-install.sha256");
  const previous = existsSync(marker)
    ? readFileSync(marker, "utf8").trim()
    : null;
  if (
    !installedDependenciesMatch(JSON.parse(lockBytes)) ||
    (previous && previous !== hash)
  ) {
    log(
      "Memasang dependency. Pada penggunaan pertama, koneksi internet diperlukan.",
    );
    await runNpm(["run", "install:ci"]);
    if (!installedDependenciesMatch(JSON.parse(lockBytes)))
      throw new Error(
        "Pemasangan dependency belum lengkap. Jalankan kembali npm run start.",
      );
  } else log("Dependency sudah siap.");
  writeFileSync(marker, hash + "\n");
}
async function choosePort() {
  const preferred = Number(process.env.DANA_LOCAL_PORT || 5173);
  if (!Number.isInteger(preferred) || preferred < 1024 || preferred > 65515)
    throw new Error("DANA_LOCAL_PORT harus berupa angka 1024–65515.");
  for (let port = preferred; port < preferred + 20; port++) {
    const free = await new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once("error", (error) =>
        ["EADDRINUSE", "EACCES"].includes(error.code)
          ? resolve(false)
          : reject(error),
      );
      probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
    });
    if (free) return port;
  }
  throw new Error(
    "Port lokal sedang penuh. Tutup server yang tidak digunakan atau atur DANA_LOCAL_PORT.",
  );
}
function configureLocal(origin) {
  for (const [name, template] of [
    [".env.local", ".env.example"],
    [".dev.vars", ".dev.vars.example"],
  ]) {
    const target = path.join(projectRoot, name);
    if (existsSync(target)) continue;
    let content = readFileSync(
      path.join(projectRoot, template),
      "utf8",
    ).replace(/^SITE_URL=.*$/m, `SITE_URL=${origin}`);
    if (name === ".dev.vars")
      content = content
        .replace(/^ADMIN_USER_IDS=.*$/m, "ADMIN_USER_IDS=local_seedy")
        .replace(
          /^RELEASE_VERIFICATION_KEY=.*$/m,
          `RELEASE_VERIFICATION_KEY=${randomBytes(32).toString("hex")}`,
        );
    writeFileSync(target, content, { flag: "wx", mode: 0o600 });
    log(`${name} dibuat untuk penggunaan lokal.`);
  }
}
async function main() {
  if (flags.has("--help")) {
    console.log(
      "npm run start [-- --no-open | --setup-only]\nMenyiapkan dependency, konfigurasi, database, dan server lokal.",
    );
    return;
  }
  for (const flag of flags)
    if (!["--no-open", "--setup-only"].includes(flag))
      throw new Error(`Opsi tidak dikenal: ${flag}`);
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13))
    throw new Error("Diperlukan Node.js minimal versi 22.13.");
  const existing = readServerLock();
  if (existing) {
    if (await ready(existing.origin)) {
      showReady(existing.origin, true);
      await openBrowser(existing.origin);
      return;
    }
    throw new Error(
      `Server proyek ini masih aktif di ${existing.origin}, tetapi belum siap. Periksa jendela Terminal server tersebut.`,
    );
  }
  if (!acquireLock()) return;
  log("Menyiapkan website lokal…");
  await installDependencies();
  const port = await choosePort();
  configureLocal(`http://127.0.0.1:${port}`);
  const { prepareLocalDatabase } = await import("./local-database.mjs");
  await prepareLocalDatabase({
    projectRoot,
    log,
    runWrangler: (args, options) =>
      runNode(
        [
          "--import",
          path.join(projectRoot, "scripts/sites-env.mjs"),
          path.join(projectRoot, "node_modules/wrangler/bin/wrangler.js"),
          ...args,
        ],
        options,
      ),
  });
  if (flags.has("--setup-only")) {
    log("Penyiapan selesai. Jalankan npm run start untuk membuka website.");
    return;
  }
  log("Menjalankan server…");
  const server = launch(process.execPath, [
    path.join(projectRoot, "scripts/run-framework.mjs"),
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ]);
  let serverEnded = false;
  server.done.then(
    () => {
      serverEnded = true;
    },
    () => {
      serverEnded = true;
    },
  );
  const deadline = Date.now() + 120000;
  let origin;
  while (!serverEnded && Date.now() < deadline) {
    const lock = readServerLock();
    if (lock?.pid === server.process.pid && (await ready(lock.origin))) {
      origin = lock.origin;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!origin) {
    killChild("SIGTERM");
    await server.done.catch(() => {});
    throw new Error(
      "Server belum siap. Periksa pesan di atas, lalu jalankan kembali npm run start.",
    );
  }
  showReady(origin);
  await openBrowser(origin);
  await server.done;
}
try {
  await main();
} catch (error) {
  if (!stopping) {
    console.error(`\n[Dana Keluarga] ${error.message}`);
    process.exitCode = 1;
  }
} finally {
  releaseLock();
}
