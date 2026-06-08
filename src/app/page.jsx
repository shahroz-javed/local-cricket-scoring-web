import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { fetchPageSeo, buildMetadata } from "@/lib/page-seo";

export async function generateMetadata() {
  const seo = await fetchPageSeo("home");
  return buildMetadata({
    seo,
    fallbackTitle: "CricketApp — Live Cricket Scoring",
    fallbackDescription: "Score and follow live cricket matches from your phone. Real-time scorecards, push notifications and DLS support.",
    path: "/",
  });
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-lg border-b border-outline-variant shadow-sm">
        <div className="flex items-center justify-between px-6 md:px-8 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏏</span>
            <span className="font-display text-xl font-bold text-foreground">CricketApp</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/live-matches" className="flex items-center gap-1.5 text-foreground-muted hover:text-primary transition-colors text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
              Live Matches
            </Link>
            <a href="#features" className="text-foreground-muted hover:text-primary transition-colors text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-foreground-muted hover:text-primary transition-colors text-sm font-medium">How It Works</a>
            <Link href="/blog" className="text-foreground-muted hover:text-primary transition-colors text-sm font-medium">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-foreground font-semibold text-sm px-4 py-2 rounded-xl hover:bg-surface-mid transition-colors">Sign In</Link>
            <Link href="/register" className="cricket-gradient text-white rounded-xl px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-all shadow-md">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-secondary rounded-full text-xs font-bold tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              Live Now: Sunday League Final
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-foreground leading-tight font-bold">
              Live Cricket Scoring <span className="text-primary">Made Simple</span>
            </h1>
            <p className="text-lg text-foreground-muted max-w-lg leading-relaxed">
              The ultimate digital scorebook for local cricket matches. Create teams with{" "}
              <span className="font-mono bg-surface-mid text-primary text-sm font-bold px-2 py-0.5 rounded-lg">TEAM-XXXX</span>{" "}
              codes, start matches with{" "}
              <span className="font-mono bg-surface-mid text-primary text-sm font-bold px-2 py-0.5 rounded-lg">MATCH-XXXXXX</span>{" "}
              codes, and score ball-by-ball with the scorer lock system.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/register" className="px-8 py-4 cricket-gradient text-white rounded-xl font-bold text-lg shadow-xl hover:opacity-90 transition-all hover:scale-105">
                Start Scoring Free
              </Link>
              <Link href="/login" className="px-8 py-4 border border-outline-variant bg-white text-foreground rounded-xl font-bold text-lg hover:bg-surface-low transition-colors">
                Sign In
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Icon name="check_circle" className="text-lg text-secondary" />
              No login needed to view live scoreboard — share with anyone
            </div>
          </div>

          {/* Live Score Card Preview */}
          <div className="bg-white border border-outline-variant rounded-2xl shadow-2xl overflow-hidden">
            <div className="cricket-gradient px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-white text-xs font-bold uppercase tracking-wider">Live Now</span>
              </div>
              <span className="font-mono text-white/70 text-xs">MATCH-9KR3T1</span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-foreground">Lahore Panthers 🐆</p>
                  <p className="font-display text-3xl font-bold text-foreground">148/4</p>
                  <p className="text-sm text-foreground-muted">15.3 overs</p>
                </div>
                <div className="text-center px-4">
                  <p className="font-bold text-foreground-muted">VS</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">Green Stars ⭐</p>
                  <p className="font-display text-3xl font-bold text-foreground-muted">Yet to bat</p>
                </div>
              </div>
              <div className="flex gap-1.5 mb-3">
                {[
                  { label: "1", cls: "border border-outline-variant text-foreground" },
                  { label: "4", cls: "bg-primary text-white" },
                  { label: "W", cls: "bg-tertiary text-white" },
                  { label: "·", cls: "border border-outline-variant text-foreground-muted" },
                  { label: "2", cls: "border border-outline-variant text-foreground" },
                  { label: "6", cls: "bg-blue-900 text-white" },
                ].map((b, i) => (
                  <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${b.cls}`}>{b.label}</span>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <div><span className="font-bold text-primary">K. Rahul*</span> <span className="text-foreground-muted font-mono">42(28)</span></div>
                <div><span className="text-foreground-muted">M. Shami</span> <span className="font-mono text-foreground-muted">1.3-0-12-2</span></div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-outline-variant bg-surface-low flex justify-between items-center text-xs text-foreground-muted">
              <span className="flex items-center gap-1"><Icon name="lock" className="text-sm" />Ahmed scoring</span>
              <Link href="/live-scoreboard" className="text-primary font-semibold">View Full Scorecard →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 md:px-8 max-w-7xl mx-auto" id="features">
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-display text-4xl font-bold text-foreground">Everything you need to run a match</h2>
          <p className="text-foreground-muted max-w-2xl mx-auto text-lg">Professional tools designed for local leagues, schools, and backyard legends.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "sports_cricket", title: "Ball-by-Ball Scoring", desc: "Record every run, wicket, wide, and no-ball with one tap. Intuitive interface designed for speed." },
            { icon: "lock", title: "Scorer Lock System", desc: "One active scorer at a time. 60-second auto-expire, takeover capability. No more scoring conflicts." },
            { icon: "groups", title: "Team Codes (TEAM-XXXX)", desc: "Global reusable teams with unique codes. Add registered or guest players to any squad." },
            { icon: "live_tv", title: "Public Live Scoreboard", desc: "Anyone can watch live with a match code — no login needed. Share with fans, parents, spectators." },
            { icon: "bar_chart", title: "Full Scorecards & Stats", desc: "Complete batting & bowling scorecards, fall of wickets, wagon wheels, and player career stats." },
            { icon: "emoji_events", title: "Tournaments", desc: "League tables, knockout brackets, NRR calculations, and auto-generated fixtures. Coming in Phase T1.", badge: "Coming Soon" },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-outline-variant p-8 rounded-2xl hover:border-primary/40 transition-colors hover:shadow-md">
              <Icon name={f.icon} className="mb-4 block text-4xl text-primary" />
              <h3 className="text-xl font-bold font-display mb-2">
                {f.title}
                {f.badge && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-2">{f.badge}</span>}
              </h3>
              <p className="text-sm text-foreground-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-surface-low" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground">How It Works</h2>
          </div>
          <div className="grid lg:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Create Account", desc: "Register in under 60 seconds. Your scorer profile is ready to go." },
              { step: "2", title: "Build Your Team", desc: "Create teams, get your TEAM-XXXX code, add players (registered or guests)." },
              { step: "3", title: "Create Match", desc: "Pick teams, do the toss, set overs. Get your MATCH-XXXXXX code." },
              { step: "4", title: "Score & Share", desc: "Score ball-by-ball. Anyone can watch live with the match code — no login needed." },
            ].map((s) => (
              <div key={s.step} className="space-y-4 text-center">
                <div className="w-14 h-14 cricket-gradient text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto font-display">{s.step}</div>
                <h3 className="text-xl font-bold font-display">{s.title}</h3>
                <p className="text-foreground-muted text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* CTA Section */}
      <section className="py-24 px-6 md:px-8 bg-inverse-surface">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-display text-5xl font-bold text-inverse-on-surface">Ready to modernize local cricket?</h2>
          <p className="text-lg text-inverse-on-surface/70">Join cricket organizers already using CricketApp to run matches professionally.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="px-10 py-5 cricket-gradient text-white rounded-xl font-bold text-xl shadow-2xl hover:opacity-90 hover:scale-105 active:scale-95 transition-all">
              Create Free Account
            </Link>
            <Link href="/login" className="px-10 py-5 bg-white/10 text-inverse-on-surface border border-white/20 rounded-xl font-bold text-xl hover:bg-white/20 transition-all">
              Sign In
            </Link>
          </div>
          <p className="text-sm text-inverse-on-surface/50">Free to use. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 border-t border-outline-variant bg-surface-low">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <span className="font-bold text-foreground font-display">CricketApp</span>
            <span className="text-xs text-foreground-muted ml-2">© 2026 CricketApp</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-foreground-muted hover:text-primary transition-colors text-xs">Privacy</Link>
            <Link href="/terms"   className="text-foreground-muted hover:text-primary transition-colors text-xs">Terms</Link>
            <Link href="/support" className="text-foreground-muted hover:text-primary transition-colors text-xs">Support</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
