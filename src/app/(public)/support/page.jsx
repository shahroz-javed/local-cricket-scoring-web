import { PublicShell } from "@/components/layout/public-shell";
import { fetchPageSeo, buildMetadata } from "@/lib/page-seo";

export async function generateMetadata() {
  const seo = await fetchPageSeo("support");
  return buildMetadata({
    seo,
    fallbackTitle: "Help & Support — CricketApp",
    fallbackDescription: "Get help with CricketApp. Browse FAQs on scoring, teams, DLS, and more, or contact support.",
    path: "/support",
  });
}

const CONTACT_EMAIL = "umarbutt8704@gmail.com";

const FAQS = [
  {
    q: "How do I create a team?",
    a: "Sign in, go to Teams in the dashboard, and click \"Create Team\". Your team gets a unique TEAM-XXXX code that you can share with players.",
  },
  {
    q: "How do I start a match?",
    a: "From the dashboard, click \"New Match\", select two teams, set overs, and do the toss. You'll receive a MATCH-XXXXXX code. Share it with anyone who wants to watch live.",
  },
  {
    q: "Can spectators watch without logging in?",
    a: "Yes. Anyone with the MATCH-XXXXXX code can open the live scorecard in a browser — no account needed.",
  },
  {
    q: "What is the Scorer Lock?",
    a: "Only one person can score at a time. When you start scoring, you hold the lock for 60 seconds. It auto-expires if inactive, and other scorers can take over if needed.",
  },
  {
    q: "How does DLS work in CricketApp?",
    a: "Set the match as a DLS match when creating it. If the second innings is interrupted, go to Match Settings and apply the DLS target — the app calculates the revised target using the standard resource table.",
  },
  {
    q: "How do I enable push notifications?",
    a: "Open a live match scorecard and tap \"Subscribe to notifications\". Your browser will ask for permission. You'll receive alerts for wickets, milestones, and match results.",
  },
  {
    q: "Can I correct a scoring mistake?",
    a: "Yes. During an active match, use the Score Correction panel in the scorer interface to adjust runs, wickets, or extras for any delivery.",
  },
  {
    q: "How do I add guest players?",
    a: "When setting up a match or editing a team, you can add guest players by name — they don't need a CricketApp account.",
  },
  {
    q: "I forgot my password. How do I reset it?",
    a: "On the Sign In page, click \"Forgot password?\" and enter your email. A reset link will be sent to your inbox.",
  },
  {
    q: "How do I delete my account?",
    a: `Email us at ${CONTACT_EMAIL} with the subject "Delete Account" from the email address on your account. We'll process the deletion within 7 days.`,
  },
];

export default function SupportPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Help Centre</p>
          <h1 className="font-display text-4xl font-bold text-foreground">How can we help?</h1>
          <p className="mt-3 text-foreground-muted max-w-xl mx-auto">
            Browse the common questions below or reach out directly — we usually reply within one business day.
          </p>
        </div>

        {/* Contact card */}
        <div className="mb-12 rounded-2xl border border-outline-variant bg-surface-low p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground text-lg">Contact Support</p>
            <p className="text-sm text-foreground-muted mt-0.5">
              For bugs, account issues, or anything not covered below.
            </p>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="cricket-gradient text-white rounded-xl px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-all shadow-md whitespace-nowrap"
          >
            Email Us
          </a>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-outline-variant bg-white overflow-hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-semibold text-foreground text-[15px] select-none list-none">
                  {faq.q}
                  <span className="ml-4 shrink-0 text-foreground-muted group-open:rotate-180 transition-transform duration-200 material-symbols-outlined text-xl">
                    expand_more
                  </span>
                </summary>
                <div className="px-5 pb-5 text-[15px] leading-relaxed text-foreground-muted border-t border-outline-variant pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom contact nudge */}
        <div className="mt-14 rounded-2xl bg-inverse-surface p-8 text-center">
          <p className="font-display text-xl font-bold text-inverse-on-surface mb-2">Still need help?</p>
          <p className="text-sm text-inverse-on-surface/70 mb-4">
            Send us an email and we&rsquo;ll get back to you as soon as possible.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-block bg-white text-foreground font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-all"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

      </div>
    </PublicShell>
  );
}
