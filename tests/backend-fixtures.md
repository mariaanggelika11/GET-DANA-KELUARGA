# Verifikasi backend dan APK

Pengujian ini memakai fixture privat dan tidak menerbitkan APK aplikasi Dana Keluarga.

## Pengujian tanpa Android SDK

```sh
node --experimental-transform-types --test tests/backend-security.test.mjs
node --test tests/backend-api.test.mjs
```

Node.js 24 direkomendasikan. Tes API menjalankan handler asli dan migrasi SQL asli di SQLite dalam memori. Adaptor R2 dan identitas platform diganti dengan penyimpanan/identitas dalam memori. Tidak ada database produksi, unggahan publik, kredensial, atau data keluarga yang digunakan.

Hasil: 12 tes lulus. Cakupan: otorisasi gagal tertutup, CSRF, batas body yang benar-benar dibaca, bukti HMAC/checksum/paket APK, rilis draft/published/archived, versi aktif tunggal, unduhan byte asli, penghitung permintaan unduhan, penolakan versi duplikat/file hilang, validasi konten, serta unggahan/edit/hapus screenshot.

## Pengujian dengan Android SDK asli

Prasyarat: JDK, Android SDK Build Tools (`aapt`, `apksigner`) dan setidaknya satu platform `android.jar`. Script mendeteksi SDK macOS secara default; set `ANDROID_SDK_ROOT` dan `JAVA_HOME` bila lokasinya berbeda.

```sh
node scripts/test-apk-fixture.mjs
```

Script membuat aplikasi minimal `test.danakeluarga.verification`, sertifikat uji berumur dua hari, dan keystore sementara. `aapt` membuat APK nyata dan `apksigner` menandatanganinya. Script menjalankan `verify-apk.mjs`, lalu memastikan APK dengan signer salah, package salah, flag debuggable, dan byte yang diubah ditolak. Kunci HMAC dibuat acak untuk tes. Semua artefak dibersihkan; keystore selalu dihapus.

Hasil: 5 pemeriksaan lulus menggunakan Build Tools 37.0.0. Pengujian ini juga memvalidasi format keluaran sertifikat apksigner generasi terbaru.

Gunakan `--keep` hanya untuk mempertahankan APK dan bukti JSON privat agar dapat diuji lewat admin lokal. Package fixture berbeda dari aplikasi asli. Jangan unggah fixture ke produksi atau menyebutnya rilis Dana Keluarga.

Untuk pengujian lokal yang memang membutuhkan kunci HMAC dari `.dev.vars`, jalankan secara eksplisit:

```sh
TEST_USE_LOCAL_DEV_KEY=1 node scripts/test-apk-fixture.mjs --keep
```

Output hanya berisi lokasi artefak serta package/fingerprint publik. Kunci rahasia tidak ditulis ke output. Atur signer dan package fixture pada konfigurasi lokal saja, lalu mulai ulang server. Setelah pengujian admin lokal, hapus rilis/screenshot fixture, pulihkan konfigurasi identitas APK asli, dan bersihkan artefak sementara. Jangan menyalin konfigurasi uji ke environment produksi.

Keberhasilan fixture membuktikan mekanisme verifikasi dan backend; APK resmi Dana Keluarga masih harus dibangun, ditandatangani penerbit, diverifikasi dengan fingerprint resmi, dan diuji pada perangkat Android sebelum diterbitkan.
