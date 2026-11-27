#!/usr/bin/env node
/** Verifies a real signed release using Android SDK Build Tools; never signs an APK. */
import { execFileSync } from "node:child_process";
import { createHash, createHmac } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [apkInput, outputInput] = process.argv.slice(2);
function fail(message) {
  console.error(message);
  process.exit(1);
}
if (!apkInput || !outputInput || process.argv.length !== 4)
  fail(
    "Pemakaian: node scripts/verify-apk.mjs /path/release.apk /path/verification.json",
  );
const secret = process.env.RELEASE_VERIFICATION_KEY;
const trustedSigner = process.env.ANDROID_SIGNING_CERT_SHA256?.replaceAll(
  ":",
  "",
).toLowerCase();
const expectedPackage = process.env.APK_EXPECTED_PACKAGE;
if (
  !secret ||
  secret.length < 32 ||
  !trustedSigner ||
  !/^[a-f0-9]{64}$/.test(trustedSigner) ||
  !expectedPackage
)
  fail(
    "Konfigurasikan RELEASE_VERIFICATION_KEY (minimum 32 karakter), ANDROID_SIGNING_CERT_SHA256 (64 hex), dan APK_EXPECTED_PACKAGE melalui environment.",
  );
const apk = resolve(apkInput);
const output = resolve(outputInput);
if (apk === output) fail("File hasil verifikasi harus berbeda dari APK.");
try {
  const bytes = readFileSync(apk);
  if (
    bytes.length > 20 * 1024 * 1024 ||
    bytes[0] !== 0x50 ||
    bytes[1] !== 0x4b ||
    bytes[2] !== 3 ||
    bytes[3] !== 4
  )
    fail("APK harus berupa arsip Android asli dengan ukuran maksimum 20 MiB.");
  const certificate = execFileSync(
    process.env.APKSIGNER_BIN || "apksigner",
    ["verify", "--verbose", "--print-certs", apk],
    {
      encoding: "utf8",
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const signers = [
    ...new Set(
      [
        ...certificate.matchAll(
          /certificate SHA-256 digest:\s*([a-fA-F0-9]+)/g,
        ),
      ].map((m) => m[1].toLowerCase()),
    ),
  ];
  const signerCount = Number(
    certificate.match(/Number of signers:\s*(\d+)/)?.[1],
  );
  if (signerCount !== 1 || signers.length !== 1 || signers[0] !== trustedSigner)
    fail(
      "Sertifikat APK tidak sesuai fingerprint resmi, atau APK memiliki beberapa penandatangan.",
    );
  if (/CN\s*=\s*Android Debug/i.test(certificate))
    fail("APK bertanda tangan Android Debug ditolak.");
  const badging = execFileSync(
    process.env.AAPT_BIN || "aapt",
    ["dump", "badging", apk],
    {
      encoding: "utf8",
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const metadata = badging.match(
    /package: name='([^']+)' versionCode='(\d+)' versionName='([^']*)'/,
  );
  const minSdk = Number(badging.match(/sdkVersion:'(\d+)'/)?.[1]);
  if (!metadata || metadata[1] !== expectedPackage)
    fail("Package ID APK tidak cocok dengan APK_EXPECTED_PACKAGE.");
  if (/application-debuggable/.test(badging))
    fail("Build debuggable ditolak. Gunakan APK release.");
  if (!Number.isSafeInteger(minSdk) || minSdk < 24 || minSdk > 100)
    fail("minSdk APK tidak sesuai dukungan aplikasi (minimum SDK 24).");
  const versionCode = Number(metadata[2]);
  if (
    !Number.isSafeInteger(versionCode) ||
    versionCode < 1 ||
    !metadata[3] ||
    metadata[3].length > 60
  )
    fail("Versi APK tidak valid.");
  const androidVersions = {
    24: "7.0",
    25: "7.1",
    26: "8.0",
    27: "8.1",
    28: "9",
    29: "10",
    30: "11",
    31: "12",
    32: "12L",
    33: "13",
    34: "14",
    35: "15",
    36: "16",
  };
  const payload = {
    schema: 1,
    packageId: metadata[1],
    sha256: createHash("sha256").update(bytes).digest("hex"),
    fileSize: bytes.length,
    versionName: metadata[3],
    versionCode,
    minSdk,
    minAndroid: androidVersions[minSdk]
      ? `Android ${androidVersions[minSdk]}+`
      : `Android API ${minSdk}+`,
    signerSha256: signers[0],
    debuggable: false,
    verifiedAt: new Date().toISOString(),
  };
  const signature = createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
  writeFileSync(
    output,
    JSON.stringify({ payload, signature }, null, 2) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    `APK release terverifikasi: ${payload.packageId} v${payload.versionName} (${versionCode}).`,
  );
  console.log(`SHA-256: ${payload.sha256}`);
  console.log(
    `Bukti verifikasi ditulis ke ${output}. Unggah bersama APK melalui admin.`,
  );
} catch (error) {
  if (error?.code === "ENOENT")
    fail(
      "APK atau Android SDK Build Tools tidak ditemukan. Atur APKSIGNER_BIN dan AAPT_BIN bila belum berada di PATH.",
    );
  if (error?.code === "EEXIST")
    fail(
      "File hasil sudah ada; gunakan nama file baru agar bukti sebelumnya tidak tertimpa.",
    );
  fail(
    "Verifikasi APK gagal. Periksa signature APK, SDK Build Tools, metadata, dan izin file. Tidak ada APK yang dipublikasikan.",
  );
}
