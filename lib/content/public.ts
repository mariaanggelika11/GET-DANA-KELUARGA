export const webAppUrl = "https://danakeluarga.bulmar.tech/";

export const whatsappContact = {
  number: "083191087290",
  url: "https://wa.me/6283191087290",
};

export const defaultFaqs = [
  {
    id: "about",
    question: "Apa itu Dana Keluarga?",
    answer:
      "Dana Keluarga membantu keluarga mencatat kas, kontribusi anggota, pinjaman, cicilan, dan persetujuan dalam satu ruang bersama. Transfer uang tetap dilakukan melalui bank di luar aplikasi.",
    sortOrder: 0,
  },
  {
    id: "download",
    question: "Bagaimana cara mengunduh aplikasinya?",
    answer:
      "Buka Pusat Unduhan dan tekan Download APK pada rilis yang tersedia. Periksa versi, tanggal rilis, ukuran file, dan kompatibilitas Android sebelum mengunduh. APK dapat dipasang langsung melalui website ini.",
    sortOrder: 1,
  },
  {
    id: "account",
    question: "Bagaimana cara bergabung dengan keluarga?",
    answer:
      "Hubungi admin keluarga untuk mendapatkan akun dan keanggotaan. Masuk dengan email dan password yang didaftarkan admin. Aplikasi belum menyediakan pendaftaran mandiri atau kode undangan publik.",
    sortOrder: 2,
  },
  {
    id: "install",
    question: "Mengapa Android meminta izin saat instalasi?",
    answer:
      "APK diunduh langsung melalui website. Jika Android meminta izin, izinkan browser atau pengelola file yang Anda gunakan untuk memasang aplikasi. Nama menu berbeda pada setiap perangkat. Anda tidak perlu menonaktifkan Google Play Protect.",
    sortOrder: 3,
  },
  {
    id: "update",
    question: "Bagaimana cara memperbarui aplikasi?",
    answer:
      "Unduh versi terbaru dari Pusat Unduhan, lalu buka APK untuk memperbarui aplikasi. Pembaruan memerlukan package dan tanda tangan penerbit yang sama. Build debug lama 0.1.0 menggunakan id.danakeluarga.app, sedangkan rilis saat ini menggunakan com.bulmartech.danakeluarga, sehingga Android mengenalinya sebagai aplikasi terpisah. Jangan menghapus data versi lama; hubungi admin keluarga jika membutuhkan bantuan perpindahan.",
    sortOrder: 4,
  },
  {
    id: "privacy",
    question: "Siapa yang dapat mengakses informasi keuangan?",
    answer:
      "Akses diperiksa berdasarkan akun, peran, dan keanggotaan keluarga. Persetujuan mengikuti petugas dan urutan yang diatur keluarga. Lindungi password Anda dan gunakan bantuan aplikasi jika menemukan aktivitas yang tidak dikenali.",
    sortOrder: 5,
  },
  {
    id: "ios",
    question: "Apakah tersedia untuk iOS?",
    answer:
      "Pusat unduhan ini disiapkan untuk aplikasi Android. Belum ada tautan distribusi iOS resmi yang dapat kami tampilkan.",
    sortOrder: 6,
  },
  {
    id: "failed",
    question: "Bagaimana jika APK tidak dapat diinstal?",
    answer:
      "Periksa ruang penyimpanan dan minimum versi Android pada informasi rilis. Unduh kembali melalui website resmi. Jika tanda tangan paket berbeda atau Android memberi peringatan, hentikan instalasi dan hubungi bantuan. Jangan menonaktifkan Play Protect.",
    sortOrder: 7,
  },
];
export const defaultSettings = {
  supportEmail: "",
  supportUrl: whatsappContact.url,
  heroTitle: "Kelola Keuangan Keluarga, Lebih Mudah dan Transparan.",
  heroDescription:
    "Satu aplikasi untuk mengelola dana keluarga, mencatat transaksi, dan membangun masa depan finansial bersama.",
  aboutText:
    "Setiap keluarga punya rencana. Dana Keluarga menghadirkan ruang bersama untuk mencatat kas, memantau kontribusi, dan mengikuti pengajuan pinjaman. Agar keputusan keuangan lebih jelas, dan kebersamaan tetap terjaga.",
};
export const sourceInfo = {
  version: "0.1.0",
  minAndroid: "Android 7.0+",
  commit: "a543aece8f0c45e0173875eb2fe39337522b26ee",
};
