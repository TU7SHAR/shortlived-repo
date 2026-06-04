import { siteConfig } from "./utils/config";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/(dashboard)/", "/api/", "/account/", "/(auth)/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
