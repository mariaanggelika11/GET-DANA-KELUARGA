# Mengunggah dan menerbitkan APK

## Rilis website saat ini

APK **Dana Keluarga 1.0.1**, build 1, merupakan release non-debug yang dibuat dari AAB release lokal dan ditandatangani menggunakan kunci penerbit yang sudah ada. Package-nya `com.bulmartech.danakeluarga`; fingerprint sertifikat SHA-256 adalah `86259bebb0301dc8029b81a4d58c8edbab54923478143424fe6a764344bfa77b`. Laporan lengkap ada di [RELEASE-1.0.1.md](RELEASE-1.0.1.md).

[Distribusi APK melalui website didukung Android](https://developer.android.com/studio/publish). Play Console bukan langkah yang mengubah build debug menjadi release. Versi 0.1.0 yang sebelumnya ditampilkan memang APK debug; unduhan tersebut kini digantikan release 1.0.1. Perubahan package dari `id.danakeluarga.app` berarti pemasangan release tidak dijanjikan sebagai pembaruan langsung dari APK debug lama. Jangan menyarankan penghapusan data aplikasi lama.

Artefak canonical berada di `artifacts/releases/dana-keluarga-1.0.1-release-3505b637.apk`, dengan metadata pada `lib/content/bundled-release.json`. Persiapan build menghasilkan modul server privat dari binary. Bootstrap server memeriksa integritas, menyimpan APK ke R2 privat, lalu mendaftarkan metadata di D1 satu kali. Unduhan dilayani melalui `/api/download/bundled-3505b6377e3e8e63`, bukan URL file statis publik. Tidak perlu mengunggah keystore ke website.

Penanda bootstrap dipertahankan setelah pengarsipan/penghapusan sehingga rilis yang ditarik tidak dimunculkan ulang otomatis. Jangan menghapus penanda itu sebagai prosedur penarikan atau maintenance biasa. Pengelolaan setelah bootstrap mengikuti rilis admin yang sama.

## Verifikasi dan upload berikutnya

Gunakan APK release yang ditandatangani kunci penerbit; jangan memakai `assembleDebug`, AAB, atau ZIP yang diganti ekstensi. Untuk memperbarui release ini, pertahankan package dan sertifikat yang sama serta naikkan version code. Uji pemasangan/pembaruan pada perangkat Android sebelum distribusi.

Konfigurasi mesin verifikasi dan runtime Worker:

| Variabel                      | Isi                                                                  |
| ----------------------------- | -------------------------------------------------------------------- |
| `APK_EXPECTED_PACKAGE`        | `com.bulmartech.danakeluarga` untuk release saat ini                 |
| `ANDROID_SIGNING_CERT_SHA256` | Fingerprint penerbit 64 hex tanpa titik dua                          |
| `RELEASE_VERIFICATION_KEY`    | Secret acak minimum 32 karakter, sama di mesin verifikasi dan server |

Fingerprint sertifikat berbeda dari checksum APK. Ambil melalui jalur tepercaya; fingerprint yang tercetak dari file yang tidak diketahui asalnya tidak otomatis membuktikan penerbit. Keystore, password signing, dan secret receipt tidak boleh masuk source/browser/log atau dashboard upload.

Pasang Android SDK Build Tools dan JDK pada mesin verifikasi. `apksigner`/`aapt` harus tersedia melalui PATH atau `APKSIGNER_BIN`/`AAPT_BIN`.

```sh
node --env-file=.dev.vars scripts/verify-apk.mjs /path/resmi/dana-keluarga-release.apk /path/privat/verification-1.0.1.json
```

Gunakan nama output baru. Verifier tidak menandatangani APK atau menimpa receipt yang sudah ada. Ia memeriksa satu signer tepercaya, bukan Android Debug, package yang diizinkan, build non-debuggable, version code/name, minimum SDK, ukuran maksimum 20 MiB, dan checksum. Hasilnya JSON metadata + HMAC tanpa secret. Server memverifikasi HMAC dan bytes; Android SDK tidak dijalankan di Worker.

1. Buka `/admin`, signin, dan pastikan ID berada di `ADMIN_USER_IDS` produksi.
2. Pilih APK dan receipt untuk file yang sama. Batas APK 20 MiB, receipt kurang dari 64 KiB.
3. Isi tanggal rilis dan catatan perubahan yang nyata. Tanggal tidak boleh di masa depan.
4. Upload menyimpan file di R2 dan metadata sebagai `draft`. Version code yang sudah ada ditolak.
5. Tinjau lalu publikasikan/aktifkan. Mengaktifkan satu rilis menonaktifkan pilihan utama sebelumnya.
6. Periksa metadata, QR, release notes, unduhan, dan checksum; uji instalasi/pembaruan perangkat.

```sh
shasum -a 256 /path/file-yang-diunduh.apk
```

## Riwayat dan penarikan

`draft` hanya tersedia bagi pengelola; `published` dapat diunduh dan masuk riwayat; `archived` tidak dilayani endpoint download. Untuk menarik file, arsipkan versi melalui admin dan pilih rilis lain yang sesuai bila tersedia. Downgrade belum tentu diterima Android; gunakan build koreksi dengan version code lebih tinggi.

Hapus file hanya sesudah pengarsipan dan backup yang diperlukan. Metadata serta objek hilang, sedangkan audit pengelolaan dan penanda bootstrap tetap diperlukan. Jumlah unduhan menghitung permintaan GET yang diterima layanan, termasuk permintaan ulang; itu bukan instalasi atau pengguna aktif.

## Screenshot, FAQ, dan kontak

Unggah screenshot asli PNG/JPEG/WebP maksimum 5 MiB, maksimal 30 gambar, dengan judul, alt text, dan urutan. Periksa izin publikasi dan data pribadi terlebih dahulu. `login-source.png` bawaan adalah tangkapan frontend asli dalam browser, bukan emulator/perangkat Android; provenance tersedia di [ASSET-PROVENANCE.md](ASSET-PROVENANCE.md).

Hero/tentang, FAQ, email, dan tautan bantuan dapat diubah melalui admin. Tautan bantuan harus HTTPS. Validasi jawaban terhadap implementasi: akun disiapkan admin, transfer berlangsung di luar aplikasi, dan tautan distribusi iOS belum diberikan.
