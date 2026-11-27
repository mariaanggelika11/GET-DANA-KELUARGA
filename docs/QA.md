# Verifikasi implementasi

Pemeriksaan dilakukan 27 November 2026. APK release Dana Keluarga 1.0.0 kini tersedia dan telah diverifikasi dengan Android SDK. Pengujian awal sistem distribusi menggunakan fixture privat yang terpisah; fixture dan data pengujian tersebut tidak diterbitkan sebagai aplikasi Dana Keluarga.

## Hasil yang telah diverifikasi

- TypeScript tanpa error dan build Worker produksi berhasil.
- 12 tes backend/security: handler asli, migrasi SQLite asli, adaptor identitas/R2 dalam memori. Mencakup auth/allowlist, CSRF, batas unggah, receipt HMAC/checksum/package, draft/published/archived, versi aktif, metadata, download/count, file hilang, konten, screenshot.
- 5 pemeriksaan Android SDK asli menggunakan aapt/apksigner Build Tools 37: release valid diterima; signer, package, debuggable, dan file yang dimodifikasi ditolak.
- Browser Chrome dan WebKit: viewport 320, 390, 768, 1024, 1440; navigasi/menu seluler, accordion FAQ, anchor, halaman privasi/ketentuan, sitemap/robots, tanpa overflow atau error JavaScript.
- QR Code PNG didekode secara programatis pada kelima viewport; hasil sesuai origin website dan `/#download`.
- Axe WCAG 2/2.1 A/AA landing page: 0 pelanggaran pada kelima viewport. Halaman legal: 0 pelanggaran pada 390 dan 1440. Ini pemeriksaan otomatis, bukan audit aksesibilitas manual menyeluruh.
- 13 pemeriksaan browser admin: signin, API401, statistik aktual, FAQ save/restore, screenshot upload/media/edit/delete, navigasi seluler, ukuran 390/768/1440, validasi APK, tanpa error browser.
- Admin: 10 pemindaian axe tanpa pelanggaran WCAG A/AA pada login dan seluruh tab (390/1440).
- Alur rilis nyata pada server lokal: APK fixture ditandatangani → verifikasi SDK → receipt → upload melalui form admin → draft tidak dapat diunduh → publish/aktif → metadata publik → browser mengunduh attachment → bytes/checksum sesuai → counter bertambah → arsip menghasilkan404. Fixture kemudian dihapus.

## Menjalankan ulang

```sh
npm run check
npm test
npm run test:site
npm run test:admin
npm run test:admin:a11y
node scripts/test-apk-fixture.mjs
```

Tes browser memerlukan server development yang sudah dimigrasi dan browser Playwright (`npx playwright install chromium`), atau set `CHROME_EXECUTABLE` ke browser Chrome lokal. `TEST_BASE_URL` untuk landing dan `BASE_URL` untuk admin dapat menunjuk server pengujian. Tes admin membutuhkan konfigurasi development eksplisit `ADMIN_USER_IDS=local_seedy`, mengubah data sementara, lalu memulihkannya. Gunakan database pengujian; jangan jalankan tes yang memodifikasi konten terhadap production.

`tests/release-e2e.mjs` hanya mengizinkan127.0.0.1 dan memerlukan `TEST_APK`/`TEST_RECEIPT` dari script fixture, beserta signer/package/HMAC pengujian yang sama di `.dev.vars`. Konfigurasi dan artefak uji harus dibersihkan sesudahnya. Detail ada di `tests/backend-fixtures.md`.

## Belum dapat dinyatakan lulus

Instalasi/pembaruan APK release pada perangkat Android fisik, screenshot layar authenticated, verifikasi domain/DNS final, support operasional, dan persetujuan dokumen legal masih perlu dituntaskan. Signature APK release telah diverifikasi; hal itu tidak membuktikan pemasangan pada perangkat fisik. Pengujian browser tidak membuktikan kompatibilitas semua perangkat. Tidak ada skor Lighthouse atau hasil penetration test yang diklaim.

WebKit 27.2 juga lulus lima viewport, navigasi, FAQ, decoding QR, dan axe tanpa pelanggaran. Ini pengujian engine WebKit, bukan pengujian perangkat iOS fisik.

Penanganan error browser diverifikasi: kegagalan penyimpanan menampilkan pesan dan tombol coba lagi tanpa statistik nol palsu. Daftar FAQ yang sengaja dikosongkan admin tidak diganti FAQ bawaan. Konfigurasi HMAC/signer/package pengujian dihapus; rilis dan screenshot fixture lokal berjumlah nol. Source Android tetap bersih.

## Launcher lokal satu perintah

`npm run start` dan launcher macOS disiapkan untuk memasang dependency, membuat konfigurasi lokal yang belum ada, memigrasikan D1 lokal, dan membuka browser setelah API siap. Tidak membutuhkan build awal secara manual.

Verifikasi tambahan: lima tes bootstrap SQLite lulus; integrasi Wrangler nyata lulus pada database baru dan database lama, termasuk pengulangan dengan data tetap tersimpan. Perintah sekali jalan berhasil menyalakan API, pemanggilan kedua memakai server yang sama, Control+C menutup server dan melepaskan lock, serta setup ulang mempertahankan isi konfigurasi lokal. Kedua berkas `.command` telah diperiksa sintaks dan izin eksekusinya. Pengaturan produksi tidak diubah oleh launcher lokal.

## APK release aplikasi saat ini

Versi 0.1.0 yang sempat disediakan adalah APK debug lama. Unduhan tersebut digantikan APK release universal 1.0.0 hasil konversi AAB release yang sudah ditandatangani pemilik. Keberadaan Play Console tidak menentukan apakah file merupakan build debug atau release.

Verifikasi artefak aktual yang telah dilakukan:

- Bundletool 1.18.3 menghasilkan APK universal dari AAB release yang sudah ada.
- Apksigner SDK 37 berhasil memverifikasi signature v2 dengan tepat satu signer, cocok fingerprint sertifikat penerbit `86259bebb0301dc8029b81a4d58c8edbab54923478143424fe6a764344bfa77b`.
- Manifest tidak debuggable; signer bukan Android Debug.
- AAPT menunjukkan versionName 1.0.0 / code 1, package `com.bulmartech.danakeluarga`, minSdk 24.
- Ukuran 3.347.620 byte dan SHA-256 `8309b6da25dd36c728cc527f1516cf496b3033898668a28f1b24d8603a746dea` cocok dengan binary yang disalin.
- Hash AAB, keystore, konfigurasi signing, dan sertifikat masukan tetap identik setelah proses; password sementara dibersihkan.

Artefak canonical berada di `artifacts/releases/`; download melalui endpoint pengelolaan `/api/download/bundled-8309b6da25dd36c7` dengan R2 privat dan metadata/counter D1. Penanda bootstrap menjaga keputusan archive/delete. Pengujian endpoint, bootstrap, serta UI release terbaru dicatat pada hasil test implementasi yang dijalankan untuk perubahan tersebut; jangan menganggap hasil browser APK debug sebelumnya membuktikan APK release telah dipasang pada perangkat fisik.

Tanggal 27 November 2026 pada website adalah tanggal penerbitan website, bukan waktu build AAB sebelumnya atau rilis Play Store. Package release berbeda dari debug lama sehingga pembaruan langsung dari debug tidak dijanjikan. Provenance lengkap: [RELEASE-1.0.0.md](RELEASE-1.0.0.md).

## APK terbaru 1.0.1

File release asli yang ditunjukkan pemilik (build2) menggantikan artefak sebelumnya. Signature v2 valid, sertifikat penerbit sesuai, dan manifest tidak debuggable. Checksum salinan sama dengan APK sumber. Delapan belas tes backend/keamanan/integritas serta TypeScript dan build produksi lulus. Unduhan R2 melalui browser pada390/1440px, nama file, checksum dan aksesibilitas pusat unduhan terverifikasi. Source Android tidak diubah.
