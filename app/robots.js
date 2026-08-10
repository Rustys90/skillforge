// app/robots.js
const SITE_URL = process.env.SITE_URL || "https://skillforge.example.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
