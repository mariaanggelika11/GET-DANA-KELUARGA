#!/usr/bin/env node
/** Optional Android SDK integration test. Creates a private throwaway app, never the Dana Keluarga APK. */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import assert from "node:assert/strict";

const keep = process.argv.includes("--keep");
const sdk =
  process.env.ANDROID_SDK_ROOT ||
  process.env.ANDROID_HOME ||
  join(homedir(), "Library/Android/sdk");
const java =
  process.env.JAVA_HOME ||
  "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
const versions = (directory) =>
  existsSync(directory)
    ? readdirSync(directory).sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true }),
      )
    : [];
const tools = versions(join(sdk, "build-tools"))
  .map((version) => join(sdk, "build-tools", version))
  .find(
    (path) =>
      existsSync(join(path, "aapt")) && existsSync(join(path, "apksigner")),
  );
const androidJar = versions(join(sdk, "platforms"))
  .map((version) => join(sdk, "platforms", version, "android.jar"))
  .find(existsSync);
if (!tools || !androidJar || !existsSync(join(java, "bin", "java")))
  throw new Error(
    "Android SDK Build Tools, platform android.jar, and JDK are required. Configure ANDROID_SDK_ROOT and JAVA_HOME.",
  );
const directory = mkdtempSync(join(tmpdir(), "dana-apk-verification-test-"));
const packageId = "test.danakeluarga.verification";
let secret =
  process.env.RELEASE_VERIFICATION_KEY || randomBytes(32).toString("hex");
if (process.env.TEST_USE_LOCAL_DEV_KEY === "1") {
  const match = readFileSync(resolve(".dev.vars"), "utf8").match(
    /^RELEASE_VERIFICATION_KEY=(.+)$/m,
  );
  if (!match)
    throw new Error("No RELEASE_VERIFICATION_KEY found in ignored .dev.vars.");
  secret = match[1].trim().replace(/^['"]|['"]$/g, "");
}
const environment = {
  ...process.env,
  JAVA_HOME: java,
  PATH: `${join(java, "bin")}${delimiter}${process.env.PATH || ""}`,
  APK_TEST_STOREPASS: randomBytes(20).toString("hex"),
  RELEASE_VERIFICATION_KEY: secret,
  APK_EXPECTED_PACKAGE: packageId,
  APKSIGNER_BIN: join(tools, "apksigner"),
  AAPT_BIN: join(tools, "aapt"),
};
const run = (binary, args, extra = {}) =>
  execFileSync(binary, args, {
    env: { ...environment, ...extra },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120000,
    maxBuffer: 4 * 1024 * 1024,
  });
const verifier = resolve("scripts/verify-apk.mjs");
const keystore = join(directory, "test-only.p12");
const apk = join(directory, "test-only-release.apk");
const receipt = join(directory, "test-only-verification.json");
try {
  run(join(java, "bin", "keytool"), [
    "-genkeypair",
    "-keystore",
    keystore,
    "-storetype",
    "PKCS12",
    "-storepass:env",
    "APK_TEST_STOREPASS",
    "-keypass:env",
    "APK_TEST_STOREPASS",
    "-alias",
    "fixture",
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "2",
    "-dname",
    "CN=Private Release Verification Test,O=Test Only,C=ID",
  ]);
  const manifest = (debuggable) =>
    `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${packageId}" android:versionCode="1" android:versionName="1.0-test"><uses-sdk android:minSdkVersion="24" android:targetSdkVersion="35"/><application android:label="Private verification fixture" android:hasCode="false" android:debuggable="${debuggable}"/></manifest>`;
  function buildApk(debuggable, output) {
    const manifestDirectory = join(directory, `manifest-${debuggable}`);
    mkdirSync(manifestDirectory);
    const manifestFile = join(manifestDirectory, "AndroidManifest.xml");
    writeFileSync(manifestFile, manifest(debuggable));
    const unsigned = join(directory, `unsigned-${debuggable}.apk`);
    run(join(tools, "aapt"), [
      "package",
      "-f",
      "-M",
      manifestFile,
      "-I",
      androidJar,
      "-F",
      unsigned,
    ]);
    run(join(tools, "apksigner"), [
      "sign",
      "--ks",
      keystore,
      "--ks-key-alias",
      "fixture",
      "--ks-pass",
      "env:APK_TEST_STOREPASS",
      "--key-pass",
      "env:APK_TEST_STOREPASS",
      "--out",
      output,
      unsigned,
    ]);
  }
  buildApk(false, apk);
  const output = run(join(tools, "apksigner"), [
    "verify",
    "--verbose",
    "--print-certs",
    apk,
  ]);
  const signerSha256 = output
    .match(/certificate SHA-256 digest:\s*([a-fA-F0-9]+)/)?.[1]
    .toLowerCase();
  assert.match(signerSha256, /^[a-f0-9]{64}$/);
  environment.ANDROID_SIGNING_CERT_SHA256 = signerSha256;
  run(process.execPath, [verifier, apk, receipt]);
  const proof = JSON.parse(readFileSync(receipt, "utf8"));
  assert.equal(proof.payload.packageId, packageId);
  assert.equal(proof.payload.debuggable, false);
  assert.equal(proof.payload.minAndroid, "Android 7.0+");
  assert.throws(() =>
    run(
      process.execPath,
      [verifier, apk, join(directory, "wrong-signer.json")],
      { ANDROID_SIGNING_CERT_SHA256: "0".repeat(64) },
    ),
  );
  assert.throws(() =>
    run(
      process.execPath,
      [verifier, apk, join(directory, "wrong-package.json")],
      { APK_EXPECTED_PACKAGE: "com.wrong.package" },
    ),
  );
  const debug = join(directory, "test-only-debug.apk");
  buildApk(true, debug);
  assert.throws(() =>
    run(process.execPath, [verifier, debug, join(directory, "debug.json")]),
  );
  const tampered = join(directory, "test-only-tampered.apk");
  const bad = readFileSync(apk);
  bad[Math.floor(bad.length / 2)] ^= 0xff;
  writeFileSync(tampered, bad);
  assert.throws(() =>
    run(process.execPath, [
      verifier,
      tampered,
      join(directory, "tampered.json"),
    ]),
  );
  // Remove the keystore even with --keep; no signing credentials are retained.
  rmSync(keystore, { force: true });
  console.log(
    JSON.stringify(
      {
        passed: [
          "real signed release accepted",
          "wrong signer rejected",
          "wrong package rejected",
          "debuggable build rejected",
          "tampered APK rejected",
        ],
        kept: keep,
        ...(keep ? { directory, apk, receipt, signerSha256, packageId } : {}),
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(keystore, { force: true });
  if (!keep) rmSync(directory, { recursive: true, force: true });
}
