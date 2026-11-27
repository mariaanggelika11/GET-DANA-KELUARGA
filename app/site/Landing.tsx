"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCheck2,
  Globe,
  Heart,
  Layers3,
  LockKeyhole,
  Menu,
  MessageCircle,
  Plus,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { PublicData } from "../../lib/types";
import {
  defaultFaqs,
  defaultSettings,
  webAppUrl,
  whatsappContact,
} from "../../lib/content/public";

type Release = {
  id: string;
  versionName: string;
  versionCode: number;
  releaseDate: string;
  fileName: string;
  fileSize: number;
  minAndroid: string;
  sha256: string;
  releaseNotes: string[];
  downloads: number;
  downloadUrl: string;
  active?: boolean;
};
type Shot = {
  id: string;
  title: string;
  alt: string;
  url: string;
  sortOrder: number;
};
type FAQ = { id: string; question: string; answer: string; sortOrder: number };
const links = [
  ["Beranda", "#beranda"],
  ["Fitur", "#fitur"],
  ["Tentang", "#tentang"],
  ["Cara Instalasi", "#instalasi"],
  ["FAQ", "#faq"],
];
function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      href="/"
      className={`brand-link ${light ? "light" : ""}`}
      aria-label="Dana Keluarga, beranda"
    >
      <img src="/brand/logo.svg" width="40" height="40" alt="" />
      <span>
        Dana <b>Keluarga</b>
        <small>SATU KELUARGA, SATU TUJUAN</small>
      </span>
    </a>
  );
}
function AndroidIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m7.3 5-1.5-2.6.9-.5L8.2 4.5a9 9 0 0 1 7.6 0l1.5-2.6.9.5L16.7 5A8.2 8.2 0 0 1 21 12H3a8.2 8.2 0 0 1 4.3-7ZM8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM3 13h18v5a2 2 0 0 1-2 2h-1v2h-3v-2H9v2H6v-2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}
const size = (bytes: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(
    bytes / 1024 / 1024,
  ) + " MB";
const date = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
export default function Landing({
  googlePlayUrl = "",
}: {
  googlePlayUrl?: string;
}) {
  const [menu, setMenu] = useState(false),
    [openFaq, setOpenFaq] = useState<string | null>("about"),
    [release, setRelease] = useState<Release | null>(null),
    [releases, setReleases] = useState<Release[]>([]),
    [shots, setShots] = useState<Shot[]>([]),
    [faqs, setFaqs] = useState<FAQ[]>(defaultFaqs),
    [settings, setSettings] = useState(defaultSettings),
    [apiError, setApiError] = useState(false),
    [loaded, setLoaded] = useState(false),
    [history, setHistory] = useState(false),
    [qr, setQr] = useState(""),
    [hasLogin, setHasLogin] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<PublicData>;
      })
      .then((data) => {
        setRelease(data.release);
        setReleases(data.releases || []);
        setShots(data.screenshots || []);
        if (Array.isArray(data.faqs))
          setFaqs(data.faqs.map((f, i) => ({ ...f, sortOrder: i })));
        setSettings({ ...defaultSettings, ...data.settings });
      })
      .catch((e) => {
        if (e.name !== "AbortError") setApiError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });
    const pic = new Image();
    pic.onload = () => setHasLogin(true);
    pic.src = "/brand/login-source.png";
    import("qrcode")
      .then((q) =>
        q.toDataURL(window.location.origin + "/#download", {
          width: 180,
          margin: 1,
          color: { dark: "#423950", light: "#ffffff" },
          errorCorrectionLevel: "M",
        }),
      )
      .then(setQr)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!menu) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [menu]);
  const downloadHref = release ? release.downloadUrl : "#download";
  return (
    <>
      <a className="skip-link" href="#main">
        Langsung ke konten
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav
            aria-label="Navigasi utama"
            id="mobile-nav"
            className={menu ? "navigation is-open" : "navigation"}
          >
            {links.map(([label, href]) => (
              <a href={href} key={href} onClick={() => setMenu(false)}>
                {label}
              </a>
            ))}
          </nav>
          <a className="button button-small nav-download" href="#download">
            Download Aplikasi <ArrowDownToLine size={15} />
          </a>
          <button
            className="menu-toggle"
            aria-expanded={menu}
            aria-controls="mobile-nav"
            aria-label={menu ? "Tutup navigasi" : "Buka navigasi"}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">
        <section className="hero container" id="beranda">
          <div className="hero-copy">
            <div className="eyebrow-pill">
              <span /> RUANG BERSAMA UNTUK KELUARGA
            </div>
            <h1>
              {settings.heroTitle === defaultSettings.heroTitle ? (
                <>
                  Kelola keuangan
                  <br className="desktop-break" /> keluarga,{" "}
                  <em>lebih mudah</em> dan transparan.
                </>
              ) : (
                settings.heroTitle
              )}
            </h1>
            <p className="hero-description">{settings.heroDescription}</p>
            <div className="hero-actions">
              <a className="button" href={downloadHref}>
                <AndroidIcon />
                Download untuk Android
                <ArrowDownToLine size={17} />
              </a>
              <a className="text-link" href="#fitur">
                Lihat fitur <ArrowUpRight size={18} />
              </a>
            </div>
            <a
              className="text-link hero-web-link"
              href={webAppUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe size={16} aria-hidden="true" />
              Buka Aplikasi Web
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <div className="hero-meta">
              <span>
                <Smartphone size={15} />
                {release ? release.minAndroid : "Android 7.0+"}
              </span>
              <span>
                {release
                  ? `v${release.versionName} · ${size(release.fileSize)}`
                  : !loaded
                    ? "Memeriksa versi terbaru…"
                    : "APK belum tersedia"}
              </span>
            </div>
            <p className="source-note">
              {!release &&
                loaded &&
                (apiError
                  ? "Informasi unduhan belum dapat dimuat. Silakan coba kembali."
                  : "Informasi versi akan tampil saat rilis tersedia.")}
            </p>
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="visual-dot dot-one" />
            <div className="visual-dot dot-two" />
            <span className="visual-spark">✳</span>
            <div className="floating-label together">
              <span className="label-icon">
                <Users size={20} />
              </span>
              <div>
                Satu keluarga<strong>Satu tujuan.</strong>
              </div>
            </div>
            <div className="phone">
              <div className="phone-camera" />
              <div className="phone-display">
                {hasLogin ? (
                  <img
                    className="login-screen"
                    src="/brand/login-source.png"
                    alt="Halaman masuk Dana Keluarga yang dirender dari kode aplikasi asli"
                    width="390"
                    height="780"
                  />
                ) : (
                  <div className="brand-art">
                    <img
                      src="/brand/logo.svg"
                      alt="Logo asli Dana Keluarga"
                      width="104"
                      height="104"
                    />
                    <strong>
                      Dana <i>Keluarga</i>
                    </strong>
                    <span>
                      Ruang bersama.
                      <br />
                      Rencana yang terjaga.
                    </span>
                    <div className="brand-art-line" />
                    <small>KAS · KONTRIBUSI · PINJAMAN</small>
                  </div>
                )}
              </div>
            </div>
            <div className="floating-label transparent">
              <span className="label-icon mint">
                <CheckCheck size={21} />
              </span>
              <div>
                Lebih terbuka<strong>Lebih tenang.</strong>
              </div>
            </div>
            <div className="visual-caption">
              <span />
              {hasLogin
                ? "Tampilan masuk dari kode aplikasi asli"
                : "Identitas visual asli Dana Keluarga"}
            </div>
          </div>
        </section>
        <div className="promise-strip">
          <div className="container promise-inner">
            <span className="promise-intro">Bersama, jadi lebih terarah.</span>
            <span>
              <Wallet size={19} /> Kas keluarga tercatat
            </span>
            <span>
              <Users size={19} /> Persetujuan bersama
            </span>
            <span>
              <ShieldCheck size={19} /> Akses sesuai peran
            </span>
          </div>
        </div>
        <section className="section container about" id="tentang">
          <div>
            <span className="eyebrow">BERAWAL DARI KEBERSAMAAN</span>
            <h2>
              Keuangan tertata.
              <br />
              Keluarga <em>tetap dekat.</em>
            </h2>
          </div>
          <div className="about-copy">
            <p>{settings.aboutText}</p>
            <p className="muted">
              Dari setoran anggota hingga keputusan pinjaman, setiap catatan
              punya tempat. Lebih mudah dipantau, lebih nyaman dibicarakan.
            </p>
            <a className="text-link" href="#cara-kerja">
              Kenali cara kerjanya <ArrowRight size={17} />
            </a>
          </div>
        </section>
        <section className="features-section" id="fitur">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DIDESAIN UNTUK SALING PERCAYA</span>
                <h2>
                  Semua yang penting.
                  <br />
                  <em>Dalam satu ruang.</em>
                </h2>
              </div>
              <p>
                Catatan yang jelas untuk keputusan
                <br className="desktop-break" /> yang lebih baik, bersama
                keluarga.
              </p>
            </div>
            <div className="feature-grid">
              <article className="feature-card feature-main">
                <span className="icon-box">
                  <Wallet size={25} />
                </span>
                <span className="card-kicker">PANDANGAN YANG MENYELURUH</span>
                <h3>
                  Kenali kondisi
                  <br />
                  kas keluarga.
                </h3>
                <p>
                  Lihat saldo kas, sisa pinjaman, dan cicilan dalam ringkasan
                  keluarga yang mudah dipahami.
                </p>
                <div
                  className="cash-diagram"
                  aria-label="Kas keluarga menghubungkan kontribusi, transaksi, dan pinjaman"
                >
                  <span>
                    <span className="mini-dot coral" />
                    Kontribusi anggota
                    <ArrowDown size={14} />
                  </span>
                  <div>
                    <Wallet size={22} />
                    <strong>Kas keluarga</strong>
                  </div>
                  <span>
                    <span className="mini-dot turquoise" />
                    Transaksi & pinjaman
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </article>
              <article className="feature-card">
                <span className="icon-box pale-coral">
                  <ArrowDownToLine size={23} />
                </span>
                <h3>Setiap kontribusi berarti.</h3>
                <p>
                  Laporkan setoran melalui transfer bank. Pengelola dana
                  memeriksa sebelum kas diperbarui.
                </p>
                <span className="card-bottom">
                  Tercatat. Diperiksa. Terlihat. <Check size={16} />
                </span>
              </article>
              <article className="feature-card">
                <span className="icon-box pale-purple">
                  <Layers3 size={23} />
                </span>
                <h3>Riwayat yang bercerita.</h3>
                <p>
                  Telusuri pemasukan, pengeluaran, dan aktivitas kas dengan
                  catatan transaksi yang terpusat.
                </p>
                <span className="card-bottom">
                  Lebih mudah menelusuri setiap catatan{" "}
                  <ArrowUpRight size={16} />
                </span>
              </article>
              <article className="feature-card">
                <span className="icon-box pale-mint">
                  <Users size={23} />
                </span>
                <h3>Ruang untuk setiap anggota.</h3>
                <p>
                  Kelola keanggotaan dan peran keluarga. Setiap anggota mendapat
                  akses sesuai tanggung jawabnya.
                </p>
                <span className="card-bottom">
                  Keluarga terhubung, peran tetap jelas <Heart size={16} />
                </span>
              </article>
              <article className="feature-card feature-approval">
                <div>
                  <span className="icon-box">
                    <CheckCheck size={24} />
                  </span>
                  <h3>
                    Keputusan besar,
                    <br />
                    dipertimbangkan bersama.
                  </h3>
                  <p>
                    Ajukan pinjaman dan ikuti persetujuan berjenjang sesuai
                    pengaturan keluarga, hingga pencatatan pencairan.
                  </p>
                </div>
                <div className="approval-flow">
                  <span>
                    <span>01</span> Pengajuan <Check size={14} />
                  </span>
                  <i />
                  <span>
                    <span>02</span> Persetujuan berjenjang <Users size={14} />
                  </span>
                  <i />
                  <span>
                    <span>03</span> Catatan pencairan <FileCheck2 size={14} />
                  </span>
                </div>
              </article>
            </div>
            <div className="feature-footnote">
              <Bell size={17} />
              <p>
                Ikuti perkembangan melalui notifikasi di aplikasi. Transfer uang
                dilakukan melalui bank, di luar Dana Keluarga.
              </p>
            </div>
          </div>
        </section>
        <section className="section container preview-section" id="preview">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LEBIH DEKAT DENGAN APLIKASI</span>
              <h2>
                Ruang yang terasa <em>familiar.</em>
              </h2>
            </div>
            {shots.length > 0 && (
              <div className="carousel-buttons">
                <button
                  aria-label="Lihat screenshot sebelumnya"
                  onClick={() =>
                    rail.current?.scrollBy({ left: -320, behavior: "smooth" })
                  }
                >
                  <ChevronLeft />
                </button>
                <button
                  aria-label="Lihat screenshot berikutnya"
                  onClick={() =>
                    rail.current?.scrollBy({ left: 320, behavior: "smooth" })
                  }
                >
                  <ChevronRight />
                </button>
              </div>
            )}
          </div>
          {shots.length > 0 ? (
            <div className="screenshot-rail" ref={rail}>
              {shots.map((shot) => (
                <figure key={shot.id}>
                  <div className="gallery-phone">
                    <img
                      src={shot.url}
                      alt={shot.alt}
                      loading="lazy"
                      width="280"
                      height="560"
                    />
                  </div>
                  <figcaption>{shot.title}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="preview-story">
              <div className="preview-mark">
                <img
                  src="/brand/logo.svg"
                  width="92"
                  height="92"
                  alt="Logo Dana Keluarga"
                />
                <span>
                  Dana <i>Keluarga</i>
                </span>
              </div>
              <div>
                <h3>Dari keluarga, untuk keluarga.</h3>
                <p>
                  Tampilan yang hangat, dengan catatan keuangan sebagai
                  pusatnya. Galeri screenshot Android akan ditambahkan setelah
                  tangkapan layar resmi tersedia.
                </p>
                <span className="subtle-badge">
                  Identitas visual asli aplikasi
                </span>
              </div>
              <ArrowUpRight className="story-arrow" size={36} />
            </div>
          )}
        </section>
        <section className="how-section" id="cara-kerja">
          <div className="container">
            <span className="eyebrow">MULAI DENGAN LANGKAH KECIL</span>
            <h2>
              Menuju keuangan keluarga
              <br />
              yang <em>lebih terarah.</em>
            </h2>
            <div className="steps-grid">
              {[
                {
                  title: "Unduh aplikasinya",
                  text: "Dapatkan APK Android dari Pusat Unduhan resmi saat rilis tersedia.",
                  Icon: Download,
                },
                {
                  title: "Instal di perangkat",
                  text: "Ikuti panduan singkat untuk memasang APK pada smartphone Android.",
                  Icon: Smartphone,
                },
                {
                  title: "Hubungi admin keluarga",
                  text: "Dapatkan akun dan keanggotaan dari admin. Masuk dengan email dan password.",
                  Icon: Users,
                },
                {
                  title: "Mulai kelola bersama",
                  text: "Pilih keluarga, lihat kas, dan gunakan fitur sesuai peran Anda.",
                  Icon: Heart,
                },
              ].map(({ title, text, Icon }, i) => (
                <article key={title}>
                  <div className="step-top">
                    <span>0{i + 1}</span>
                    <Icon size={24} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section container download-section" id="download">
          <div className="download-heading">
            <span className="eyebrow">PUSAT UNDUHAN RESMI</span>
            <h2>
              Langkah baik,
              <br />
              dimulai <em>dari sini.</em>
            </h2>
            <p>
              Simpan satu ruang untuk rencana
              <br />
              keuangan keluarga Anda.
            </p>
            <div className="download-security">
              <ShieldCheck size={19} />
              <span>
                Unduh hanya dari website resmi.
                <br />
                Google Play Protect tetap aktif.
              </span>
            </div>
          </div>
          <div className="download-panel">
            <div className="download-product">
              <img src="/brand/logo.svg" alt="" width="64" height="64" />
              <div>
                <h3>Dana Keluarga</h3>
                <span>Aplikasi Android</span>
              </div>
              <span className={`status-badge ${release ? "available" : ""}`}>
                <span />
                {release
                  ? "Rilis tersedia"
                  : !loaded
                    ? "Memeriksa…"
                    : "Belum tersedia"}
              </span>
            </div>
            {release ? (
              <>
                <dl className="release-grid">
                  <div>
                    <dt>Versi terbaru</dt>
                    <dd>
                      {release.versionName}{" "}
                      <small>({release.versionCode})</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Ukuran APK</dt>
                    <dd>{size(release.fileSize)}</dd>
                  </div>
                  <div>
                    <dt>Tanggal rilis</dt>
                    <dd>{date(release.releaseDate)}</dd>
                  </div>
                  <div>
                    <dt>Kompatibilitas</dt>
                    <dd>{release.minAndroid}</dd>
                  </div>
                </dl>
                <a
                  className="button download-button"
                  href={release.downloadUrl}
                >
                  <AndroidIcon /> Download APK <ArrowDownToLine size={18} />
                </a>
                <details className="release-notes">
                  <summary>
                    Apa yang baru di versi ini?
                    <ChevronDown size={16} />
                  </summary>
                  <ul>
                    {release.releaseNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <div className="pending-release">
                <span className="pending-icon">
                  <FileCheck2 size={26} />
                </span>
                <h4>
                  {!loaded
                    ? "Memeriksa rilis Android…"
                    : apiError
                      ? "Informasi rilis belum dapat dimuat."
                      : "APK belum tersedia untuk diunduh."}
                </h4>
                <p>
                  {apiError
                    ? "Coba muat ulang halaman beberapa saat lagi untuk melihat ketersediaan unduhan."
                    : "Versi, ukuran file, dan kompatibilitas Android akan ditampilkan bersama APK yang diterbitkan."}
                </p>
                <button className="button download-button" disabled>
                  <ArrowDownToLine size={18} />
                  {!loaded ? "Memeriksa ketersediaan…" : "APK belum tersedia"}
                </button>
                {apiError && (
                  <button
                    className="text-link"
                    onClick={() => window.location.reload()}
                  >
                    Muat ulang informasi <ArrowRight size={16} />
                  </button>
                )}
              </div>
            )}
            {googlePlayUrl && (
              <a
                className="google-play-link text-link"
                href={googlePlayUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Juga tersedia di Google Play <ArrowUpRight size={15} />
              </a>
            )}
            <div className="qr-row">
              {qr ? (
                <img
                  src={qr}
                  alt="QR Code menuju Pusat Unduhan Dana Keluarga pada alamat website ini"
                  width="76"
                  height="76"
                  loading="lazy"
                />
              ) : (
                <Smartphone size={32} />
              )}
              <div>
                <strong>Buka di smartphone Anda</strong>
                <p>Pindai QR untuk membuka halaman ini.</p>
              </div>
              <Smartphone className="qr-phone-icon" size={21} />
            </div>
            {releases.length > 1 && (
              <>
                <button
                  className="version-history-toggle"
                  aria-expanded={history}
                  onClick={() => setHistory(!history)}
                >
                  Riwayat versi <ChevronDown size={15} />
                </button>
                {history && (
                  <ul className="version-history">
                    {releases
                      .filter((r) => r.id !== release?.id)
                      .map((r) => (
                        <li key={r.id}>
                          <span>
                            v{r.versionName}
                            <small>
                              {date(r.releaseDate)} · {size(r.fileSize)}
                            </small>
                          </span>
                          <a
                            href={r.downloadUrl}
                            aria-label={`Unduh versi ${r.versionName}`}
                          >
                            <Download size={18} />
                          </a>
                        </li>
                      ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </section>
        <section className="install-section" id="instalasi">
          <div className="container install-layout">
            <div>
              <span className="eyebrow">PANDUAN INSTALASI</span>
              <h2>
                Beberapa langkah.
                <br />
                <em>Siap digunakan.</em>
              </h2>
              <p>
                Instal langsung di smartphone Android.
                <br />
                Ikuti petunjuk perangkat Anda.
              </p>
              <div className="install-note">
                <ShieldCheck size={22} />
                <p>
                  Anda{" "}
                  <strong>
                    tidak perlu menonaktifkan Google Play Protect.
                  </strong>{" "}
                  Gunakan APK dari website resmi.
                </p>
              </div>
            </div>
            <ol className="install-steps">
              {[
                [
                  "Download APK",
                  "Tekan tombol Download APK di Pusat Unduhan dan tunggu hingga selesai.",
                ],
                [
                  "Buka file yang diunduh",
                  "Temukan APK di notifikasi unduhan atau folder Download.",
                ],
                [
                  "Berikan izin jika diminta",
                  "Izinkan instalasi dari browser atau pengelola file yang Anda gunakan, melalui Pengaturan Android.",
                ],
                [
                  "Instal, lalu buka Dana Keluarga",
                  "Ikuti petunjuk instalasi. Masuk dengan akun dari admin keluarga.",
                ],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="section container privacy-section">
          <div className="privacy-title">
            <span className="icon-box">
              <LockKeyhole size={25} />
            </span>
            <div>
              <span className="eyebrow">
                KEPERCAYAAN DIMULAI DARI KEJELASAN
              </span>
              <h2>
                Akses yang jelas.
                <br />
                <em>Tanggung jawab bersama.</em>
              </h2>
            </div>
          </div>
          <div className="privacy-grid">
            <article>
              <h3>Akun pribadi</h3>
              <p>
                Masuk dengan email dan password. Jaga kerahasiaan akun Anda dan
                gunakan pemulihan password saat diperlukan.
              </p>
            </article>
            <article>
              <h3>Peran yang teratur</h3>
              <p>
                Akses informasi mengikuti peran dan keanggotaan keluarga.
                Persetujuan dilakukan oleh petugas yang ditetapkan.
              </p>
            </article>
            <article>
              <h3>Informasi yang terbuka</h3>
              <p>
                Pahami bagaimana data digunakan melalui kebijakan privasi dan
                syarat penggunaan yang tersedia untuk ditinjau.
              </p>
              <a className="text-link" href="/privasi">
                Baca kebijakan privasi <ArrowUpRight size={15} />
              </a>
            </article>
          </div>
        </section>
        <section className="faq-section" id="faq">
          <div className="container faq-layout">
            <div>
              <span className="eyebrow">ADA YANG INGIN DITANYAKAN?</span>
              <h2>
                Mari, kita
                <br />
                <em>perjelas.</em>
              </h2>
              <p>
                Jawaban untuk hal-hal yang
                <br />
                mungkin Anda pikirkan.
              </p>
              <a href="#bantuan" className="text-link">
                Butuh bantuan lainnya? <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="faq-list">
              {faqs
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((f) => (
                  <article
                    className={openFaq === f.id ? "faq-item open" : "faq-item"}
                    key={f.id}
                  >
                    <h3>
                      <button
                        aria-expanded={openFaq === f.id}
                        aria-controls={`faq-${f.id}`}
                        onClick={() =>
                          setOpenFaq(openFaq === f.id ? null : f.id)
                        }
                      >
                        {f.question}
                        <Plus size={18} />
                      </button>
                    </h3>
                    <div id={`faq-${f.id}`} hidden={openFaq !== f.id}>
                      <p>
                        {f.id === "download" &&
                        f.answer === defaultFaqs[1].answer &&
                        release
                          ? "Buka Pusat Unduhan dan tekan Download APK. Anda dapat memeriksa versi, ukuran file, tanggal rilis, dan kompatibilitas Android sebelum mengunduh."
                          : f.answer}
                      </p>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </section>
        <section className="container contact-section" id="bantuan">
          <div>
            <MessageCircle size={28} />
            <div>
              <h3>Kami siap mendengar.</h3>
              <p>
                Ada pertanyaan? Hubungi kami melalui WhatsApp di{" "}
                {whatsappContact.number}.
              </p>
            </div>
          </div>
          <a
            className="button button-outline"
            href={whatsappContact.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={17} aria-hidden="true" />
            Hubungi via WhatsApp <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-main">
            <div>
              <Brand light />
              <p>
                Ruang bersama untuk keuangan keluarga.
                <br />
                Karena masa depan dibangun bersama.
              </p>
            </div>
            <div className="footer-links">
              <div>
                <span>JELAJAHI</span>
                <a href="#fitur">Fitur aplikasi</a>
                <a href="#download">Pusat unduhan</a>
                <a href="#instalasi">Panduan instalasi</a>
                <a href={webAppUrl} target="_blank" rel="noopener noreferrer">
                  Aplikasi Web
                </a>
              </div>
              <div>
                <span>INFORMASI</span>
                <a href="#bantuan">Kontak & bantuan</a>
                <a
                  href={whatsappContact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp: {whatsappContact.number}
                </a>
                {settings.supportEmail && (
                  <a href={`mailto:${settings.supportEmail}`}>
                    {settings.supportEmail}
                  </a>
                )}
                <a href="/privasi">Kebijakan privasi</a>
                <a href="/ketentuan">Syarat & ketentuan</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} Dana Keluarga. Seluruh hak cipta
              dilindungi.
            </span>
            <span className="footer-tag">
              <Heart size={13} /> Dibuat untuk kebersamaan.
            </span>
            <span>
              {release
                ? `Android v${release.versionName}`
                : !loaded
                  ? "Memeriksa versi Android…"
                  : "Informasi rilis Android"}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
