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
  other: { "theme-color": "#050B12" },
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SkillForge",
  url: SITE_URL,
  description:
    "The agent skill registry — find and install AI agent skills from public GitHub. Safety-scanned SKILL.md packages with one-command install.",
  inLanguage: "en",
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


const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is an agent skill?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An agent skill is a SKILL.md package that teaches AI coding agents (Claude, Cursor, and similar) how to perform a task. SkillForge indexes public skills from GitHub.",
      },
    },
    {
      "@type": "Question",
      name: "How do I install a skill from SkillForge?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Copy the install command from any skill page and run it in your terminal: npx skillforge add owner/repo/skill",
      },
    },
    {
      "@type": "Question",
      name: "Are SkillForge skills safety-scanned?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Skills are scanned for risky patterns before publish. Block-severity findings are not auto-published; review flags may still publish for high-star or trusted sources. Install metrics are labeled live (when install volume is meaningful) or estimated from repository stars.",
      },
    },
    {
      "@type": "Question",
      name: "Where do SkillForge skills come from?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "From public GitHub repositories that publish SKILL.md files. Sources include community and organization repos such as Anthropic, Vercel Labs, and independent authors.",
      },
    },
  ],
};

const softwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SkillForge",
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "AI agent skill registry",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Browse and install agent skills with npx skillforge add. Safety-scanned catalog from public GitHub. Thousands of SKILL.md packages ranked by activity.",
  url: SITE_URL,
  featureList: [
    "Search public agent skills",
    "Safety pattern scanning",
    "One-command CLI install",
    "Daily weekly and hot rankings",
    "Install metrics labeled live or estimated",
  ],
  softwareHelp: {
    "@type": "WebPage",
    url: `${SITE_URL}/#install`,
    name: "Install agent skills",
  },
};

const datasetLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "SkillForge agent skill index",
  description:
    "Continuously updated index of public AI agent skills (SKILL.md) discovered on GitHub, with safety scan signals and install metrics.",
  url: SITE_URL,
  license: "https://github.com/Rustys90/skillforge",
  creator: { "@type": "Organization", name: "SkillForge", url: SITE_URL },
  isAccessibleForFree: true,
  keywords: [
    "AI agent skills",
    "SKILL.md",
    "Claude skills",
    "Cursor agent",
    "agent skill registry",
  ],
};

function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Condiment&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Syne:wght@600;700&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(softwareLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(datasetLd) }}
        />
      </head>
      <body className="min-h-screen bg-space antialiased">{children}</body>
    </html>
  );
}
