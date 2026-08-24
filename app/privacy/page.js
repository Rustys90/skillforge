import { LegalPage, H, P, Ul } from "../../components/LegalPage.jsx";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How SkillForge collects, uses, and protects information when you use the agent skill registry.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="24 August 2026">
      <P>
        This Privacy Policy describes how SkillForge (&quot;SkillForge,&quot; &quot;we,&quot; &quot;us&quot;)
        handles information when you use {SITE_URL} and related APIs. SkillForge is an index of public AI
        agent skills (SKILL.md files) from GitHub. This page is informational and is not legal advice.
      </P>

      <section className="space-y-3">
        <H>1. Information we collect</H>
        <P>We aim to collect only what we need to operate the registry:</P>
        <Ul
          items={[
            "Skill index data from public GitHub (names, descriptions, paths, stars, licenses, content hashes).",
            "Install events when you use install tracking: skill identity and a one-way hash of IP (not the raw IP stored for ranking).",
            "Server and security logs (timestamps, request paths, coarse technical metadata) for abuse prevention and reliability.",
            "Admin session data if you are an authorized operator (HMAC-signed session, not a public account system).",
          ]}
        />
        <P>
          We do not require you to create an account to browse the catalog. We do not intentionally collect
          special-category data (health, religion, biometrics). Skills themselves are third-party content
          from public repositories.
        </P>
      </section>

      <section className="space-y-3">
        <H>2. How we use information</H>
        <Ul
          items={[
            "Operate and improve the catalog, search, and install experience.",
            "Rank skills and show install metrics (labeled live or estimated).",
            "Detect abuse, enforce rate limits, and secure admin surfaces.",
            "Run automated crawling of public GitHub skill files.",
            "Respond to reports and operational requests.",
          ]}
        />
        <P>
          Legal bases we rely on where GDPR may apply include legitimate interests (operating a public
          index, security, analytics that are strictly operational) and, where required, consent for
          non-essential cookies if we add them later.
        </P>
      </section>

      <section className="space-y-3">
        <H>3. Cookies and similar tech</H>
        <P>
          Essential cookies or storage may be used for security and admin sessions. We do not currently
          run third-party advertising cookies. If we add analytics cookies, we will update this policy and
          provide choices where required.
        </P>
      </section>

      <section className="space-y-3">
        <H>4. Sharing and processors</H>
        <P>We share data only as needed to run the service:</P>
        <Ul
          items={[
            "Hosting and edge: Vercel.",
            "Database: Supabase (PostgreSQL).",
            "Source content: public GitHub repositories (not private data we upload from you).",
          ]}
        />
        <P>We do not sell personal information.</P>
      </section>

      <section className="space-y-3">
        <H>5. Retention</H>
        <P>
          Install and log data are kept only as long as useful for rankings, security, and operations, then
          deleted or aggregated. Skill index records persist while the skill remains listed; removed skills
          may be dropped from the public catalog.
        </P>
      </section>

      <section className="space-y-3">
        <H>6. Your rights</H>
        <P>
          Depending on where you live (including GDPR/UK GDPR and CCPA/CPRA regions), you may have rights
          to access, correct, delete, restrict, or object to certain processing, and to lodge a complaint
          with a supervisory authority. To exercise rights related to data we control, contact us using the
          details below. We will respond within applicable timelines (e.g. roughly one month under GDPR
          where it applies).
        </P>
      </section>

      <section className="space-y-3">
        <H>7. International transfers</H>
        <P>
          Infrastructure may process data in the United States or other regions where our providers
          operate. Where required, we rely on appropriate safeguards offered by those providers.
        </P>
      </section>

      <section className="space-y-3">
        <H>8. Children</H>
        <P>
          SkillForge is directed at developers and professionals. It is not intended for children under 16.
          We do not knowingly collect personal data from children.
        </P>
      </section>

      <section className="space-y-3">
        <H>9. Changes</H>
        <P>
          We may update this policy as the product changes. The &quot;Last updated&quot; date at the top
          will change when we do. Continued use after updates means you should review the revised policy.
        </P>
      </section>

      <section className="space-y-3">
        <H>10. Contact</H>
        <P>
          Privacy questions: open an issue or discussion on{" "}
          <a className="text-neon underline" href="https://github.com/Rustys90/skillforge">
            github.com/Rustys90/skillforge
          </a>
          . For skill takedown or safety reports, use the in-product report controls where available or
          contact via the same repository.
        </P>
        <P className="text-cream/45">
          [Legal review recommended] Operator legal entity name, registered address, and a monitored
          privacy email should be filled in before relying on this policy for formal compliance.
        </P>
      </section>
    </LegalPage>
  );
}
