import type { Metadata } from "next";
import "./globals.css";
const siteUrl =
  process.env.SITE_URL ||
  "https://dana-keluarga-official.quiet-gem-2016.chatgpt.site";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dana Keluarga — Satu keluarga, satu tujuan.",
    template: "%s | Dana Keluarga",
  },
  description:
    "Ruang bersama untuk mengelola kas, kontribusi, dan pinjaman keluarga. Kenali Dana Keluarga dan dapatkan APK Android resmi saat tersedia.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Dana Keluarga",
    title: "Dana Keluarga — Satu keluarga, satu tujuan.",
    description: "Kelola keuangan keluarga, lebih mudah dan transparan.",
    images: [
      {
        url: "/brand/social-card.png",
        width: 1200,
        height: 630,
        alt: "Dana Keluarga — Satu keluarga, satu tujuan.",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg", apple: "/brand/app-icon.png" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
