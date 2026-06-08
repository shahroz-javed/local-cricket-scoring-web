import { PublicShell } from "@/components/layout/public-shell";
import { fetchPageSeo, buildMetadata } from "@/lib/page-seo";

export async function generateMetadata() {
  const seo = await fetchPageSeo("privacy");
  return buildMetadata({
    seo,
    fallbackTitle: "Privacy Policy — CricketApp",
    fallbackDescription: "How CricketApp collects, uses, and protects your personal information.",
    path: "/privacy",
  });
}

const LAST_UPDATED = "8 June 2026";
const CONTACT_EMAIL = "umarbutt8704@gmail.com";
const APP_NAME = "CricketApp";

export default function PrivacyPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Legal</p>
          <h1 className="font-display text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="mt-3 text-sm text-foreground-muted">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose-section space-y-10 text-foreground">

          <Section title="1. Who We Are">
            <p>
              {APP_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a free cricket scoring platform that lets
              organisers create teams, run matches, and share live scorecards. Our service is operated by the
              {APP_NAME} team and is accessible at this website.
            </p>
            <p>
              Questions about this policy can be sent to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <SubSection title="Account data">
              When you register, we collect your name, email address, and a hashed password. You may
              optionally provide a profile photo.
            </SubSection>
            <SubSection title="Match & scoring data">
              Deliveries, scores, player statistics, and match metadata you enter are stored and
              associated with your account.
            </SubSection>
            <SubSection title="Usage data">
              We automatically collect IP address, browser type, pages visited, and timestamps for
              security and performance monitoring. We do not use third-party analytics cookies.
            </SubSection>
            <SubSection title="Push notification tokens">
              If you opt into push notifications, your browser&rsquo;s push subscription endpoint is
              stored. You can revoke this at any time in your browser settings.
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1.5 text-foreground-muted text-[15px]">
              <li>Provide, maintain, and improve the {APP_NAME} service.</li>
              <li>Authenticate your account and keep it secure.</li>
              <li>Send match-related push notifications you have opted into.</li>
              <li>Respond to support requests you send us.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell your personal data to third parties. We do <strong>not</strong> use
              your data for advertising profiling.
            </p>
          </Section>

          <Section title="4. Data Sharing">
            <p>
              We share data only in these limited circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground-muted text-[15px]">
              <li>
                <strong>Public scorecards</strong> — match scores and player names are publicly visible to
                anyone with the match code. Do not enter personal information in player names or
                commentary if you want it kept private.
              </li>
              <li>
                <strong>Service providers</strong> — hosting, database, and infrastructure providers who
                process data on our behalf under confidentiality obligations.
              </li>
              <li>
                <strong>Legal requirements</strong> — if required by law, court order, or to protect
                the rights and safety of users or the public.
              </li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <p>
              Account data is retained for as long as your account is active. You may request deletion
              of your account and associated data by emailing us. Match data you have made public may
              remain visible in aggregated or anonymised form.
            </p>
          </Section>

          <Section title="6. Security">
            <p>
              Passwords are hashed using bcrypt and never stored in plain text. All data is transmitted
              over HTTPS. We apply industry-standard security measures but cannot guarantee absolute
              security of data transmitted over the internet.
            </p>
          </Section>

          <Section title="7. Children's Privacy">
            <p>
              {APP_NAME} is not directed at children under 13. We do not knowingly collect personal
              information from children. If you believe a child has provided us personal data, contact
              us and we will delete it promptly.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>
              Depending on your jurisdiction you may have rights to access, correct, or delete your
              personal data, restrict or object to processing, and data portability. To exercise any
              of these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              We use a single session cookie for authentication. We do not use advertising or
              cross-site tracking cookies. You can disable cookies in your browser, but this will
              prevent you from signing in.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top will
              reflect the most recent revision. Continued use of {APP_NAME} after changes constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For any privacy-related questions or requests, contact us at{" "}
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

function SubSection({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
      <p>{children}</p>
    </div>
  );
}
