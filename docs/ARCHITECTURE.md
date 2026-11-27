# Arsitektur dan kontrak API

## Pemisahan sistem

Website berjalan sebagai Cloudflare Worker melalui Vinext. Website tidak memanggil API keuangan Android dan tidak memakai PostgreSQL/Prisma aplikasi. Situs ini memiliki D1 untuk metadata dan R2 untuk berkas. Perubahan konten website tidak mengubah akun atau fungsi aplikasi Android.

```text
Pengunjung → Worker / halaman React
                  ├─ API publik → D1 metadata
                  ├─ unduhan → D1 status + R2 file
                  └─ admin → identitas Sites + allowlist
                              ├─ D1 rilis/konten/audit
                              └─ R2 APK/gambar

Mesin penerbit → apksigner + aapt → bukti HMAC → upload admin
```

## Struktur utama

| Lokasi | Fungsi |
| --- | --- |
| `app/site/` | Landing page dan interaksi pengunjung |
| `app/admin/` | Antarmuka administrasi |
| `app/api/public/` | Konten publik, rilis, screenshot, FAQ |
| `app/api/download/[id]/` | Penyajian APK dan penghitung permintaan |
| `app/api/media/[id]/` | Penyajian gambar dari R2 |
| `app/api/admin/` | API yang membutuhkan admin |
| `lib/server/` | Pemeriksaan akses, validasi, checksum, akses penyimpanan |
| `db/schema.ts`, `drizzle/` | Schema D1 dan migration |
| `scripts/verify-apk.mjs` | Verifikasi signature/manifest APK offline |
| `app/privasi/`, `app/ketentuan/` | Dokumen pengguna yang masih perlu disahkan |

## Data

`releases`: version name/code unik, tanggal, nama/ukuran file, minimum Android/SDK, SHA-256, fingerprint signer, object key R2, release notes, status, aktif, penghitung, waktu dibuat.

`screenshots`: judul, alt text, object key, content type, urutan, waktu. `content`: settings dan FAQ dalam JSON. `audit`: ID, actor ID, tindakan, target, waktu. Audit website tidak menyimpan password atau transaksi finansial aplikasi.

File APK tidak disimpan di Git. Database menyimpan object key, bukan URL bucket publik. Versi dan screenshot dapat diperbarui melalui dashboard tanpa mengedit source website. Integrasi GitHub Releases otomatis belum diterapkan; jalur yang tersedia adalah unggahan admin ke R2.

## Endpoint

| Metode dan path | Akses | Perilaku |
| --- | --- | --- |
| `GET /api/public` | Publik sesuai audience Sites | Konten dan rilis untuk pengunjung |
| `GET /api/download/:id` | Publik sesuai audience Sites | APK published; counter setelah objek ditemukan |
| `HEAD /api/download/:id` | Publik sesuai audience Sites | Ketersediaan/ukuran; tanpa tambahan counter |
| `GET /api/media/:id` | Publik sesuai audience Sites | Gambar screenshot terdaftar |
| `GET /api/admin/session` | Status sesi | Status signin, izin, dan ID akun sendiri |
| `GET /api/admin/releases` | Admin | Daftar semua rilis |
| `POST /api/admin/releases` | Admin, origin sama | APK + receipt + tanggal + release notes; draft |
| `PATCH /api/admin/releases/:id` | Admin, origin sama | Status, aktif, tanggal, release notes |
| `DELETE /api/admin/releases/:id` | Admin, origin sama | Hapus rilis selain published beserta file |
| `GET/PUT /api/admin/content` | Admin; origin sama untuk PUT | Settings dan FAQ |
| `GET/POST /api/admin/screenshots` | Admin; origin sama untuk POST | Daftar/unggah screenshot |
| `PATCH/DELETE /api/admin/screenshots/:id` | Admin, origin sama | Metadata/urutan atau penghapusan |

Respons JSON error memiliki field `error`. Status mencakup 400 input, 401 belum signin, 403 bukan admin/origin, 404 tidak ditemukan, 409 konflik, 413 ukuran, 415 content type, dan 503 konfigurasi/penyimpanan belum tersedia. Stack trace tidak ditampilkan kepada pengunjung.

## Batas keamanan dan kapasitas

Autentikasi berasal dari dispatch Sites; identitas saja belum memberi hak admin. Allowlist ID diperiksa server untuk setiap operasi admin. Mutasi memerlukan Origin sama. Query terparameterisasi, nama object R2 dibuat server, body dibatasi, dan file divalidasi.

APK maksimum 20 MiB; multipart mendapat ruang tambahan untuk receipt/metadata. Screenshot maksimum 5 MiB, format PNG/JPEG/WebP dengan pemeriksaan signature dasar; maksimum 30 gambar. Batas APK menjaga buffering/checksum sesuai Worker 128 MB. Jika aplikasi membesar, desain streaming/direct upload terotorisasi dan pemeriksaan ulang dahulu; jangan sekadar menaikkan batas.

Verifikasi Android SDK dilakukan di mesin penerbit, bukan Worker. HMAC membuktikan bukti dibuat pihak pemegang `RELEASE_VERIFICATION_KEY`; pemegang secret dapat menghasilkan bukti, sehingga secret harus dijaga setara kewenangan penerbit. Server mencocokkan HMAC, package/fingerprint, versi, ukuran, serta SHA-256 dengan bytes unggahan. Ini bukan antivirus atau penetration test.

Counter menghitung permintaan file yang diterima server, bukan unduhan selesai atau perangkat unik. Pemindaian otomatis/pengulangan dapat menambah nilai. Byte-range/resume khusus, audit antivirus, MFA khusus aplikasi, dan sinkronisasi GitHub Releases tidak diklaim tersedia.

Jangan menjalankan Worker pada origin publik yang menerima header identitas klien tanpa dispatch Sites atau pengganti trusted auth proxy yang ditinjau. Header identitas klien tidak boleh dipercaya. Simulasi signin portable hanya untuk loopback development dan tidak masuk build produksi.
