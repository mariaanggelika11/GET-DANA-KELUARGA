# APK release Dana Keluarga 1.0.0

APK universal dibuat dari AAB release yang sudah ada pada proyek aplikasi, bukan dari APK debug dan bukan dengan mengganti nama file. Proses memakai bundletool 1.18.3 serta kunci penandatangan milik penerbit yang sudah tersedia; tidak membuat keystore baru atau mengubah source aplikasi Android.

- Versi: 1.0.0, version code 1.
- Package: `com.bulmartech.danakeluarga`.
- Minimum: Android 7.0 / SDK 24.
- APK tidak memiliki flag debuggable; signer bukan Android Debug.
- Verifikasi apksigner berhasil dan fingerprint signer cocok dengan sertifikat penerbit yang ada.
- Fingerprint sertifikat SHA-256: `86259bebb0301dc8029b81a4d58c8edbab54923478143424fe6a764344bfa77b`.
- Ukuran file: 3347620 byte.
- Checksum APK SHA-256: `8309b6da25dd36c728cc527f1516cf496b3033898668a28f1b24d8603a746dea`.
- File distribusi: `artifacts/releases/dana-keluarga-1.0.0-release-8309b6da.apk`.
- Endpoint unduhan: `/api/download/bundled-8309b6da25dd36c7`.
- Tanggal rilis pada metadata website adalah tanggal penerbitan APK melalui website (2026-11-27), bukan tanggal pembuatan AAB atau klaim rilis Play Store.

Password hanya dibaca programatis dari konfigurasi privat, disalurkan melalui file sementara berizin 0600, lalu segera dihapus. Tidak ada password, keystore, atau file signing privat yang disalin ke website. AAB dan semua masukan signing dibandingkan hash-nya sebelum/sesudah dan tetap identik.

Package release ini berbeda dari APK debug lama (`id.danakeluarga.app`). Karena itu, jangan menjanjikan pembaruan langsung menggantikan instalasi debug lama atau menghapus data aplikasi tersebut. Pengujian pemasangan pada perangkat Android nyata masih perlu dilakukan penerbit.

Binary canonical disertakan pada artefak proyek. Persiapan build membentuk modul server privat dari binary tersebut. Bootstrap memeriksa integritas sebelum menyimpan ke R2 privat dan mendaftarkan metadata D1 satu kali; penghitung permintaan unduhan berasal dari D1. Penanda bootstrap mencegah rilis yang diarsipkan/dihapus diterbitkan ulang otomatis. Tidak ada APK release yang disajikan langsung dari public/downloads.

Distribusi melalui website tidak mensyaratkan publikasi lewat Play Console; [panduan Android](https://developer.android.com/studio/publish) menyediakan distribusi APK melalui website sebagai pilihan. Ini tetap APK release bertanda tangan, bukan APK debug yang diberi nama ulang.
