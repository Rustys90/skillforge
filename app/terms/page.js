import { LegalPage, H, P, Ul } from "../../components/LegalPage.jsx";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  title: "Terms of Use — SkillForge",
  description:
    "SkillForge terms of use for the public agent skill registry: catalog and CLI use, third-party GitHub skills, disclaimers, and liability limits. Not legal advice.",
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="24 August 2026">
      <P>
        These Terms of Use (&quot;Terms&quot;) govern access to SkillForge at {SITE_URL}. By using the
        site or APIs, you agree to these Terms. If you do not agree, do not use SkillForge. This is not
        legal advice.
      </P>

      <section className="space-y-3">
        <H>1. What SkillForge is</H>
        <P>
          SkillForge indexes publicly available agent skill files (such as SKILL.md) from GitHub and
          related metadata. We provide discovery, safety scanning signals, and install convenience. We are
          not the author of third-party skills unless explicitly stated.
        </P>
      </section>

      <section className="space-y-3">
        <H>2. Your responsibilities</H>
        <Ul
          items={[
            "You are responsible for how you install and run third-party skills in your environment.",
            "You must comply with GitHub terms, applicable law, and the licenses of each skill/repo.",
            "You must not abuse the service (see Acceptable Use).",
            "You must not attempt to bypass security, rate limits, or admin controls.",
          ]}
        />
      </section>

      <section className="space-y-3">
        <H>3. Skills are third-party content</H>
        <P>
          Listings may include names, descriptions, links, and metrics derived from public sources. Safety
          scanning is best-effort and does not guarantee that a skill is safe, secure, or fit for purpose.
          Always review upstream source before production use.
        </P>
      </section>

      <section className="space-y-3">
        <H>4. Intellectual property</H>
        <P>
          SkillForge branding, site design, and our original software are owned by the SkillForge operators
          or licensors. Third-party skill content remains owned by its respective authors under their
          licenses. The SkillForge site code may be offered under MIT or as indicated in the repository.
        </P>
      </section>

      <section className="space-y-3">
        <H>5. Availability and changes</H>
        <P>
          We may modify, suspend, or discontinue features at any time. We may remove skills, change ranking,
          or restrict access for operational or safety reasons.
        </P>
      </section>

      <section className="space-y-3">
        <H>6. Disclaimers</H>
        <P>
          SKILLFORGE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY
          KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE INDEX IS COMPLETE, ACCURATE, OR ERROR-FREE.
        </P>
      </section>

      <section className="space-y-3">
        <H>7. Limitation of liability</H>
        <P>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, SKILLFORGE AND ITS OPERATORS WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS,
          OR BUSINESS ARISING FROM YOUR USE OF THE SERVICE OR ANY THIRD-PARTY SKILL.
        </P>
        <P className="text-cream/45">
          [Legal review recommended] Cap on direct damages and governing law/venue should be set for your
          jurisdiction.
        </P>
      </section>

      <section className="space-y-3">
        <H>8. Indemnity</H>
        <P>
          You agree to indemnify and hold harmless SkillForge operators from claims arising out of your
          misuse of the service or your installation/use of third-party skills, to the extent permitted by
          law.
        </P>
      </section>

      <section className="space-y-3">
        <H>9. Related policies</H>
        <P>
          Our <a className="text-neon underline" href="/privacy">Privacy Policy</a> and{" "}
          <a className="text-neon underline" href="/acceptable-use">Acceptable Use</a> policy form part of
          these Terms.
        </P>
      </section>

      <section className="space-y-3">
        <H>10. Contact</H>
        <P>
          Questions:{" "}
          <a className="text-neon underline" href="https://github.com/Rustys90/skillforge">
            github.com/Rustys90/skillforge
          </a>
          .
        </P>
      </section>
    </LegalPage>
  );
}
