import { LegalPage, H, P, Ul } from "../../components/LegalPage.jsx";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  title: "Acceptable Use",
  description: "Rules for using SkillForge APIs, crawler-related surfaces, and the public catalog.",
  alternates: { canonical: `${SITE_URL}/acceptable-use` },
  robots: { index: true, follow: true },
};

export default function AcceptableUsePage() {
  return (
    <LegalPage title="Acceptable Use" updated="24 August 2026">
      <P>
        This Acceptable Use Policy explains what is not allowed when using SkillForge ({SITE_URL}),
        including the website and APIs. It works alongside our Terms of Use.
      </P>

      <section className="space-y-3">
        <H>1. Prohibited uses</H>
        <Ul
          items={[
            "Attempting to disrupt, overload, or bypass rate limits, authentication, or security controls.",
            "Scraping the service in a way that harms availability or violates these Terms.",
            "Using SkillForge to distribute malware, exploit kits, or instructions primarily aimed at causing harm.",
            "Submitting false reports, automated spam, or attempts to manipulate rankings dishonestly.",
            "Misrepresenting SkillForge as endorsing or guaranteeing any third-party skill.",
            "Violating applicable law or third-party rights (including copyright and GitHub terms).",
          ]}
        />
      </section>

      <section className="space-y-3">
        <H>2. Skill content and safety</H>
        <P>
          We may flag, queue for review, delist, or restrict skills that appear unsafe, abusive, or
          non-skill content. Scanning is automated and imperfect. Authors remain responsible for their
          repositories.
        </P>
      </section>

      <section className="space-y-3">
        <H>3. API and automation</H>
        <P>
          Public read APIs are provided for reasonable use. Excessive automated traffic, credential
          stuffing against admin endpoints, or attempts to extract non-public operational data are
          forbidden.
        </P>
      </section>

      <section className="space-y-3">
        <H>4. Enforcement</H>
        <P>
          We may investigate and respond with rate limits, blocks, delisting, or other technical measures.
          We may report unlawful activity to relevant authorities when appropriate.
        </P>
      </section>

      <section className="space-y-3">
        <H>5. Reporting</H>
        <P>
          Report abusive skills or platform abuse via{" "}
          <a className="text-neon underline" href="https://github.com/Rustys90/skillforge">
            the SkillForge GitHub repository
          </a>{" "}
          or in-product report flows where available.
        </P>
      </section>
    </LegalPage>
  );
}
