import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const origin =
    process.env.SITE_URL ||
    "https://dana-keluarga-official.quiet-gem-2016.chatgpt.site";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: origin + "/sitemap.xml",
  };
}
