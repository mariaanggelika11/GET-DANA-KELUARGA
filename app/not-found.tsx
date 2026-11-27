export default function NotFound() {
  return (
    <main style={{ maxWidth: 600, margin: "15vh auto", padding: 24 }}>
      <a href="/" style={{ color: "#39848a" }}>
        Dana Keluarga
      </a>
      <h1 style={{ fontSize: 44, marginTop: 32 }}>Halaman belum ditemukan.</h1>
      <p>
        Alamat ini mungkin sudah berubah. Kembali ke beranda untuk menemukan
        informasi aplikasi dan Pusat Unduhan.
      </p>
      <a className="button" href="/">
        Kembali ke beranda
      </a>
    </main>
  );
}
