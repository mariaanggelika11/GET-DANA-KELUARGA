declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    DISABLE_BUNDLED_RELEASE?: string;
    BUCKET?: R2Bucket;
    ADMIN_USER_IDS?: string;
    RELEASE_VERIFICATION_KEY?: string;
    ANDROID_SIGNING_CERT_SHA256?: string;
    APK_EXPECTED_PACKAGE?: string;
    SITE_URL?: string;
  }
}
