# Deployment dan checklist peluncuran

## Target yang didukung

Hasil build adalah Cloudflare Worker ES module pada `dist/server/index.js`, beserta aset dan konfigurasi build. `.openai/hosting.json` menyimpan identitas proyek Sites serta binding D1 `DB` dan R2 `BUCKET`. Simpan identitas tersebut, jangan membuat proyek Sites baru untuk pembaruan situs yang sama.

Situs dibuat private untuk review. Mengunggah source atau menyiapkan build tidak menyatakan produk sudah diluncurkan kepada publik. Perubahan audience harus diminta pemilik secara eksplisit. APK release 1.0.1 bertanda tangan sudah tersedia. Domain final, pengujian perangkat, kontak operasional, dan ketentuan layanan tetap perlu diselesaikan sebelum pembukaan publik.

## Konfigurasi

| Variabel                      | Kebutuhan                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`                    | Origin HTTPS final untuk metadata, canonical, sitemap; gunakan origin lokal saat development                              |
| `ADMIN_USER_IDS`              | ID akun Sites yang diberi hak admin, dipisahkan koma; kosong menolak seluruh admin                                        |
| `RELEASE_VERIFICATION_KEY`    | Secret HMAC minimum 32 karakter, sama dengan mesin penerbit                                                               |
| `ANDROID_SIGNING_CERT_SHA256` | Fingerprint sertifikat penerbit resmi, 64 hex tanpa titik dua                                                             |
| `APK_EXPECTED_PACKAGE`        | `com.bulmartech.danakeluarga` untuk upload release saat ini                                                               |
| `GOOGLE_PLAY_URL`             | Opsional setelah listing resmi ada; hanya URL HTTPS pada `play.google.com`; kosong/tidak valid menyembunyikan tautan toko |

Variabel runtime produksi disimpan melalui environment variables Sites. Jangan menaruh secret di `.openai/hosting.json`, source, screenshot, browser, `NEXT_PUBLIC_*`, atau repository. `.env.local` dan `.dev.vars` hanya untuk lokal dan diabaikan Git; berkas `.example` hanya berisi nama/penjelasan tanpa secret.

Build metadata memakai `SITE_URL`; setelah mengubah domain, sesuaikan nilai build dan runtime lalu build/deploy ulang agar canonical, Open Graph, sitemap, dan QR mengarah ke origin yang benar. QR pengunjung mengarah ke pusat unduhan pada origin website yang sedang dibuka.

## Identitas administrator

1. Masuk melalui `/admin` pada Site yang benar. Jika belum ada allowlist, login tetap tidak memberikan izin pengelolaan.
2. Ambil ID akun sendiri dari status sesi admin/`GET /api/admin/session`. ID bersifat spesifik Site; jangan menggantinya dengan email.
3. Pemilik/operator deployment memasukkan ID tersebut ke `ADMIN_USER_IDS` runtime dan menerapkan deployment yang memakai konfigurasi tersebut.
4. Uji akun yang diizinkan, akun yang tidak diizinkan, dan pengunjung tanpa signin. Seluruh operasi admin harus ditolak untuk dua kategori terakhir.

Jangan memasukkan `local_seedy` ke produksi. Jangan mengasumsikan pemilik atau pengguna ChatGPT yang signin otomatis berhak mengelola website. Signin platform dan peran admin website adalah dua pemeriksaan berbeda.

## Build, migration, dan publikasi Sites

```sh
npm ci
npx tsc --noEmit
npm run build
```

Build juga menyiapkan modul server privat dari `artifacts/releases/dana-keluarga-1.0.1-release-3505b637.apk`; simpan binary canonical dan manifest `lib/content/bundled-release.json` yang cocok dalam sumber deployment. File keystore/password tetap di luar proyek website.

Ketika schema berubah, jalankan `npm run db:generate`, tinjau SQL dan metadata migration, lalu commit bersama source. Migration yang sudah diterapkan tidak boleh diubah; buat migration berikutnya. Uji pada D1 lokal sebelum deployment. Jangan menjalankan CREATE/ALTER tabel dari handler request.

Publikasi melalui workflow Sites menyinkronkan source yang sama ke repository Site, membuat arsip dari commit terverifikasi, menyimpan versi, menerapkan migration produksi, dan menerbitkan Worker. Situs owner-private memakai operasi deployment private; audience lainnya mengikuti kebijakan Site. Simpan hasil ID deployment, nomor versi, commit, dan URL; tunggu status terminal berhasil sebelum menyatakan deployment selesai.

Untuk custom domain, tambahkan domain melalui pengelolaan Sites, terapkan DNS yang benar-benar dikembalikan layanan, lalu tunggu validasi DNS/sertifikat. Jangan mengarang CNAME/IP. Gunakan HTTPS dan redirect HTTP pada pengaturan platform/domain. Uji signin dan mutasi same-origin melalui domain final.

`npm run preview:build` hanya preview build lokal. Jangan menjalankan `wrangler deploy` langsung ke origin publik tanpa meninjau ulang autentikasi: aplikasi mempercayai identitas yang diberikan dispatch Sites. Pengganti hosting harus menyediakan verifikasi identitas dan stripping header klien yang setara, bukan sekadar menyalin URL Worker.

## Penyimpanan dan batas unggahan

D1 menyimpan metadata dan audit; R2 menyimpan objek `apks/…` serta `screenshots/…`. Tidak diperlukan akses publik bucket. Konfigurasikan backup database dan objek secara terpisah dan uji restore keduanya. Cadangan satu komponen saja tidak cukup untuk memulihkan unduhan.

Bootstrap pertama memeriksa APK bawaan, menyimpannya ke R2, dan mendaftarkan release 1.0.1 di D1. Endpoint unduhannya `/api/download/bundled-3505b6377e3e8e63` menghormati status publikasi dan menghitung permintaan GET. Penanda bootstrap dipertahankan agar pengarsipan/penghapusan admin tidak dibatalkan oleh request atau deployment berikutnya. Jangan menghapus penanda sebagai maintenance biasa. Tidak ada unduhan APK statis yang melewati pengelolaan status.

APK maksimum **20 MiB**, screenshot **5 MiB**; API membatasi body sebelum parsing, dengan ruang multipart untuk metadata. Jika reverse proxy/WAF tambahan dipakai, izinkan multipart hingga batas API beserta overhead tanpa membuka batas berlebihan. Worker tetap memiliki batas memori; untuk APK lebih besar perlu perubahan desain upload, bukan hanya konfigurasi proxy.

## Wajib sebelum peluncuran publik

- [x] APK release 1.0.1 bertanda tangan, non-debug, sudah diverifikasi dengan SDK.
- [ ] Pemasangan dan pembaruan release diuji pada perangkat Android yang didukung.
- [x] Package artefak release telah diverifikasi: `com.bulmartech.danakeluarga`. APK debug lama memiliki package berbeda dan bukan jalur pembaruan langsung.
- [x] Signer release 1.0.1 cocok dengan sertifikat pemilik yang sudah ada; SHA-256 APK telah diverifikasi.
- [ ] Konfigurasi verifikasi untuk upload berikutnya diselaraskan antara mesin penerbit dan runtime.
- [ ] Admin produksi disahkan melalui `ADMIN_USER_IDS`; simulasi lokal tidak aktif di production build.
- [ ] Secret verifikasi disimpan aman dan sama pada operator/server; keystore tidak pernah diunggah.
- [ ] Domain/HTTPS/metadata/QR benar, termasuk canonical dan sitemap; tidak ada tautan toko kosong atau fiktif.
- [ ] D1 migration selesai; R2 tersedia; backup/restore dan penarikan rilis diuji.
- [ ] Tanggal, versi, ukuran, minimum Android, release notes, riwayat, serta counter berasal dari sistem/artefak nyata.
- [ ] Screenshot publik asli, provenance jelas, izin publikasi dan data pribadi diperiksa.
- [ ] Kontak bantuan aktif dan disetujui; prosedur kendala instalasi/pembaruan ditetapkan.
- [ ] `/privasi` dan `/ketentuan` ditinjau; identitas/alamat pengelola, kontak data, retensi, tanggal berlaku, dan ketentuan operasional dilengkapi. Setelah disahkan, perbarui status draf dan noindex melalui source yang ditinjau.
- [ ] Desktop/tablet/mobile, navigasi/accordion, QR, APK, authorization, upload, error, broken link dan build diverifikasi. Hasil/limit pengujian didokumentasikan.

## Distribusi Google Play kemudian

Manajemen APK tidak bergantung pada Play Store. Setelah ada listing resmi, isi `GOOGLE_PLAY_URL` dengan URL HTTPS pada `play.google.com` lalu build/deploy ulang. URL kosong atau tidak valid tidak menampilkan tombol toko. Tidak diperlukan penggantian sistem rilis. Tetap pertahankan status APK dan URL toko secara terpisah. Listing iOS/App Store tidak ditampilkan sampai informasi distribusi yang sah tersedia.
