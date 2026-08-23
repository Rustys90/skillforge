import "./globals.css";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SkillForge — the agent skill registry",
    template: "%s | SkillForge",
  },
  description:
    "Find, browse, and install AI agent skills (SKILL.md) from public GitHub. Safety-scanned. Honest install metrics. One-command install for Claude, Cursor, and coding agents.",
  keywords: [
    "AI agent skills",
    "SKILL.md",
    "Claude skills",
    "Cursor agent",
    "agent skill registry",
    "SkillForge",
    "install agent skills",
    "GitHub skills",
    "npx skillforge",
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
      "Search and install AI agent skills from public GitHub. Safety-scanned. Live vs estimated metrics labeled.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SkillForge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillForge — the agent skill registry",
    description:
      "Search and install AI agent skills from public GitHub. Safety-scanned. One command.",
    images: ["/twitter-image"],
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
  other: { "theme-color": "#010828" },
};

const websiteLd = {
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

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SkillForge",
  url: SITE_URL,
  description: "Public registry of AI agent skills indexed from GitHub.",
  sameAs: ["https://github.com/Rustys90/skillforge"],
};

const softwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SkillForge",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Browse and install agent skills with npx skillforge add. Safety-scanned catalog from public GitHub.",
  url: SITE_URL,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Condiment&family=Inter:wght@300;400;500;600&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
        />
      </head>
      <body className="min-h-screen bg-space antialiased">{children}</body>
    </html>
  );
}
