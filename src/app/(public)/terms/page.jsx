import { PublicShell } from "@/components/layout/public-shell";
import { fetchPageSeo, buildMetadata } from "@/lib/page-seo";

export async function generateMetadata() {
  const seo = await fetchPageSeo("terms");
  return buildMetadata({
    seo,
    fallbackTitle: "Terms of Service — CricketApp",
    fallbackDescription: "The terms and conditions that govern your use of CricketApp.",
    path: "/terms",
  });
}

const LAST_UPDATED = "8 June 2026";
const CONTACT_EMAIL = "umarbutt8704@gmail.com";
const APP_NAME = "CricketApp";

export default function TermsPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Legal</p>
          <h1 className="font-display text-4xl font-bold text-foreground">Terms of Service</h1>
          <p className="mt-3 text-sm text-foreground-muted">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 text-foreground">

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using {APP_NAME} (&ldquo;the Service&rdquo;) you agree to be bound by these Terms
              of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the Service.
            </p>
            <p>
              We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date above reflects the
              most recent revision. Continued use after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              {APP_NAME} provides a free digital cricket scoring platform. Features include team
              management with unique TEAM codes, live ball-by-ball match scoring with a scorer lock
              system, shareable public scorecards using MATCH codes, player career statistics, the
              DLS calculator, and push notifications.
            </p>
          </Section>

          <Section title="3. Accounts">
            <ul className="list-disc pl-5 space-y-1.5 text-foreground-muted text-[15px]">
              <li>You must provide accurate information when registering.</li>
              <li>You are responsible for maintaining the confidentiality of your password.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must be at least 13 years old to create an account.</li>
              <li>
                You must notify us immediately at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>{" "}
                if you suspect unauthorised use of your account.
              </li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground-muted text-[15px]">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Upload content that is defamatory, abusive, obscene, or infringes third-party rights.</li>
              <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure.</li>
              <li>Reverse-engineer, scrape, or copy the Service without permission.</li>
              <li>Use automated tools (bots, scrapers) against the Service without our written consent.</li>
              <li>Impersonate another person or entity.</li>
            </ul>
          </Section>

          <Section title="5. User Content">
            <p>
              You retain ownership of content you submit (player names, scores, commentary, blog posts
              if applicable). By submitting content, you grant {APP_NAME} a worldwide, royalty-free
              licence to store, display, and distribute that content solely to operate the Service.
            </p>
            <p>
              Public match scorecards are visible to anyone with the match code. You are responsible
              for ensuring player names and other data you enter comply with applicable privacy laws.
            </p>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              All software, design, trademarks, and content produced by {APP_NAME} (excluding user
              content) are the property of {APP_NAME} and are protected by intellectual property laws.
              You may not copy, modify, or redistribute them without written permission.
            </p>
          </Section>

          <Section title="7. Disclaimers">
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
              either express or implied. We do not warrant that the Service will be uninterrupted,
              error-free, or that scoring results (including DLS calculations) are authoritative or
              accepted by any cricket governing body.
            </p>
            <p>
              DLS calculations are provided for convenience only. Always verify results against
              official ICC DLS resources for competitive play.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the fullest extent permitted by law, {APP_NAME} shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of, or
              inability to use, the Service — including loss of data, scoring errors, or match
              disputes. Our total liability to you for any claim shall not exceed the amount you have
              paid us in the 12 months preceding the claim (which for free users is zero).
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms, at our
              sole discretion, with or without notice. You may close your account at any time by
              contacting us. Termination does not affect any rights or obligations that arose before
              termination.
            </p>
          </Section>

          <Section title="10. Governing Law">
            <p>
              These Terms are governed by the laws of Pakistan. Any disputes shall be subject to the
              exclusive jurisdiction of the courts located in Pakistan.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions about these Terms can be sent to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

        </div>
      </div>
    </PublicShell>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-foreground mb-3 pb-2 border-b border-outline-variant">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-foreground-muted">{children}</div>
    </section>
  );
}
