export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const APK_LIMIT = 20 * 1024 * 1024;
export const IMAGE_LIMIT = 5 * 1024 * 1024;
export function ensure(
  condition: unknown,
  status: number,
  message: string,
): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  ensure(
    origin && origin === new URL(request.url).origin,
    403,
    "Permintaan harus berasal dari website ini.",
  );
  ensure(
    !["cross-site", "none"].includes(
      request.headers.get("sec-fetch-site") ?? "",
    ),
    403,
    "Sumber permintaan ditolak.",
  );
}
export async function boundedBody(request: Request, max: number) {
  const length = request.headers.get("content-length");
  if (length)
    ensure(
      /^\d+$/.test(length) && Number(length) <= max,
      413,
      "Ukuran unggahan melebihi batas.",
    );
  ensure(request.body, 400, "Isi permintaan diperlukan.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new HttpError(413, "Ukuran unggahan melebihi batas.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
export async function jsonBody(request: Request) {
  ensure(
    request.headers.get("content-type")?.split(";")[0] === "application/json",
    415,
    "Gunakan application/json.",
  );
  const bytes = await boundedBody(request, 128 * 1024);
  try {
    const body = JSON.parse(new TextDecoder().decode(bytes));
    ensure(
      body && typeof body === "object" && !Array.isArray(body),
      400,
      "Format data tidak valid.",
    );
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "JSON tidak valid.");
  }
}
export async function multipartBody(request: Request, max: number) {
  ensure(
    request.headers.get("content-type")?.startsWith("multipart/form-data;"),
    415,
    "Gunakan multipart/form-data.",
  );
  const bytes = await boundedBody(request, max);
  try {
    return await new Response(bytes, {
      headers: { "content-type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    throw new HttpError(400, "Format unggahan tidak valid.");
  }
}
export function text(value: unknown, name: string, max = 300, min = 1): string {
  ensure(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.trim().length <= max,
    400,
    `${name} tidak valid.`,
  );
  return value.trim();
}
export function date(value: unknown) {
  const v = text(value, "Tanggal rilis", 10);
  ensure(
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().startsWith(v),
    400,
    "Tanggal rilis tidak valid.",
  );
  ensure(
    v <=
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
        new Date(),
      ),
    400,
    "Tanggal rilis tidak boleh di masa depan.",
  );
  return v;
}
export function notes(value: unknown): string[] {
  ensure(
    Array.isArray(value) && value.length > 0 && value.length <= 30,
    400,
    "Isi 1–30 catatan rilis.",
  );
  return value.map((item) => text(item, "Catatan rilis", 1500));
}
export function id(value: string) {
  ensure(/^[a-zA-Z0-9-]{1,80}$/.test(value), 400, "ID tidak valid.");
  return value;
}
export async function sha256(bytes: Uint8Array) {
  return hex(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}
export function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export interface VerificationPayload {
  schema: 1;
  packageId: string;
  sha256: string;
  fileSize: number;
  versionName: string;
  versionCode: number;
  minSdk: number;
  minAndroid: string;
  signerSha256: string;
  debuggable: false;
  verifiedAt: string;
}
export interface VerificationReceipt {
  payload: VerificationPayload;
  signature: string;
}
export function canonicalPayload(p: VerificationPayload) {
  return JSON.stringify({
    schema: p.schema,
    packageId: p.packageId,
    sha256: p.sha256,
    fileSize: p.fileSize,
    versionName: p.versionName,
    versionCode: p.versionCode,
    minSdk: p.minSdk,
    minAndroid: p.minAndroid,
    signerSha256: p.signerSha256,
    debuggable: p.debuggable,
    verifiedAt: p.verifiedAt,
  });
}
export async function verifyReceipt(
  receipt: unknown,
  bytes: Uint8Array,
  secret?: string,
  trustedSigner?: string,
  expectedPackage?: string,
) {
  ensure(
    secret &&
      secret.length >= 32 &&
      trustedSigner &&
      /^[a-fA-F0-9]{64}$/.test(trustedSigner),
    503,
    "Verifikasi APK belum dikonfigurasi oleh pengelola.",
  );
  ensure(
    expectedPackage &&
      /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(expectedPackage),
    503,
    "Package ID APK belum dikonfigurasi.",
  );
  ensure(
    receipt && typeof receipt === "object",
    400,
    "Bukti verifikasi APK diperlukan.",
  );
  const { payload: p, signature } = receipt as VerificationReceipt;
  ensure(
    p &&
      p.schema === 1 &&
      p.packageId === expectedPackage &&
      p.debuggable === false,
    400,
    "Identitas APK atau jenis build tidak sesuai.",
  );
  ensure(
    typeof signature === "string" && /^[a-f0-9]{64}$/.test(signature),
    400,
    "Tanda tangan bukti verifikasi tidak valid.",
  );
  ensure(
    typeof p.sha256 === "string" &&
      /^[a-f0-9]{64}$/.test(p.sha256) &&
      p.fileSize === bytes.length,
    400,
    "Metadata file APK tidak sesuai.",
  );
  ensure(
    typeof p.signerSha256 === "string" &&
      p.signerSha256.toLowerCase() === trustedSigner.toLowerCase(),
    400,
    "Sertifikat penandatangan APK tidak diizinkan.",
  );
  ensure(
    Number.isSafeInteger(p.versionCode) &&
      p.versionCode > 0 &&
      Number.isSafeInteger(p.minSdk) &&
      p.minSdk >= 24 &&
      p.minSdk <= 100,
    400,
    "Versi APK tidak valid.",
  );
  text(p.versionName, "Versi", 60);
  text(p.minAndroid, "Minimum Android", 30);
  ensure(
    typeof p.verifiedAt === "string" && !Number.isNaN(Date.parse(p.verifiedAt)),
    400,
    "Tanggal verifikasi tidak valid.",
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sig = Uint8Array.from(signature.match(/../g)!, (v) => parseInt(v, 16));
  ensure(
    await crypto.subtle.verify(
      "HMAC",
      key,
      sig,
      new TextEncoder().encode(canonicalPayload(p)),
    ),
    400,
    "Bukti verifikasi APK tidak autentik.",
  );
  ensure(
    bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4,
    400,
    "File bukan arsip APK yang valid.",
  );
  ensure(
    (await sha256(bytes)) === p.sha256,
    400,
    "Checksum APK tidak sesuai dengan bukti verifikasi.",
  );
  return p;
}
export function imageType(bytes: Uint8Array) {
  if (
    bytes[0] === 0x89 &&
    new TextDecoder().decode(bytes.slice(1, 4)) === "PNG"
  )
    return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  throw new HttpError(400, "Gunakan gambar PNG, JPEG, atau WebP asli.");
}
