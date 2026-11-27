# Maintenance operator

## Pemeriksaan rutin

- Periksa ketersediaan landing page, API publik, metadata rilis aktif, file APK, gambar, QR, dan tautan bantuan.
- Cocokkan salinan APK unduhan dengan checksum tersimpan setelah rilis dan setelah pemulihan penyimpanan.
- Tinjau akun admin, catatan audit, versi dependency, biaya/kapasitas R2/D1, dan kebijakan backup sesuai kebutuhan operasional yang disahkan pengelola.
- Tinjau fitur/copy/FAQ saat aplikasi berubah. Jangan mempromosikan enum/model fitur masa depan sebagai fungsi yang sudah tersedia.
- Catat nomor versi Site, commit, perubahan schema, dan operator setiap deployment.

## Backup dan pemulihan

Backup D1 harus mencakup tabel releases, screenshots, content dan audit; backup R2 mencakup objek yang dirujuk. Gunakan fasilitas backup/export yang didukung akun penyimpanan. Tentukan retensi, akses, lokasi dan jadwal backup sebelum produksi; tidak ada otomasi backup khusus yang dibuat website ini.

Uji restore pada lingkungan terpisah. Setelah restore, periksa relasi metadata/object key, status aktif, ukuran APK dan checksum, gambar, serta hak admin. Jangan menganggap versi kode lama otomatis mengembalikan keadaan database atau objek lama. Simpan migration yang telah diterapkan dan metadata deployment untuk penelusuran.

## Penggantian konfigurasi dan akses

Untuk mencabut hak admin, hapus ID dari `ADMIN_USER_IDS` runtime lalu terapkan konfigurasi melalui deployment platform dan uji penolakan API. Jangan hanya menyembunyikan menu. Perubahan email akun tidak mengganti ID yang dipakai otorisasi.

Jika `RELEASE_VERIFICATION_KEY` perlu diganti, koordinasikan nilai baru antara mesin verifikasi dan server, simpan aman, serta buat receipt baru untuk unggahan berikutnya. Receipt lama tidak berlaku untuk unggahan pada key baru; rilis yang sudah tersimpan tidak otomatis berubah atau ditarik.

Rotasi sertifikat signing Android bukan sekadar mengganti fingerprint website. Koordinasikan dahulu dengan penerbit dan prosedur pembaruan Android; perubahan sembarangan dapat membuat update tidak bisa dipasang. Website saat ini memeriksa satu fingerprint signer yang dikonfigurasi. Jangan menggunakan sertifikat debug untuk mengatasi kegagalan.

## Penanganan kendala

| Gejala | Pemeriksaan |
| --- | --- |
| Admin meminta signin | Mulai lewat tautan signin top-level; periksa audience Site dan domain yang digunakan |
| Signin berhasil tetapi 403 | ID akun bukan allowlist atau origin mutasi berbeda; cek runtime `ADMIN_USER_IDS` dan domain final |
| API/unduhan 503 | Periksa binding D1/R2, migration, objek yang hilang, log Worker; jangan membuat metadata rilis palsu |
| Upload verifikasi ditolak | Cocokkan key server/operator, fingerprint, package, checksum, build release, dan receipt untuk bytes yang sama |
| Upload 413 | APK >20 MiB atau gambar >5 MiB; periksa juga reverse proxy tambahan |
| Version code konflik | Buat build dengan code baru; jangan mengedit metadata versi lama agar menyerupai build lain |
| APK tak dapat diperbarui | Pastikan package/signer sama dan code lebih baru; uji perangkat. Jangan menyuruh pengguna menonaktifkan Play Protect atau menghapus data |
| Konten lama setelah edit | Periksa response API, deployment yang dibuka, dan audience; pastikan perubahan tersimpan di D1 yang benar |
| Screenshot gagal | Gunakan PNG/JPEG/WebP asli ≤5 MiB; periksa objek R2 dan hak publikasi |

Log server sengaja tidak mengirim stack trace/secret kepada pengunjung. Gunakan log platform untuk diagnosis dan hindari menyalin token, session, receipt secret, atau data pribadi ke tiket publik.

## Penarikan dan rollback

Arsipkan APK bermasalah terlebih dahulu melalui dashboard. Pilih rilis published yang telah diuji sebagai aktif bila sesuai, atau biarkan tidak ada unduhan aktif sampai build koreksi tersedia. Menarik rilis website tidak mencopot aplikasi yang sudah terpasang.

Untuk regresi website, pilih saved version sebelumnya melalui Sites setelah menilai kompatibilitas schema/data. Migration yang telah berjalan tidak otomatis dibalik dengan rollback kode. Pertahankan backup dan buat perbaikan migration baru bila diperlukan. Jangan menghapus tabel/objek produksi untuk memperbaiki tampilan.

## Tanggung jawab konten dan privasi

Screenshot authenticated harus diperiksa sebelum publikasi: rekening, email, nomor telepon, nama anggota, saldo dan transaksi dapat mengungkap data pribadi. Gunakan sumber asli yang disetujui pemilik dan tuliskan caption yang menjelaskan konteks. `login-source.png` bawaan adalah UI web sumber Capacitor, bukan perangkat Android.

Dokumen legal masih draf. Pemilik perlu menetapkan retensi data/audit/cadangan, identitas pengelola, kontak privasi, penanganan permintaan data, kelayakan penggunaan, serta syarat operasional sebenarnya. Dokumentasikan perubahan dan tinjau ulang halaman legal ketika cara layanan berubah.
