import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../legal/LegalShell";

export const metadata: Metadata = {
  title: "Syarat Penggunaan",
  description:
    "Penjelasan penggunaan aplikasi, akun, catatan kas, pinjaman, dan APK Dana Keluarga. Draf untuk ditinjau pengelola.",
  alternates: { canonical: "/ketentuan" },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Syarat Penggunaan"
      introduction="Pedoman untuk menggunakan Dana Keluarga dengan bertanggung jawab dan memahami batas fungsi aplikasinya."
    >
      <LegalSection number="01" title="Status dokumen dan layanan">
        <p>
          Dana Keluarga membantu keluarga mencatat kas, kontribusi anggota,
          pinjaman, cicilan, serta keputusan sesuai pengaturan keluarga. Website
          memperkenalkan produk dan menyediakan APK rilis ketika tersedia. Draf
          ini disiapkan untuk peninjauan; identitas pihak penyedia, tanggal
          berlaku, serta ketentuan operasional dan hukum final belum disahkan.
        </p>
        <p>
          Aplikasi mencatat kegiatan keuangan keluarga. Transfer bank, pencairan
          uang, dan pembayaran nyata dilakukan melalui kanal di luar aplikasi.
          Menekan tombol pencatatan bukan perintah transfer bank atau bukti dana
          telah diterima.
        </p>
      </LegalSection>
      <LegalSection number="02" title="Akun dan keanggotaan keluarga">
        <p>
          Hubungi admin keluarga untuk memperoleh akun dan keanggotaan. Masuk
          menggunakan email serta password yang didaftarkan. Gunakan identitas
          yang benar, jaga kerahasiaan akses, dan jangan memakai akun orang
          lain. Hubungi administrator ketika keanggotaan, perangkat, atau akses
          perlu diperbarui.
        </p>
        <p>
          Akun dapat memiliki lebih dari satu keluarga. Pastikan keluarga aktif
          sudah benar sebelum membaca catatan atau memulai tindakan. Akses
          bergantung pada keanggotaan dan penugasan yang berlaku, bukan hanya
          label jabatan.
        </p>
      </LegalSection>
      <LegalSection number="03" title="Kas, setoran, dan pembayaran">
        <p>
          Periksa rekening keluarga, nominal, dan penerima sebelum melakukan
          transfer di kanal bank Anda. Laporan “sudah transfer” adalah laporan
          pengguna. Kas dan kewajiban diperbarui setelah pemeriksaan yang
          diwajibkan berhasil diselesaikan.
        </p>
        <p>
          Pengelola dana perlu mencocokkan laporan dengan mutasi bank dan
          menggunakan alasan yang benar ketika menolak atau mengoreksi. Riwayat
          asal dan koreksi dapat tetap tersimpan. Koreksi aplikasi tidak
          otomatis mengembalikan atau memindahkan uang.
        </p>
        <p>
          Jangan melakukan transfer ulang hanya karena laporan masih menunggu
          pemeriksaan. Pastikan mutasi rekening dan koordinasikan dengan
          pengelola dana.
        </p>
      </LegalSection>
      <LegalSection number="04" title="Pinjaman dan persetujuan">
        <p>
          Pengajuan pinjaman mengikuti konfigurasi Maker, approver, dan Releaser
          dalam keluarga. Pemohon tidak dapat menyetujui atau mencairkan
          pengajuannya sendiri. Pengajuan dapat menunggu, disetujui, ditolak,
          atau dikembalikan sesuai proses yang berlaku.
        </p>
        <p>
          Persetujuan belum berarti uang telah ditransfer. Petugas pencairan
          mencatat pencairan setelah prosedur transfer keluarga diselesaikan.
          Periksa tujuan, nominal, tenor, status, dan jadwal cicilan sebelum
          mengambil keputusan.
        </p>
        <p>
          Kesepakatan pinjaman dan penyelesaian perselisihan antaranggota perlu
          ditetapkan oleh pihak terkait. Website tidak menjanjikan persetujuan
          pinjaman, ketersediaan dana, pengembalian dana, atau hasil keuangan.
        </p>
      </LegalSection>
      <LegalSection number="05" title="Unduhan, instalasi, dan pembaruan">
        <p>
          Unduh APK melalui pusat unduhan resmi. Pastikan informasi versi dan
          minimum Android cocok dengan perangkat Anda. Website hanya
          mengaktifkan distribusi setelah file APK serta metadata rilis tersedia
          dan melalui alur pemeriksaan penerbit.
        </p>
        <p>
          Jika Android meminta izin pemasangan dari browser atau pengelola file,
          berikan izin untuk sumber tersebut sesuai pengaturan perangkat. Anda
          tidak perlu menonaktifkan Google Play Protect. Hentikan instalasi dan
          hubungi bantuan jika muncul peringatan atau identitas paket tidak
          sesuai.
        </p>
        <p>
          Pembaruan memerlukan paket dan tanda tangan penerbit yang sesuai.
          Jangan menghapus aplikasi lama untuk mengatasi kegagalan pembaruan
          tanpa menghubungi bantuan. Checksum membantu mencocokkan file;
          checksum bukan jaminan bahwa semua risiko perangkat lunak telah
          dihilangkan.
        </p>
      </LegalSection>
      <LegalSection number="06" title="Penggunaan yang bertanggung jawab">
        <p>
          Gunakan aplikasi hanya untuk keluarga dan tindakan yang menjadi
          kewenangan Anda. Jangan mengirim catatan atau laporan transfer palsu,
          mengakses keluarga lain tanpa izin, menyalahgunakan identitas,
          mengunggah materi tanpa hak, mengganggu layanan, atau mencoba melewati
          pembatasan akses.
        </p>
        <p>
          Screenshot untuk publik harus menggunakan tampilan asli yang telah
          diperiksa dan disetujui, serta tidak mengungkap informasi pribadi atau
          keuangan tanpa izin yang sesuai.
        </p>
      </LegalSection>
      <LegalSection number="07" title="Ketersediaan dan bantuan">
        <p>
          Aplikasi memerlukan koneksi internet untuk data dan transaksi.
          Gangguan jaringan, pemeliharaan, konfigurasi penyedia email, atau
          pembaruan dapat memengaruhi akses dan pemberitahuan. Tinjau status
          terbaru sebelum mengulang tindakan keuangan.
        </p>
        <p>
          Gunakan kanal bantuan yang ditampilkan di website atau menu bantuan
          aplikasi untuk melaporkan kendala. Sertakan langkah dan pesan
          kesalahan yang relevan, tanpa password, PIN, atau OTP. Jam layanan,
          target waktu respons, biaya layanan jika ada, dan prosedur eskalasi
          perlu ditetapkan pengelola; dokumen ini tidak menjanjikan SLA.
        </p>
      </LegalSection>
      <LegalSection number="08" title="Privasi dan materi produk">
        <p>
          Penggunaan data dijelaskan dalam{" "}
          <a href="/privasi">Kebijakan Privasi</a>. Akses kepada catatan
          keluarga harus digunakan sesuai tujuan dan kewenangan. Jangan
          menyebarkan informasi akun atau keuangan anggota tanpa dasar dan izin
          yang sesuai.
        </p>
        <p>
          Nama, logo, antarmuka, dan materi Dana Keluarga digunakan untuk
          memperkenalkan produk. Dokumen ini tidak menetapkan lisensi atas
          source code atau mengubah hak atas komponen pihak ketiga.
        </p>
      </LegalSection>
      <LegalSection number="09" title="Ketentuan yang menunggu penetapan">
        <div className="legal-fields">
          <dl>
            <dt>Pihak penyedia dan alamat kontak</dt>
            <dd>Perlu diisi serta disahkan pengelola.</dd>
            <dt>Kelayakan pengguna dan ketentuan biaya</dt>
            <dd>
              Perlu ditetapkan berdasarkan cara layanan benar-benar
              dioperasikan.
            </dd>
            <dt>Penanganan keluhan dan perselisihan</dt>
            <dd>
              Prosedur, kontak, dan ketentuan yang berlaku perlu ditinjau
              pengelola.
            </dd>
            <dt>Tanggal berlaku dan perubahan syarat</dt>
            <dd>
              Belum ditetapkan; tanggal penyusunan draf adalah 27 November 2026.
            </dd>
          </dl>
        </div>
        <p>
          Pengelola perlu melengkapi serta meninjau bagian tersebut sebelum
          publikasi sebagai syarat yang berlaku. Pembaruan fitur dan cara
          layanan dioperasikan perlu diikuti peninjauan dokumen ini.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
