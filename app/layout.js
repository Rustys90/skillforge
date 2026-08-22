import "./globals.css";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SkillForge — the agent skill registry",
    template: "%s | SkillForge",
  },
  description:
    "Find, browse, and install AI agent skills (SKILL.md) from public GitHub. Safety-scanned. One-command install for Claude, Cursor, and coding agents.",
  keywords: [
    "AI agent skills",
    "SKILL.md",
    "Claude skills",
    "Cursor agent",
    "agent skill registry",
    "SkillForge",
    "install agent skills",
    "GitHub skills",
  ],
  authors: [{ name: "SkillForge" }],
  creator: "SkillForge",
  publisher: "SkillForge",
  applicationName: "SkillForge",
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "SkillForge",
    title: "SkillForge — the agent skill registry",
    description:
      "Search and install AI agent skills from public GitHub repos. Safety-scanned. One command.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillForge — the agent skill registry",
    description:
      "Search and install AI agent skills from public GitHub repos. Safety-scanned. One command.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: { "theme-color": "#0a0a0b" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SkillForge",
  url: SITE_URL,
  description:
    "The agent skill registry — find and install AI agent skills from public GitHub.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
