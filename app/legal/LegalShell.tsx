import type { ReactNode } from "react";
import "./legal.css";

export function LegalShell({
  title,
  introduction,
  children,
}: {
  title: string;
  introduction: string;
  children: ReactNode;
}) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <a
          className="legal-brand"
          href="/"
          aria-label="Dana Keluarga — kembali ke beranda"
        >
          <img src="/brand/logo.svg" alt="" width="38" height="38" />
          <span>
            Dana <em>Keluarga</em>
          </span>
        </a>
        <a className="legal-back" href="/">
          Kembali ke beranda <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main id="main-content" className="legal-main">
        <p className="legal-eyebrow">DANA KELUARGA · INFORMASI PENGGUNA</p>
        <h1>{title}</h1>
        <p className="legal-introduction">{introduction}</p>
        <aside className="legal-review" aria-label="Status peninjauan dokumen">
          <strong>Draf untuk ditinjau pengelola</strong>
          <p>
            Disusun pada 27 November 2026 berdasarkan implementasi yang
            tersedia. Identitas pengelola, kontak khusus privasi, masa retensi,
            dan tanggal berlaku perlu disahkan sebelum peluncuran publik.
            Dokumen ini belum menyatakan pemenuhan ketentuan hukum tertentu.
          </p>
        </aside>
        <article className="legal-content">{children}</article>
      </main>
      <footer className="legal-footer">
        <span>© {new Date().getFullYear()} Dana Keluarga</span>
        <nav aria-label="Dokumen pengguna">
          <a href="/privasi">Kebijakan Privasi</a>
          <a href="/ketentuan">Syarat Penggunaan</a>
          <a href="/#bantuan">Bantuan</a>
        </nav>
      </footer>
    </div>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
