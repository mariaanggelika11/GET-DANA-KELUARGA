"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  Archive,
  Check,
  CircleHelp,
  Download,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type Session = {
  authenticated: boolean;
  authorized: boolean;
  configured: boolean;
  user: { id: string; email: string; name: string } | null;
};
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
  status: "draft" | "published" | "archived";
  downloads: number;
  active?: boolean;
  downloadUrl: string;
};
type Screenshot = {
  id: string;
  title: string;
  alt: string;
  url: string;
  sortOrder: number;
};
type FAQ = { id: string; question: string; answer: string; sortOrder: number };
type Settings = {
  supportEmail: string;
  supportUrl: string;
  heroTitle: string;
  heroDescription: string;
  aboutText: string;
};
type Content = { settings: Settings; faqs: FAQ[] };
type Tab = "overview" | "releases" | "screenshots" | "content";
const navigation: { id: Tab; title: string; icon: typeof Package }[] = [
  { id: "overview", title: "Ringkasan", icon: LayoutDashboard },
  { id: "releases", title: "Versi aplikasi", icon: Package },
  { id: "screenshots", title: "Galeri aplikasi", icon: ImageIcon },
  { id: "content", title: "Konten website", icon: FileText },
];
const titles: Record<
  Tab,
  { eyebrow: string; title: string; description: string }
> = {
  overview: {
    eyebrow: "RUANG KELOLA",
    title: "Semua dalam kendali.",
    description:
      "Kelola rilis aplikasi dan informasi yang dilihat keluarga Anda.",
  },
  releases: {
    eyebrow: "DISTRIBUSI APLIKASI",
    title: "Versi aplikasi",
    description:
      "Unggah APK terverifikasi, tulis pembaruan, lalu publikasikan saat siap.",
  },
  screenshots: {
    eyebrow: "TAMPILAN PRODUK",
    title: "Galeri aplikasi",
    description:
      "Gunakan tangkapan layar asli tanpa informasi pribadi pengguna.",
  },
  content: {
    eyebrow: "INFORMASI PUBLIK",
    title: "Konten website",
    description:
      "Perbarui cerita produk, kontak bantuan, dan jawaban pertanyaan pengguna.",
  },
};

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
  });
  const result = (await response.json().catch(() => null)) as {
    error?: string | { message?: string };
    message?: string;
  } | null;
  if (!response.ok)
    throw new Error(
      typeof result?.error === "string"
        ? result.error
        : result?.error?.message ||
            result?.message ||
            `Permintaan gagal (${response.status}). Silakan coba kembali.`,
    );
  return result as T;
}
function size(bytes: number) {
  return (
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(
      bytes / 1024 / 1024,
    ) + " MB"
  );
}
function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(parsed);
}
function Spinner() {
  return <LoaderCircle size={18} className="admin-spin" aria-hidden="true" />;
}
function Button({
  children,
  busy,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      className={`admin-button ${className}`}
      {...props}
      disabled={busy || props.disabled}
    >
      {busy ? <Spinner /> : null}
      {children}
    </button>
  );
}
function Empty({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-empty">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const notify = useCallback(
    (text: string, error = false) => setMessage({ text, error }),
    [],
  );
  const reload = useCallback(async () => {
    const [r, s, c] = await Promise.all([
      api<{ releases: Release[] }>("/api/admin/releases"),
      api<{ screenshots: Screenshot[] }>("/api/admin/screenshots"),
      api<Content>("/api/admin/content"),
    ]);
    setReleases(r.releases);
    setScreenshots(s.screenshots);
    setContent(c);
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api<Session>("/api/admin/session");
        if (!alive) return;
        setSession(data);
        if (data.authorized) await reload();
      } catch (e) {
        if (alive)
          notify(
            e instanceof Error ? e.message : "Tidak dapat menghubungi server.",
            true,
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reload, notify]);
  async function mutate(
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) {
    setBusy(key);
    setMessage(null);
    try {
      await action();
      await reload();
      notify(success);
      return true;
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Perubahan belum dapat disimpan.",
        true,
      );
      return false;
    } finally {
      setBusy(null);
    }
  }
  function selectTab(next: Tab) {
    setTab(next);
    setMobileMenu(false);
    setMessage(null);
  }
  const active = releases.find((r) => r.active && r.status === "published");
  const downloads = releases.reduce((total, r) => total + r.downloads, 0);
  const heading = titles[tab];

  if (loading && !session)
    return (
      <div className="admin-app admin-auth">
        <div className="admin-auth-card">
          <Spinner />
          <p>Memeriksa akses administrator…</p>
        </div>
      </div>
    );
  if (!session?.authorized)
    return (
      <div className="admin-app admin-auth">
        <a href="/" className="admin-back">
          ← Kembali ke website
        </a>
        <div className="admin-auth-card">
          <a className="admin-brand" href="/">
            <img src="/brand/logo.svg" width="44" height="44" alt="" />
            Dana Keluarga<span>ADMIN</span>
          </a>
          <div className="admin-auth-icon">
            <ShieldCheck size={32} />
          </div>
          <p className="admin-eyebrow">RUANG ADMINISTRATOR</p>
          <h1>
            {session?.authenticated
              ? "Akses terbatas."
              : "Selamat datang kembali."}
          </h1>
          <p>
            {session?.authenticated
              ? "Akun Anda telah terautentikasi. Akses pengelolaan hanya tersedia bagi administrator yang diizinkan."
              : "Masuk dengan akun ChatGPT administrator untuk mengelola website Dana Keluarga."}
          </p>
          {session?.authenticated && session.user ? (
            <div className="admin-access-info">
              <strong>{session.user.email}</strong>
              <span>ID akun</span>
              <code>{session.user.id}</code>
              {!session.configured ? (
                <p>
                  Daftar administrator belum dikonfigurasi. Pemilik deployment
                  perlu menambahkan ID akun ini ke environment variable{" "}
                  <code>ADMIN_USER_IDS</code>.
                </p>
              ) : (
                <p>
                  Hubungi pemilik deployment untuk meminta akses administrator.
                </p>
              )}
            </div>
          ) : null}
          {message ? (
            <p role="alert" className="admin-inline-error">
              {message.text}
            </p>
          ) : null}
          {!session?.authenticated ? (
            <a
              className="admin-button"
              href="/signin-with-chatgpt?return_to=%2Fadmin"
              target="_top"
            >
              Masuk dengan ChatGPT <ArrowUpRight size={17} />
            </a>
          ) : (
            <a
              className="admin-button admin-button-light"
              href="/signout-with-chatgpt?return_to=%2Fadmin"
              target="_top"
            >
              Ganti akun <LogOut size={16} />
            </a>
          )}
          <small>Setiap perubahan diperiksa dan diotorisasi oleh server.</small>
        </div>
      </div>
    );

  if (!content)
    return (
      <main className="admin-app admin-auth">
        <div className="admin-auth-card">
          <a className="admin-brand" href="/">
            Dana Keluarga<span>ADMIN</span>
          </a>
          <h1>
            {loading ? "Memuat data pengelolaan…" : "Data belum dapat dimuat."}
          </h1>
          <p role={loading ? "status" : "alert"}>
            {message?.text || "Menghubungkan ke penyimpanan website."}
          </p>
          {!loading && (
            <Button onClick={() => window.location.reload()}>
              Coba kembali
            </Button>
          )}
          <a className="admin-text-button" href="/">
            Kembali ke website
          </a>
        </div>
      </main>
    );

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${mobileMenu ? "is-open" : ""}`}>
        <a className="admin-brand" href="/">
          <img src="/brand/logo.svg" width="40" height="40" alt="" />
          Dana Keluarga<span>ADMIN</span>
        </a>
        <p className="admin-nav-label">PENGELOLAAN</p>
        <nav aria-label="Menu administrator">
          {navigation.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => selectTab(id)}
            >
              <Icon size={19} />
              {title}
              {id === "releases" && releases.length > 0 ? (
                <span className="admin-count">{releases.length}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noopener noreferrer">
            Lihat website <ArrowUpRight size={16} />
          </a>
          <div className="admin-user">
            <span>
              {(session.user?.name || session.user?.email || "A")
                .charAt(0)
                .toUpperCase()}
            </span>
            <div>
              <strong>{session.user?.name || "Administrator"}</strong>
              <small>{session.user?.email}</small>
            </div>
            <a
              title="Keluar"
              aria-label="Keluar"
              href="/signout-with-chatgpt?return_to=%2Fadmin"
              target="_top"
            >
              <LogOut size={17} />
            </a>
          </div>
        </div>
      </aside>
      {mobileMenu ? (
        <button
          className="admin-overlay"
          aria-label="Tutup menu"
          onClick={() => setMobileMenu(false)}
        />
      ) : null}
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            aria-label={mobileMenu ? "Tutup menu" : "Buka menu"}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span>
            Dana Keluarga <span className="admin-topbar-separator">/</span>{" "}
            <strong>{navigation.find((n) => n.id === tab)?.title}</strong>
          </span>
          <span className="admin-secure">
            <span />
            Akses administrator
          </span>
        </header>
        <main className="admin-main">
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">{heading.eyebrow}</p>
              <h1>{heading.title}</h1>
              <p>{heading.description}</p>
            </div>
            <Button
              className="admin-button-light"
              busy={busy === "refresh"}
              onClick={() =>
                mutate("refresh", async () => {}, "Data berhasil diperbarui.")
              }
            >
              <RefreshCw size={15} />
              Muat ulang
            </Button>
          </div>
          {message ? (
            <div
              className={`admin-notice ${message.error ? "is-error" : ""}`}
              role={message.error ? "alert" : "status"}
            >
              {message.error ? <CircleHelp size={18} /> : <Check size={18} />}
              <span>{message.text}</span>
              <button
                aria-label="Tutup pemberitahuan"
                onClick={() => setMessage(null)}
              >
                <X size={16} />
              </button>
            </div>
          ) : null}
          {loading ? (
            <div className="admin-loading">
              <Spinner />
              Memuat data pengelolaan…
            </div>
          ) : null}
          {tab === "overview" ? (
            <>
              <div className="admin-stat-grid">
                <Stat
                  label="Permintaan unduhan"
                  value={downloads.toLocaleString("id-ID")}
                  icon={<Download size={20} />}
                  note="Termasuk unduhan berulang"
                />
                <Stat
                  label="Versi tersimpan"
                  value={String(releases.length)}
                  icon={<Package size={20} />}
                  note={`${releases.filter((r) => r.status === "published").length} versi dipublikasikan`}
                />
                <Stat
                  label="Screenshot asli"
                  value={String(screenshots.length)}
                  icon={<ImageIcon size={20} />}
                  note="Ditampilkan di galeri aplikasi"
                />
              </div>
              <div className="admin-overview-grid">
                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <h2>Rilis aktif</h2>
                      <p>Versi yang ditawarkan kepada pengunjung.</p>
                    </div>
                    <Package size={22} />
                  </div>
                  {active ? (
                    <div className="admin-active-release">
                      <span className="admin-pill is-published">Aktif</span>
                      <h3>
                        Dana Keluarga <span>v{active.versionName}</span>
                      </h3>
                      <p>
                        {date(active.releaseDate)} · {size(active.fileSize)} ·{" "}
                        {active.minAndroid}
                      </p>
                      <ul>
                        {active.releaseNotes.slice(0, 3).map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                      <button
                        className="admin-text-button"
                        onClick={() => selectTab("releases")}
                      >
                        Kelola versi aplikasi <ArrowUpRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <Empty
                      icon={<Package size={28} />}
                      title="Belum ada rilis aktif"
                    >
                      Unggah APK release yang telah diverifikasi untuk
                      mengaktifkan unduhan resmi.
                      <button
                        className="admin-text-button"
                        onClick={() => selectTab("releases")}
                      >
                        Unggah versi pertama <ArrowUpRight size={16} />
                      </button>
                    </Empty>
                  )}
                </section>
                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <h2>Langkah berikutnya</h2>
                      <p>Jaga informasi produk tetap akurat.</p>
                    </div>
                    <Check size={22} />
                  </div>
                  <div className="admin-checklist">
                    <button onClick={() => selectTab("releases")}>
                      <span className={active ? "is-complete" : ""}>
                        {active ? <Check size={15} /> : "01"}
                      </span>
                      <div>
                        <strong>Siapkan APK resmi</strong>
                        <small>
                          Verifikasi signature dan pilih rilis aktif.
                        </small>
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                    <button onClick={() => selectTab("screenshots")}>
                      <span className={screenshots.length ? "is-complete" : ""}>
                        {screenshots.length ? <Check size={15} /> : "02"}
                      </span>
                      <div>
                        <strong>Lengkapi galeri aplikasi</strong>
                        <small>Unggah screenshot dari perangkat Android.</small>
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                    <button onClick={() => selectTab("content")}>
                      <span
                        className={
                          content?.settings.supportEmail ? "is-complete" : ""
                        }
                      >
                        {content?.settings.supportEmail ? (
                          <Check size={15} />
                        ) : (
                          "03"
                        )}
                      </span>
                      <div>
                        <strong>Tinjau konten dan kontak</strong>
                        <small>
                          Pastikan panduan dan bantuan mudah ditemukan.
                        </small>
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </section>
              </div>
              <div className="admin-info">
                <ShieldCheck size={21} />
                <div>
                  <strong>Publikasikan dengan percaya diri.</strong>
                  <p>
                    Rilis yang diunggah disimpan sebagai draft. Hanya APK dengan
                    bukti verifikasi yang valid dapat dipublikasikan.
                  </p>
                </div>
              </div>
            </>
          ) : null}
          {tab === "releases" ? (
            <>
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Unggah versi baru</h2>
                    <p>Metadata aplikasi dibaca dari bukti verifikasi APK.</p>
                  </div>
                  <Upload size={21} />
                </div>
                <ReleaseUpload
                  busy={busy === "upload-release"}
                  onSubmit={(form) =>
                    mutate(
                      "upload-release",
                      () =>
                        api("/api/admin/releases", {
                          method: "POST",
                          body: form,
                        }),
                      "APK tersimpan sebagai draft. Tinjau versi sebelum dipublikasikan.",
                    )
                  }
                />
              </section>
              <div className="admin-section-label">
                <h2>
                  Riwayat versi <span>{releases.length}</span>
                </h2>
                <p>
                  Unduhan dihitung sebagai permintaan file, bukan pengguna unik.
                </p>
              </div>
              {releases.length ? (
                <div className="admin-release-list">
                  {releases.map((release) => (
                    <ReleaseCard
                      key={`${release.id}-${release.status}-${release.active}`}
                      release={release}
                      busy={busy === release.id}
                      onSave={(body) =>
                        mutate(
                          release.id,
                          () =>
                            api(
                              `/api/admin/releases/${encodeURIComponent(release.id)}`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(body),
                              },
                            ),
                          "Versi aplikasi berhasil diperbarui.",
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <section className="admin-panel">
                  <Empty
                    icon={<Package size={30} />}
                    title="Riwayat rilis dimulai di sini"
                  >
                    Belum ada APK yang diunggah. Website akan menampilkan status
                    menunggu rilis resmi.
                  </Empty>
                </section>
              )}
            </>
          ) : null}
          {tab === "screenshots" ? (
            <>
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Tambah screenshot</h2>
                    <p>
                      Gunakan PNG, JPEG, atau WebP asli. Hindari data pribadi
                      dan saldo pengguna.
                    </p>
                  </div>
                  <ImageIcon size={21} />
                </div>
                <ScreenshotUpload
                  busy={busy === "upload-screenshot"}
                  onSubmit={(form) =>
                    mutate(
                      "upload-screenshot",
                      () =>
                        api("/api/admin/screenshots", {
                          method: "POST",
                          body: form,
                        }),
                      "Screenshot berhasil ditambahkan ke galeri.",
                    )
                  }
                />
              </section>
              <div className="admin-section-label">
                <h2>
                  Galeri publik <span>{screenshots.length}</span>
                </h2>
                <p>Urutan terkecil ditampilkan terlebih dahulu.</p>
              </div>
              {screenshots.length ? (
                <div className="admin-screenshot-grid">
                  {screenshots.map((screenshot) => (
                    <ScreenshotCard
                      key={screenshot.id}
                      screenshot={screenshot}
                      busy={busy === screenshot.id}
                      onSave={(body) =>
                        mutate(
                          screenshot.id,
                          () =>
                            api(
                              `/api/admin/screenshots/${encodeURIComponent(screenshot.id)}`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(body),
                              },
                            ),
                          "Informasi screenshot berhasil diperbarui.",
                        )
                      }
                      onDelete={() => {
                        if (
                          window.confirm(
                            `Hapus screenshot “${screenshot.title}” dari website?`,
                          )
                        )
                          void mutate(
                            screenshot.id,
                            () =>
                              api(
                                `/api/admin/screenshots/${encodeURIComponent(screenshot.id)}`,
                                { method: "DELETE" },
                              ),
                            "Screenshot berhasil dihapus.",
                          );
                      }}
                    />
                  ))}
                </div>
              ) : (
                <section className="admin-panel">
                  <Empty
                    icon={<ImageIcon size={30} />}
                    title="Menunggu tampilan asli aplikasi"
                  >
                    Screenshot yang diunggah akan tampil pada pratinjau aplikasi
                    di website.
                  </Empty>
                </section>
              )}
            </>
          ) : null}
          {tab === "content" && content ? (
            <ContentEditor
              key={JSON.stringify(content)}
              initial={content}
              busy={busy === "content"}
              onSave={(body) =>
                mutate(
                  "content",
                  () =>
                    api("/api/admin/content", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    }),
                  "Konten website berhasil disimpan.",
                )
              }
            />
          ) : null}
          <footer className="admin-footer">
            <span>© {new Date().getFullYear()} Dana Keluarga</span>
            <span>Ruang kelola website resmi</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function Stat({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  note: string;
}) {
  return (
    <div className="admin-stat">
      <div>
        <p>{label}</p>
        <span>{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function ReleaseUpload({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (form: FormData) => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("apk");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".apk")) {
      setError("Pilih file aplikasi Android dengan ekstensi .apk.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Ukuran APK maksimal 20 MiB.");
      return;
    }
    data.set(
      "releaseNotes",
      JSON.stringify(
        String(data.get("notes") || "")
          .split("\n")
          .map((n) => n.trim())
          .filter(Boolean),
      ),
    );
    data.delete("notes");
    if (await onSubmit(data)) form.reset();
  }
  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="admin-form-grid">
        <label className="admin-file-field">
          <span>
            File APK release <b>*</b>
          </span>
          <div>
            <Upload size={24} />
            <strong>Pilih APK bertanda tangan</strong>
            <small>Maksimal 20 MiB · APK debug ditolak</small>
            <input
              name="apk"
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              required
            />
          </div>
        </label>
        <label className="admin-file-field">
          <span>
            Bukti verifikasi <b>*</b>
          </span>
          <div>
            <ShieldCheck size={24} />
            <strong>Pilih verification receipt</strong>
            <small>File JSON hasil scripts/verify-apk.mjs</small>
            <input
              name="receipt"
              type="file"
              accept=".json,application/json"
              required
            />
          </div>
        </label>
        <label>
          <span>
            Tanggal rilis <b>*</b>
          </span>
          <input
            name="releaseDate"
            type="date"
            defaultValue={new Intl.DateTimeFormat("en-CA", {
              timeZone: "Asia/Jakarta",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date())}
            required
          />
        </label>
        <div className="admin-form-help">
          <strong>Sebelum mengunggah</strong>
          <p>
            Jalankan verifier dengan Android SDK Build Tools. Receipt mengikat
            checksum, signature, dan metadata APK sehingga file tidak dapat
            ditukar.
          </p>
        </div>
      </div>
      <label>
        <span>
          Catatan pembaruan <b>*</b>
        </span>
        <textarea
          name="notes"
          rows={4}
          placeholder="Tuliskan satu pembaruan di setiap baris"
          maxLength={12000}
          required
        />
      </label>
      {error ? (
        <p role="alert" className="admin-inline-error">
          {error}
        </p>
      ) : null}
      <div className="admin-form-actions">
        <p>Rilis baru disimpan sebagai draft.</p>
        <Button type="submit" busy={busy}>
          <Upload size={16} />
          Unggah APK
        </Button>
      </div>
    </form>
  );
}
function ReleaseCard({
  release,
  busy,
  onSave,
}: {
  release: Release;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(release.releaseNotes.join("\n"));
  const [releaseDate, setReleaseDate] = useState(
    release.releaseDate.slice(0, 10),
  );
  return (
    <section className="admin-panel admin-release-card">
      <div className="admin-release-header">
        <span className="admin-release-icon">
          <Package size={24} />
        </span>
        <div>
          <h3>
            Dana Keluarga <strong>v{release.versionName}</strong>
          </h3>
          <p>
            Build {release.versionCode} · {date(release.releaseDate)}
          </p>
        </div>
        <span className={`admin-pill is-${release.status}`}>
          {release.active && release.status === "published"
            ? "Aktif"
            : {
                draft: "Draft",
                published: "Dipublikasikan",
                archived: "Diarsipkan",
              }[release.status]}
        </span>
      </div>
      <div className="admin-release-meta">
        <span>
          <strong>{size(release.fileSize)}</strong>Ukuran file
        </span>
        <span>
          <strong>{release.minAndroid}</strong>Kompatibilitas
        </span>
        <span>
          <strong>{release.downloads.toLocaleString("id-ID")}</strong>Permintaan
          unduhan
        </span>
      </div>
      <div className="admin-checksum">
        <span>SHA-256</span>
        <code>{release.sha256}</code>
      </div>
      {editing ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await onSave({
                releaseNotes: notes
                  .split("\n")
                  .map((n) => n.trim())
                  .filter(Boolean),
                releaseDate,
              })
            )
              setEditing(false);
          }}
          className="admin-form admin-release-edit"
        >
          <label>
            <span>Tanggal rilis</span>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Catatan pembaruan</span>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </label>
          <div className="admin-button-group">
            <Button type="submit" busy={busy}>
              Simpan perubahan
            </Button>
            <Button
              type="button"
              className="admin-button-light"
              onClick={() => setEditing(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      ) : (
        <ul className="admin-release-notes">
          {release.releaseNotes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}
      <div className="admin-release-actions">
        <button
          type="button"
          className="admin-text-button"
          disabled={busy}
          onClick={() => setEditing(!editing)}
        >
          <FileText size={15} />
          Edit catatan
        </button>
        <div className="admin-button-group">
          {release.status !== "archived" ? (
            <Button
              type="button"
              className="admin-button-subtle admin-button-danger"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    `Arsipkan v${release.versionName}? Versi ini tidak lagi dapat diunduh dari website.`,
                  )
                )
                  void onSave({ status: "archived", active: false });
              }}
            >
              <Archive size={15} />
              Arsipkan
            </Button>
          ) : null}
          {!release.active || release.status !== "published" ? (
            <Button
              busy={busy}
              type="button"
              onClick={() => void onSave({ status: "published", active: true })}
            >
              <Check size={15} />
              {release.status === "draft"
                ? "Publikasikan & aktifkan"
                : "Jadikan aktif"}
            </Button>
          ) : (
            <a
              className="admin-button admin-button-light"
              href={release.downloadUrl}
            >
              <Download size={15} />
              Unduh APK
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
function ScreenshotUpload({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (form: FormData) => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    const image = data.get("image");
    if (!(image instanceof File) || image.size > 5 * 1024 * 1024) {
      setError("Pilih screenshot berukuran maksimal 5 MiB.");
      return;
    }
    if (await onSubmit(data)) form.reset();
  }
  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="admin-form-grid">
        <label>
          <span>
            File screenshot <b>*</b>
          </span>
          <input
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
          />
        </label>
        <label>
          <span>
            Judul tampilan <b>*</b>
          </span>
          <input
            name="title"
            placeholder="Contoh: Dashboard keluarga"
            maxLength={100}
            required
          />
        </label>
        <label>
          <span>
            Deskripsi untuk aksesibilitas <b>*</b>
          </span>
          <input
            name="alt"
            placeholder="Jelaskan informasi yang terlihat pada screenshot"
            maxLength={500}
            required
          />
        </label>
        <label>
          <span>Urutan galeri</span>
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={1000}
            defaultValue={0}
            required
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="admin-inline-error">
          {error}
        </p>
      ) : null}
      <div className="admin-form-actions">
        <p>Hanya unggah tampilan aplikasi yang benar-benar tersedia.</p>
        <Button type="submit" busy={busy}>
          <Plus size={16} />
          Tambah screenshot
        </Button>
      </div>
    </form>
  );
}
function ScreenshotCard({
  screenshot,
  busy,
  onSave,
  onDelete,
}: {
  screenshot: Screenshot;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <article className="admin-panel admin-screenshot-card">
      <div className="admin-screenshot-preview">
        <img src={screenshot.url} alt={screenshot.alt} loading="lazy" />
      </div>
      {editing ? (
        <form
          className="admin-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            if (
              await onSave({
                title: form.get("title"),
                alt: form.get("alt"),
                sortOrder: Number(form.get("sortOrder")),
              })
            )
              setEditing(false);
          }}
        >
          <label>
            <span>Judul</span>
            <input
              name="title"
              defaultValue={screenshot.title}
              maxLength={100}
              required
            />
          </label>
          <label>
            <span>Deskripsi</span>
            <input
              name="alt"
              defaultValue={screenshot.alt}
              maxLength={500}
              required
            />
          </label>
          <label>
            <span>Urutan</span>
            <input
              name="sortOrder"
              type="number"
              min={0}
              max={1000}
              defaultValue={screenshot.sortOrder}
              required
            />
          </label>
          <div className="admin-button-group">
            <Button type="submit" busy={busy}>
              Simpan
            </Button>
            <button
              type="button"
              className="admin-text-button"
              onClick={() => setEditing(false)}
            >
              Batal
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-screenshot-caption">
          <div>
            <h3>{screenshot.title}</h3>
            <p>Urutan {screenshot.sortOrder}</p>
          </div>
          <div className="admin-button-group">
            <button
              type="button"
              className="admin-icon-button"
              aria-label={`Edit ${screenshot.title}`}
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              <FileText size={17} />
            </button>
            <button
              type="button"
              className="admin-icon-button admin-button-danger"
              aria-label={`Hapus ${screenshot.title}`}
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
function ContentEditor({
  initial,
  busy,
  onSave,
}: {
  initial: Content;
  busy: boolean;
  onSave: (body: Content) => Promise<boolean>;
}) {
  const [settings, setSettings] = useState(initial.settings);
  const [faqs, setFaqs] = useState(initial.faqs);
  function field(key: keyof Settings, value: string) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }
  function faqField(index: number, key: "question" | "answer", value: string) {
    setFaqs((previous) =>
      previous.map((faq, i) => (i === index ? { ...faq, [key]: value } : faq)),
    );
  }
  return (
    <form
      className="admin-content-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          settings,
          faqs: faqs.map((faq, sortOrder) => ({ ...faq, sortOrder })),
        });
      }}
    >
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Cerita Dana Keluarga</h2>
            <p>Informasi utama yang menyambut pengunjung website.</p>
          </div>
          <FileText size={21} />
        </div>
        <div className="admin-form">
          <label>
            <span>
              Headline utama <b>*</b>
            </span>
            <input
              value={settings.heroTitle}
              onChange={(e) => field("heroTitle", e.target.value)}
              maxLength={180}
              required
            />
          </label>
          <label>
            <span>
              Deskripsi utama <b>*</b>
            </span>
            <textarea
              value={settings.heroDescription}
              onChange={(e) => field("heroDescription", e.target.value)}
              rows={3}
              maxLength={800}
              required
            />
          </label>
          <label>
            <span>
              Tentang aplikasi <b>*</b>
            </span>
            <textarea
              value={settings.aboutText}
              onChange={(e) => field("aboutText", e.target.value)}
              rows={4}
              maxLength={3000}
              required
            />
          </label>
        </div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Kontak bantuan</h2>
            <p>Gunakan alamat yang dipantau oleh tim pengelola aplikasi.</p>
          </div>
          <CircleHelp size={21} />
        </div>
        <div className="admin-form admin-form-grid">
          <label>
            <span>Email support</span>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => field("supportEmail", e.target.value)}
              placeholder="support@domain-resmi.id"
              maxLength={254}
            />
          </label>
          <label>
            <span>Tautan bantuan</span>
            <input
              type="url"
              pattern="https://.*"
              title="Gunakan tautan HTTPS"
              value={settings.supportUrl}
              onChange={(e) => field("supportUrl", e.target.value)}
              placeholder="https://…"
              maxLength={1000}
            />
          </label>
        </div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Pertanyaan yang sering diajukan</h2>
            <p>FAQ ditampilkan sesuai urutan daftar di bawah.</p>
          </div>
          <button
            type="button"
            className="admin-button admin-button-light"
            disabled={faqs.length >= 40}
            onClick={() =>
              setFaqs((previous) => [
                ...previous,
                {
                  id: crypto.randomUUID(),
                  question: "",
                  answer: "",
                  sortOrder: previous.length,
                },
              ])
            }
          >
            <Plus size={16} />
            Tambah FAQ
          </button>
        </div>
        <div className="admin-faq-list">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="admin-faq-editor">
              <div className="admin-faq-number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="admin-form">
                <label>
                  <span>
                    Pertanyaan <b>*</b>
                  </span>
                  <input
                    value={faq.question}
                    onChange={(e) =>
                      faqField(index, "question", e.target.value)
                    }
                    maxLength={300}
                    required
                  />
                </label>
                <label>
                  <span>
                    Jawaban <b>*</b>
                  </span>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => faqField(index, "answer", e.target.value)}
                    rows={3}
                    maxLength={3000}
                    required
                  />
                </label>
              </div>
              <button
                type="button"
                className="admin-icon-button admin-button-danger"
                aria-label={`Hapus FAQ ${index + 1}`}
                onClick={() => {
                  if (
                    window.confirm(
                      "Hapus pertanyaan ini? Perubahan diterapkan setelah disimpan.",
                    )
                  )
                    setFaqs((previous) =>
                      previous.filter((_, i) => i !== index),
                    );
                }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {!faqs.length ? (
            <Empty icon={<CircleHelp size={25} />} title="Belum ada FAQ">
              Tambahkan pertanyaan untuk membantu pengguna mengenal aplikasi.
            </Empty>
          ) : null}
        </div>
      </section>
      <div className="admin-save-bar">
        <p>Perubahan akan langsung tampil di website setelah disimpan.</p>
        <Button type="submit" busy={busy}>
          <Check size={16} />
          Simpan konten website
        </Button>
      </div>
    </form>
  );
}
