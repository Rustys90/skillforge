// app/layout.js
export const metadata = {
  title: {
    default: "SkillForge — the agent skill registry",
    template: "%s | SkillForge",
  },
  description: "Find, browse, and install AI agent skills (SKILL.md files) from public GitHub repos, in one command.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500&display=swap"
        />
      </head>
      <body style={{ margin: 0, background: "#0a0a0b" }}>{children}</body>
    </html>
  );
}
