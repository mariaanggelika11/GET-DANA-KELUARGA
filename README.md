# GET-DANA-KELUARGA

Landing page berbahasa Indonesia, pusat unduhan APK Android release, pengelolaan versi, dan admin website. Proyek ini terpisah dari aplikasi Android, backend aplikasi, serta database keuangan keluarga. Distribusi melalui website adalah kanal Android yang didukung; APK release dapat disiapkan dan didistribusikan tanpa menerbitkannya melalui Play Console. Lihat [panduan distribusi Android](https://developer.android.com/studio/publish).

Fitur dan branding awal mengacu pada [repository Dana Keluarga branch Development](https://github.com/mariaanggelika11/DANA-KELUARGA/tree/Development), snapshot commit `a543aece8f0c45e0173875eb2fe39337522b26ee`. Audit tersebut adalah bukti historis source pada saat pemeriksaan. APK release 1.0.1 disalin langsung dari APK release terbaru yang ditunjukkan pemilik; provenance terbarunya ada di [RELEASE-1.0.1.md](docs/RELEASE-1.0.1.md).

## Jalankan dengan satu perintah

Prasyarat: Node.js minimal 22.13 dan npm. Dari folder proyek:

```sh
npm run start
```

Di macOS, klik dua kali `JALANKAN.command` di folder `GET-DANA-KELUARGA`. Folder ini adalah folder kerja utama, dengan branch `development`.

Launcher memasang dependency yang belum tersedia, membuat konfigurasi lokal jika belum ada, menyiapkan migration database lokal, menjalankan website, dan membuka browser. Alamat awalnya `http://127.0.0.1:5173`; port berikutnya dipilih jika digunakan aplikasi lain. Konfigurasi/data yang sudah ada dipertahankan. Pemanggilan ulang memakai server proyek yang masih aktif. Biarkan Terminal terbuka; tekan **Control+C** untuk menghentikan server.

Dashboard ada di `/admin`. Konfigurasi lokal baru menggunakan identitas development `local_seedy` melalui simulasi signin loopback. Identitas tersebut tidak dipakai produksi; semua endpoint admin produksi tetap memerlukan identitas Sites dan allowlist `ADMIN_USER_IDS`. Konfigurasi admin yang sebelumnya sudah ada tetap dihormati.

```sh
npm run start -- --no-open     # Tanpa membuka browser
npm run start -- --setup-only  # Penyiapan lokal saja
```

`DANA_LOCAL_PORT` dapat menentukan port awal. Database/file lokal berada di `.wrangler/state`, terpisah dari produksi. `.env.local`, `.dev.vars`, dan status launcher diabaikan Git. `npm run dev` hanya menjalankan server tanpa penyiapan dependency/database; `npm run preview:build` menjalankan hasil build tanpa simulasi signin development.

## APK release yang tersedia

- Versi **1.0.1**, version code **1**; minimum **Android 7.0**.
- Package `com.bulmartech.danakeluarga`.
- Ukuran **3.299.870 byte**; APK universal, bukan debug.
- Sertifikat penandatangan cocok dengan kunci penerbit yang sudah ada.
- Artefak sumber: `artifacts/releases/dana-keluarga-1.0.1-release-3505b637.apk`.
- Metadata: `lib/content/bundled-release.json`.
- Unduhan: `/api/download/bundled-3505b6377e3e8e63`.

APK dimuat ke penyimpanan R2 privat dan metadata D1 melalui bootstrap server satu kali setelah pemeriksaan integritas. Selanjutnya unduhan memakai endpoint yang sama dengan rilis yang dikelola admin, termasuk penghitung permintaan GET. Penanda bootstrap dipertahankan sehingga versi yang diarsipkan/dihapus admin tidak diterbitkan ulang otomatis. Tidak ada APK yang disajikan langsung dari direktori publik.

Build menghasilkan modul server privat dari binary tersebut. File signing/password tidak disalin ke website. Sebelum membuat build baru, jaga agar binary, manifest versi, serta checksum selaras. APK 0.1.0 sebelumnya memang build debug; unduhan debug lama sudah digantikan release 1.0.1. Package-nya berbeda sehingga pembaruan langsung menggantikan instalasi debug tidak dijanjikan; jangan menghapus data aplikasi lama untuk mengatasi kegagalan pembaruan.

Tanggal **27 November 2026** pada metadata adalah tanggal penerbitan APK melalui website, bukan tanggal pembuatan AAB maupun klaim rilis Play Store. Instalasi/pembaruan pada perangkat Android fisik belum diverifikasi. Rincian signature dan SHA-256 ada di [laporan release](docs/RELEASE-1.0.1.md).

## Teknologi dan pengelolaan

React 19 + TypeScript berjalan pada Vinext/Vite dan Cloudflare Worker. D1 `DB` menyimpan metadata, konten, FAQ, audit, dan penghitung unduhan; R2 `BUCKET` menyimpan APK/gambar privat. Website tidak mengakses database keuangan keluarga.

Admin dapat mengunggah APK release beserta receipt verifikasi, memperbarui release notes/tanggal/status, memilih versi aktif, mengarsipkan versi, melihat penghitung unduhan, serta mengelola screenshot, FAQ, konten, dan kontak bantuan. Setiap operasi diperiksa identitas, allowlist, dan origin-nya di server.

Upload baru masuk sebagai `draft`. Android SDK `apksigner`/`aapt` memeriksa signature, package, flag non-debug, metadata, dan checksum pada mesin penerbit; server memeriksa receipt HMAC yang mengikat bytes APK. `published` dapat diunduh, sedangkan `archived` tidak. Jumlah unduhan adalah jumlah permintaan GET, bukan instalasi atau pengguna unik.

Panduan: [rilis APK](docs/RELEASES.md), [deployment](docs/DEPLOYMENT.md), [maintenance](docs/MAINTENANCE.md), [arsitektur/API](docs/ARCHITECTURE.md), [QA](docs/QA.md), [audit awal](docs/ANDROID-AUDIT.md), [provenance aset](docs/ASSET-PROVENANCE.md).

## Perintah pengembangan

| Perintah                                      | Kegunaan                                    |
| --------------------------------------------- | ------------------------------------------- |
| `npm run start`                               | Setup otomatis dan buka website lokal       |
| `npm run dev`                                 | Server pengembangan Vinext dengan HMR       |
| `npm run build`                               | Persiapan artefak dan build Worker produksi |
| `npm run preview:build`                       | Preview hasil build melalui Wrangler        |
| `npm run db:generate`                         | Migration setelah perubahan schema          |
| `npm run check`                               | Pemeriksaan TypeScript                      |
| `npm test`                                    | Pengujian otomatis proyek                   |
| `node scripts/verify-apk.mjs APK OUTPUT_JSON` | Verifikasi APK dan pembuatan receipt        |

## Sebelum membuka akses publik

APK release dan fingerprint penerbit sudah tersedia dan telah diverifikasi. Yang masih perlu dituntaskan mencakup uji instalasi perangkat, allowlist admin produksi, secret receipt untuk upload berikutnya, domain/HTTPS, kontak bantuan operasional, screenshot Android yang disetujui, serta review `/privasi` dan `/ketentuan`. Dokumen legal masih berstatus draf dan tidak menyatakan kepatuhan tertentu. Gunakan [checklist deployment](docs/DEPLOYMENT.md); audience Site tetap privat sampai pemilik meminta perubahan akses.

`GOOGLE_PLAY_URL` opsional jika kelak ada listing resmi. Distribusi APK website tidak bergantung pada tersedianya listing tersebut. Tautan [Aplikasi Web](https://danakeluarga.bulmar.tech/) tersedia terpisah dari unduhan Android.
