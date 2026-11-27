import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../legal/LegalShell";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Penjelasan data akun, keluarga, keuangan, dan penggunaan website Dana Keluarga. Draf untuk ditinjau pengelola.",
  alternates: { canonical: "/privasi" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Kebijakan Privasi"
      introduction="Kepercayaan dimulai dari penjelasan yang jelas tentang informasi yang digunakan dan siapa yang dapat mengaksesnya."
    >
      <LegalSection number="01" title="Ruang lingkup dan pengelola">
        <p>
          Dokumen ini menjelaskan pengolahan informasi pada aplikasi Dana
          Keluarga dan website pengenalan serta unduhan aplikasinya. Website
          memiliki penyimpanan konten dan rilis sendiri; website tidak membaca
          database transaksi keuangan aplikasi.
        </p>
        <div className="legal-fields">
          <dl>
            <dt>Identitas dan alamat pengelola</dt>
            <dd>
              Belum ditetapkan dalam dokumen ini; perlu diisi dan disahkan
              pengelola.
            </dd>
            <dt>Kontak khusus privasi dan permintaan data</dt>
            <dd>
              Perlu ditetapkan pengelola. Sementara, gunakan kanal bantuan yang
              ditampilkan pada website atau hubungi admin keluarga.
            </dd>
            <dt>Tanggal mulai berlaku</dt>
            <dd>
              Belum ditetapkan. Tanggal penyusunan draf: 27 November 2026.
            </dd>
          </dl>
        </div>
      </LegalSection>
      <LegalSection number="02" title="Informasi dalam aplikasi">
        <p>
          Sesuai fungsi yang digunakan, aplikasi menyimpan informasi berikut:
        </p>
        <ul>
          <li>
            <strong>Akun:</strong> nama, email, nomor telepon, hash password,
            status akun, peran, waktu masuk, serta data sesi autentikasi dan
            pemulihan password.
          </li>
          <li>
            <strong>Keluarga:</strong> identitas keluarga, keanggotaan, peran
            anggota, dan konfigurasi petugas persetujuan.
          </li>
          <li>
            <strong>Catatan keuangan:</strong> kas masuk dan keluar, kontribusi
            anggota, pengambilan dana, pinjaman, cicilan, rekening tujuan
            keluarga, laporan transfer, pemeriksaan, keputusan, dan riwayat
            koreksi.
          </li>
          <li>
            <strong>Aktivitas dan komunikasi:</strong> pemberitahuan, pengiriman
            email, catatan tindakan penting, serta pesan bantuan yang Anda
            kirim.
          </li>
        </ul>
        <p>
          Transfer uang dilakukan melalui bank di luar aplikasi. Aplikasi
          mencatat laporan transfer dan hasil pemeriksaannya; aplikasi tidak
          meminta password, PIN, atau kode OTP bank Anda.
        </p>
      </LegalSection>
      <LegalSection number="03" title="Tujuan penggunaan informasi">
        <p>
          Informasi digunakan untuk memverifikasi akun, menentukan keluarga dan
          hak akses, menampilkan catatan keuangan, menjalankan pengajuan dan
          persetujuan, menyusun cicilan, mengirim pemberitahuan, membantu
          pemulihan akun, menelusuri perubahan, dan menangani kendala
          penggunaan.
        </p>
        <p>
          Akun dan keanggotaan disiapkan oleh administrator yang berwenang.
          Belum tersedia pendaftaran mandiri atau penggabungan keluarga secara
          publik melalui kode undangan.
        </p>
      </LegalSection>
      <LegalSection number="04" title="Akses dan penerima informasi">
        <p>
          Akses ditentukan berdasarkan akun, keanggotaan keluarga, peran, dan
          penugasan. Anggota, admin keluarga, pengelola dana, petugas
          persetujuan, dan Super Admin memiliki fungsi berbeda. Menjadi admin
          keluarga tidak otomatis memberikan semua hak persetujuan atau
          pencairan.
        </p>
        <p>
          Notifikasi melalui email menggunakan penyedia yang dikonfigurasi
          pengelola. Jika Anda mengirim pesan lewat bantuan aplikasi, nama,
          email, peran, keluarga aktif, dan isi pesan dikirim kepada Super Admin
          untuk penanganan. Jangan menuliskan password, PIN, OTP, atau data yang
          tidak diperlukan dalam pesan bantuan.
        </p>
        <p>
          Daftar penyedia produksi, lokasi pemrosesan, dan dasar pemrosesan atau
          pengungkapan lain perlu dikonfirmasi pengelola sebelum dokumen
          diberlakukan.
        </p>
      </LegalSection>
      <LegalSection number="05" title="Website, unduhan, dan admin">
        <p>
          Website menyimpan metadata rilis, file APK, screenshot yang
          diterbitkan, FAQ, dan informasi produk. Setiap permintaan GET unduhan
          yang diterima layanan dapat menambah penghitung rilis; angka tersebut
          bukan jumlah instalasi, perangkat unik, atau pengguna aktif.
        </p>
        <p>
          Administrasi website menggunakan Sign in with ChatGPT serta daftar ID
          administrator yang diizinkan. Website menerima identitas akun yang
          diberikan layanan autentikasi, dan mencatat ID administrator,
          tindakan, target, serta waktu untuk audit pengelolaan konten. Website
          tidak menyimpan password akun ChatGPT Anda.
        </p>
        <p>
          Penyedia hosting dan autentikasi menangani permintaan jaringan dan
          sesi sesuai pengaturan serta kebijakan mereka. Kebijakan retensi log
          infrastruktur perlu ditinjau pengelola. Membuka tautan email atau
          layanan di luar website mengikuti pengaturan perangkat dan layanan
          tersebut.
        </p>
      </LegalSection>
      <LegalSection number="06" title="Perlindungan dan tanggung jawab akun">
        <p>
          Implementasi aplikasi menggunakan verifikasi password dengan hash,
          sesi autentikasi, pemeriksaan akses pada server, dan pencatatan
          tindakan penting. Build Android menonaktifkan trafik HTTP biasa.
          Pembatasan tersebut tetap bergantung pada konfigurasi dan
          pengoperasian layanan.
        </p>
        <p>
          Tidak ada sistem yang menjamin semua risiko dapat dihilangkan. Dokumen
          ini tidak menyatakan enkripsi end-to-end, sertifikasi keamanan, atau
          jaminan setara layanan perbankan. Lindungi perangkat dan password
          Anda, keluar dari perangkat yang tidak dipercaya, dan laporkan
          aktivitas yang tidak dikenal.
        </p>
      </LegalSection>
      <LegalSection number="07" title="Retensi, koreksi, dan permintaan data">
        <p>
          Masa simpan akun, transaksi, audit, pesan bantuan, cadangan, dan log
          belum ditetapkan dalam draf ini. Pengelola perlu menentukan periode,
          tujuan, prosedur pemusnahan, dan pengecualian yang berlaku sebelum
          peluncuran publik.
        </p>
        <p>
          Hubungi kanal bantuan resmi atau admin keluarga untuk membahas
          pembaruan identitas, akses, atau permintaan penghapusan. Implementasi
          yang ditinjau belum menyediakan penghapusan akun mandiri. Pemenuhan
          permintaan memerlukan verifikasi identitas dan peninjauan catatan
          terkait; dokumen ini tidak menjanjikan penghapusan otomatis atau batas
          waktu yang belum ditetapkan.
        </p>
        <p>
          Koreksi transaksi dapat mempertahankan catatan asal dan menambahkan
          catatan pengimbang agar riwayat keuangan tetap dapat ditelusuri.
          Koreksi catatan tidak memindahkan uang di bank.
        </p>
      </LegalSection>
      <LegalSection number="08" title="Pembaruan dokumen">
        <p>
          Pengelola perlu meninjau dokumen ini ketika fitur, penyedia, atau cara
          pengolahan data berubah. Versi yang disahkan harus mencantumkan
          identitas pengelola, tanggal berlaku, kontak, dan perubahan yang
          relevan. Baca juga <a href="/ketentuan">Syarat Penggunaan</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
