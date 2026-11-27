"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main style={{ maxWidth: 600, margin: "15vh auto", padding: 24 }}>
      <h1>Halaman belum dapat dimuat.</h1>
      <p>Silakan coba kembali beberapa saat lagi.</p>
      <button className="button" onClick={reset}>
        Coba kembali
      </button>
      <a className="text-link" href="/" style={{ marginLeft: 20 }}>
        Ke beranda
      </a>
    </main>
  );
}
