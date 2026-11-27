# Audit sumber Dana Keluarga untuk website resmi

Audit read-only branch `Development`, commit `a543aece8f0c45e0173875eb2fe39337522b26ee`, 27 November 2026. Referensi: https://github.com/mariaanggelika11/DANA-KELUARGA/tree/Development. Proyek Android tidak diubah. Audit ini menilai implementasi di source, bukan sertifikasi keamanan atau bukti kondisi server produksi.

## Teknologi dan pemisahan

- Frontend aplikasi: React + TypeScript + Vite; native Android/iOS melalui Capacitor 8. Lihat `README.md`, `dana-keluarga-frontend/package.json`, `dana-keluarga-frontend/capacitor.config.ts`.
- Backend aplikasi: Express + TypeScript + Prisma + PostgreSQL. Lihat `dana-keluarga-backend/package.json` dan `prisma/schema.prisma`.
- Website/download center sebaiknya terpisah dan tidak mengakses database keuangan aplikasi. Admin website tidak otomatis menjadi admin keluarga atau pemberi persetujuan keuangan.

## Identitas visual terverifikasi

- Logo asli `dana-keluarga-frontend/public/logo-mark.svg`: rumah dan simbol uang; warna turquoise `#56b7c1`, ungu `#55456f`, koral `#e8755c`, krem `#fff8ee`.
- Background aplikasi `#f8f5ef` berasal dari `src/index.css`; UI menggabungkan ungu, turquoise, koral, krem dan warna tinta hangat. Font aplikasi mencakup Inter/DM Sans serta heading Playfair Display (`src/components/DesignSystem.css`, `src/features/auth/Auth.css`).
- Salinan aset asli untuk penggunaan website: `verified-assets/logo-mark.svg` dan `verified-assets/app-icon.png`. PNG dari `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`.
- Tidak ditemukan screenshot login/dashboard/transaksi/pinjaman/anggota yang tracked di repository. PNG yang ada adalah launcher/splash Android/iOS. Selama pengerjaan website berhasil dibuat `verified-assets/login-source.png`, tangkapan langsung frontend asli pada Chrome viewport ponsel 390×844 (DPR 2), tanpa perubahan UI, login, fixture atau data pengguna. Ini pratinjau kode UI sumber aplikasi Capacitor, bukan tangkapan native Android. Gunakan caption yang jujur; provenance lengkap di `verified-assets/PROVENANCE.md`. Jangan mengubah ilustrasi atau dashboard buatan menjadi klaim screenshot asli.

## Fitur yang dapat dipromosikan

| Fitur | Batas/keterangan yang akurat | Bukti source |
| --- | --- | --- |
| Ringkasan keuangan | Saldo kas keluarga, sisa pinjaman, sisa cicilan, jumlah anggota aktif | `backend/src/modules/dashboard/dashboard.routes.ts`; `frontend/src/features/dashboard/FamilySummary.tsx` |
| Kas dan riwayat | Catatan pemasukan/pengeluaran bertanggal dan berhalaman; saldo total/cadangan/tersedia | `backend/src/modules/cash/cash.routes.ts`, `cash.service.ts`, `ledger.service.ts`; `frontend/src/features/cash/FamilyCash.tsx`, `LedgerList.tsx` |
| Kontribusi anggota | Anggota melaporkan setoran melalui transfer bank; kas berubah sesudah pemeriksa lain mengonfirmasi | `backend/src/modules/cash/contribution.service.ts`; `frontend/src/features/cash/ContributionReports.tsx` |
| Pengambilan dana | Kontribusi sendiri dipisahkan dari selisih yang menjadi pinjaman; bukan fitur alokasi anggaran otomatis | `backend/src/modules/cash/cash.service.ts`; `frontend/src/features/cash/FundTransactionDialog.tsx` |
| Pinjaman dan cicilan | Pengajuan nominal/tenor/tujuan, status dan jadwal cicilan sesuai hak akses | `backend/src/modules/loans/loan.routes.ts`; `frontend/src/features/loans/LoanList.tsx`, `features/payments/InstallmentSchedule.tsx` |
| Persetujuan berjenjang | Maker, approver berurutan dan Releaser diatur per keluarga; pemohon tidak menyetujui pengajuannya sendiri | `backend/src/modules/approvals/*`; `frontend/src/features/approvals/*`; `docs/APPROVAL_WORKFLOW.md` |
| Keanggotaan/peran | Super Admin mendaftarkan keluarga/admin; admin keluarga menambah anggota; peran ADMIN/MEMBER/TREASURER dan keluarga aktif | `backend/src/modules/management/*`; `frontend/src/features/members/*`, `components/layout/FamilySwitcher.tsx` |
| Notifikasi | Inbox aplikasi, belum dibaca, tautan detail; email memerlukan konfigurasi penyedia | `backend/src/modules/notifications/*`; `frontend/src/components/notifications/NotificationInbox.tsx` |
| Akun dan bantuan | Email/password, ganti password, pemulihan lewat email, formulir bantuan bagi pengguna yang login | `backend/src/modules/auth/*`, `modules/support/*`; `frontend/src/features/auth/*`, `features/account/ChangePassword.tsx`, `components/SupportForm.tsx` |

Tabel memakai prefiks `backend` untuk `dana-keluarga-backend`, dan `frontend` untuk `dana-keluarga-frontend`.

Tidak ada bukti UI alokasi anggaran/budget per anggota, kategori anggaran, target tabungan aktif, integrasi bank otomatis, payment gateway aktif, push native, biometrik, transaksi offline atau sinkronisasi akun bank. Enum/model yang menyiapkan fitur masa depan bukan bukti alur aktif. Gunakan istilah “kontribusi anggota”, “kas keluarga”, “pengajuan dan persetujuan” alih-alih klaim tersebut.

## Alur onboarding sebenarnya

1. Unduh APK rilis resmi ketika telah diterbitkan, lalu instal.
2. Hubungi admin keluarga untuk mendapatkan akun. Belum ada self-registration publik atau join keluarga melalui kode undangan.
3. Masuk menggunakan email dan password yang didaftarkan admin. Login menyatakan “Belum memiliki akun? Hubungi admin keluarga.”
4. Jika menjadi anggota lebih dari satu keluarga, pilih konteks keluarga aktif.
5. Lihat ringkasan/kas dan gunakan fitur sesuai peran. Pengajuan pinjaman memerlukan Maker dan hirarki yang telah disiapkan.

Bukti: `src/features/auth/LoginForm.tsx`, `src/features/members/RegistrationDialog.tsx`, `backend/src/modules/management/registration.routes.ts`, `management.routes.ts`, `backend/src/modules/auth/auth.routes.ts`.

## Batas transaksi yang perlu jelas

Aplikasi mencatat dan memantau keuangan keluarga. Transfer uang dilakukan melalui bank pengguna ke rekening keluarga di luar aplikasi. Tombol pencairan mencatat bahwa transfer sudah dilakukan; tidak mengirim uang. Laporan pembayaran belum membuktikan dana masuk hingga diverifikasi pengelola dana. Pengelola tidak memeriksa transaksi miliknya sendiri. Koreksi menjaga catatan asal dan membuat catatan pengimbang; tidak mengembalikan uang melalui bank.

Bukti: `docs/PAYMENTS.md`, `docs/FAMILY_CASH.md`, `docs/APPROVAL_WORKFLOW.md`, `src/modules/payments/*`, `src/modules/cash/*`.

## Rilis Android

- `android/app/build.gradle`: `versionName "0.1.0"`, `versionCode 1`.
- `android/variables.gradle`: `minSdkVersion = 24` (Android 7), compile/target SDK 36.
- Itu adalah konfigurasi source dan bukan bukti versi rilis publik terbaru.
- Tidak ada APK/AAB tracked. Tidak ada signingConfig penerbit di `android/app/build.gradle`.
- `docs/MOBILE.md` mencatat APK debug dibangun lokal pada 29 Oktober 2026. Catatan tersebut tidak menyediakan file rilis bertanda tangan untuk distribusi. Jangan mendistribusikan APK debug.
- Tanggal rilis, ukuran file, checksum, jumlah unduhan dan release notes belum tersedia. Semua harus berasal dari artefak APK dan administrasi rilis website, bukan nomor rekaan.
- Ada ketidaksesuaian package: Gradle `applicationId "id.danakeluarga.app"`, Capacitor `appId "com.bulmartech.danakeluarga"`. Pemilik perlu menetapkan package final sebelum signing. Validasi upload APK harus memakai konfigurasi package final; jangan memperbaiki aplikasi dari proyek website.
- Proyek native iOS ada, tetapi dokumentasi menyatakan distribusi/perangkat iOS belum diverifikasi. FAQ dapat mengatakan website ini menyiapkan distribusi Android; jangan menampilkan tombol App Store aktif tanpa URL rilis sah.

## Keamanan: klaim yang didukung dan batasnya

Dapat dinyatakan: aplikasi memerlukan autentikasi akun; password diverifikasi dengan hash Argon2; sesi access token berumur 15 menit dengan refresh rotation/session revocation; akses keluarga dan peran diperiksa server; persetujuan memakai petugas/urutan yang ditetapkan; perubahan penting dicatat; pemulihan password melalui email tersedia jika konfigurasi pengiriman valid.

Bukti: `backend/src/modules/auth/auth.routes.ts`, `auth.service.ts`, `password.service.ts`, `password-reset.service.ts`, `middleware/auth.ts`, `middleware/roles.ts`, `modules/cash/family-access.service.ts`, `modules/approvals/*`.

Android manifest menonaktifkan backup dan cleartext traffic; konfigurasi mobile menolak URL API non-HTTPS untuk build mobile (`android/app/src/main/AndroidManifest.xml`, `scripts/mobile-config.ts`). Source aplikasi menyimpan access/refresh token pada localStorage (`frontend/src/lib/api-client.ts`); belum Keychain/Keystore. Jangan menjanjikan enkripsi end-to-end, sertifikasi, perlindungan setara bank, 100% aman, atau native secure token storage. Implementasi source tidak membuktikan deployment produksi telah memakai konfigurasi terbaru. Audit kode bukan penetration test.

## Kontak

Alamat penerima formulir bantuan pada source tidak disertakan dalam dokumentasi publik. Kontak publik mengikuti konfigurasi website yang disetujui pemilik. Pengguna aplikasi juga dapat menuju Bantuan → Tanya Super Admin. Jangan membuat nomor WhatsApp, alamat perusahaan, jam layanan atau akun sosial.

## Kebijakan privasi dan syarat: isi yang ditopang implementasi

- Data akun mencakup nama, email, telepon, hash password, status aktif/peran; keanggotaan/keluarga aktif, rekening keluarga, catatan kas/kontribusi, pinjaman/cicilan/laporan transfer, approval, notifikasi/email, audit dan data sesi tercatat dalam schema.
- Data diakses menurut peran dan scope keluarga; admin platform mempunyai fungsi pengelolaan. Jangan menjanjikan semua anggota melihat semua detail pribadi atau finansial.
- Pesan bantuan mengirim nama/email/peran/keluarga aktif dan pesan ke Super Admin lewat penyedia email; akun yang belum login tidak dapat mengirim formulir aplikasi tersebut.
- Tidak ditemukan mekanisme penghapusan akun mandiri di UI/API yang diaudit, jadwal retensi formal, identitas badan pengendali, atau daftar penyedia produksi lengkap. Nyatakan mekanisme permintaan bantuan untuk ditinjau dan jangan menjamin penghapusan otomatis; audit keuangan dapat memerlukan retensi yang harus ditentukan pengelola.
- Website download terpisah perlu menjelaskan metadata rilis dan hitungan permintaan unduhan. Hitungan unduhan bukan bukti instalasi atau pengguna aktif.
- Dokumen legal yang disediakan website harus ditandai draf untuk ditinjau pengelola sebelum peluncuran publik; source tidak cukup untuk menyatakan kepatuhan regulasi. Detail kebijakan yang belum diketahui harus ada di checklist deployment, bukan diisi data palsu.

## Keterbatasan audit

Tidak login ke akun pengguna, menguji transaksi, membuka data keuangan pribadi, mengubah database aplikasi atau mengubah source Android. Tidak ada konfirmasi artefak rilis, sertifikat signing penerbit, screenshot authenticated yang disetujui, domain download final, atau identitas legal pengelola. Semua memerlukan artefak/konfigurasi nyata sebelum peluncuran publik.
