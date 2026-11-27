import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin =
    process.env.SITE_URL ||
    "https://dana-keluarga-official.quiet-gem-2016.chatgpt.site";
  return ["", "/privasi", "/ketentuan"].map((path) => ({
    url: origin + path,
    changeFrequency: "monthly" as const,
    priority: path ? 0.3 : 1,
  }));
}
