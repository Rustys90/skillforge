const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/api/admin", "/api/cron"],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/skills/"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace(/^https?:\/\//, ""),
  };
}
