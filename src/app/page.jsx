import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { fetchPageSeo, buildMetadata } from "@/lib/page-seo";
import { apiUrl } from "@/lib/api";

export async function generateMetadata() {
  const seo = await fetchPageSeo("home");
  return buildMetadata({
    seo,
    fallbackTitle: "CricketApp — Live Cricket Scoring",
    fallbackDescription: "Score and follow live cricket matches from your phone. Real-time scorecards, push notifications and DLS support.",
    path: "/",
  });
}

// Server-side fetch — runs at request time, never leaks to the client bundle
async function getLiveData() {
  try {
    const [matchRes, tournRes] = await Promise.allSettled([
      fetch(apiUrl("/api/matches/live"), { cache: "no-store" }),
      fetch(apiUrl("/api/tournaments/live"), { cache: "no-store" }),
    ]);

    const matchData  = matchRes.status  === "fulfilled" && matchRes.value.ok  ? await matchRes.value.json()  : null;
    const tournData  = tournRes.status  === "fulfilled" && tournRes.value.ok  ? await tournRes.value.json()  : null;

    const liveMatch       = matchData?.matches?.[0] ?? null;
    const activeTourneys  = tournData?.ongoing?.length  ?? 0;
    const openTourneys    = tournData?.upcoming?.length ?? 0;

    return { liveMatch, activeTourneys, openTourneys };
  } catch {
    return { liveMatch: null, activeTourneys: 0, openTourneys: 0 };
  }
}

// ── Live Match Card (real data) ───────────────────────────────────────────────

function LiveMatchCard({ match }) {
  if (!match) return <StaticMatchCard />;

  const { code, home, away, innings, overs_limit, status } = match;
  const isBreak   = status === "innings_break";
  const homeScore = innings?.batting_team === home?.name
    ? `${innings.total_runs}/${innings.total_wickets}`
    : null;
  const awayScore = innings?.batting_team === away?.name
    ? `${innings.total_runs}/${innings.total_wickets}`
    : null;

  const overs = innings
    ? `${innings.total_overs}.${innings.total_balls} ov`
    : null;

  const battingName = innings?.batting_team ?? null;
  const battingScore = innings
    ? `${innings.total_runs}/${innings.total_wickets}`
    : null;

  return (
    <div className="bg-white border border-outline-variant rounded-2xl shadow-2xl overflow-hidden">
      <div className="cricket-gradient px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-white text-xs font-bold uppercase tracking-wider">
            {isBreak ? "Innings Break" : "Live Now"}
          </span>
        </div>
        <span className="font-mono text-white/70 text-xs">{code}</span>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-foreground truncate max-w-32.5">{home?.name ?? "Home"}</p>
            {innings?.batting_team === home?.name ? (
              <>
                <p className="font-display text-3xl font-bold text-foreground">{battingScore}</p>
                <p className="text-sm text-foreground-muted">{overs}{overs_limit ? ` / ${overs_limit}` : ""}</p>
              </>
            ) : (
              <p className="font-display text-2xl font-bold text-foreground-muted">
                {innings?.batting_team === away?.name ? "Batting 2nd" : "Yet to bat"}
              </p>
            )}
          </div>
          <div className="text-center px-4">
            <p className="font-bold text-foreground-muted text-sm">VS</p>
            {overs_limit && <p className="text-[10px] text-foreground-muted">{overs_limit} overs</p>}
          </div>
          <div className="text-right">
            <p className="font-bold text-foreground truncate max-w-32.5">{away?.name ?? "Away"}</p>
            {innings?.batting_team === away?.name ? (
              <>
                <p className="font-display text-3xl font-bold text-foreground">{battingScore}</p>
                <p className="text-sm text-foreground-muted">{overs}{overs_limit ? ` / ${overs_limit}` : ""}</p>
              </>
            ) : (
              <p className="font-display text-2xl font-bold text-foreground-muted">
                {innings?.batting_team === home?.name ? "Batting 2nd" : "Yet to bat"}
              </p>
            )}
          </div>
        </div>

        {innings && (
          <div className="bg-green-50 rounded-xl px-4 py-2.5 text-sm text-center text-secondary font-semibold">
            {isBreak
              ? `Innings 1 complete — ${battingName} scored ${battingScore}`
              : `${battingName} batting · ${innings.total_overs}.${innings.total_balls} overs`}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-outline-variant bg-surface-low flex justify-between items-center text-xs text-foreground-muted">
        <span className="flex items-center gap-1">
          <Icon name="live_tv" className="text-sm text-secondary" /> Live scoring in progress
        </span>
        <Link href={`/matches/${code}`} className="text-primary font-semibold">
          View Scorecard →
        </Link>
      </div>
    </div>
  );
}

// Fallback card when no live match exists
function StaticMatchCard() {
  return (
    <div className="bg-white border border-outline-variant rounded-2xl shadow-2xl overflow-hidden">
      <div className="cricket-gradient px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white/60" />
          </span>
          <span className="text-white text-xs font-bold uppercase tracking-wider">Live Scorecard Preview</span>
        </div>
        <span className="font-mono text-white/70 text-xs">MATCH-XXXXXX</span>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-foreground">Team A</p>
            <p className="font-display text-3xl font-bold text-foreground">148/4</p>
            <p className="text-sm text-foreground-muted">15.3 / 20 overs</p>
          </div>
          <div className="text-center px-4">
            <p className="font-bold text-foreground-muted">VS</p>
            <p className="text-[10px] text-foreground-muted">20 overs</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-foreground">Team B</p>
            <p className="font-display text-2xl font-bold text-foreground-muted">Yet to bat</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl px-4 py-2.5 text-sm text-center text-secondary font-semibold">
          Team A batting · Need 149 to win
        </div>
        <div className="flex gap-1.5 mt-3">
          {["1","4","W","·","2","6"].map((b, i) => (
            <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              b === "4" ? "bg-primary text-white" :
              b === "W" ? "bg-tertiary text-white" :
              b === "6" ? "bg-blue-900 text-white" :
              "border border-outline-variant text-foreground-muted"
            }`}>{b}</span>
          ))}
        </div>
      </div>
      <div className="px-5 py-3 border-t border-outline-variant bg-surface-low flex justify-between items-center text-xs text-foreground-muted">
        <span className="flex items-center gap-1"><Icon name="lock" className="text-sm" /> Scorer lock active</span>
        <Link href="/live-matches" className="text-primary font-semibold">Browse Live Matches →</Link>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default async function Home() {
  const { liveMatch, activeTourneys, openTourneys } = await getLiveData();
  const hasLive        = !!liveMatch;
  const tourneyBadge   = activeTourneys > 0
    ? `${activeTourneys} Active Tournament${activeTourneys !== 1 ? "s" : ""}`
    : openTourneys > 0
      ? `${openTourneys} Tournament${openTourneys !== 1 ? "s" : ""} Open`
      : null;

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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
              </span>
              Live Matches
            </Link>
            <Link href="/tournaments" className="text-foreground-muted hover:text-primary transition-colors text-sm font-medium">Tournaments</Link>
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
            {/* Live badge — dynamic */}
            {hasLive ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-secondary rounded-full text-xs font-bold tracking-wider uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                </span>
                Live Now: {liveMatch.home?.name} vs {liveMatch.away?.name}
              </div>
            ) : tourneyBadge ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold tracking-wider uppercase">
                <Icon name="emoji_events" className="text-sm" />
                {tourneyBadge}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-primary rounded-full text-xs font-bold tracking-wider uppercase">
                <Icon name="sports_cricket" className="text-sm" />
                Ball-by-Ball Live Scoring
              </div>
            )}

            <h1 className="font-display text-5xl md:text-6xl text-foreground leading-tight font-bold">
              Live Cricket Scoring <span className="text-primary">Made Simple</span>
            </h1>
            <p className="text-lg text-foreground-muted max-w-lg leading-relaxed">
              The ultimate digital scorebook for local cricket — ball-by-ball scoring, live public scoreboards, full scorecards, DLS support, and complete tournament management with leagues and knockouts.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/register" className="px-8 py-4 cricket-gradient text-white rounded-xl font-bold text-lg shadow-xl hover:opacity-90 transition-all hover:scale-105">
                Start Scoring Free
              </Link>
              <Link href="/live-matches" className="px-8 py-4 border border-outline-variant bg-white text-foreground rounded-xl font-bold text-lg hover:bg-surface-low transition-colors flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
                </span>
                Watch Live
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Icon name="check_circle" className="text-lg text-secondary" />
              No login needed to view live scoreboard — share with anyone
            </div>
          </div>

          {/* Live Score Card — real or fallback */}
          <LiveMatchCard match={liveMatch} />
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-10 bg-surface-low border-y border-outline-variant">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: "sports_cricket", label: "Ball-by-Ball",    sub: "Real-time scoring" },
              { icon: "emoji_events",   label: "Tournaments",     sub: "League & Knockout" },
              { icon: "live_tv",        label: "Public Boards",   sub: "No login to view" },
              { icon: "bolt",           label: "DLS Support",     sub: "Rain rule calculations" },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1.5">
                <Icon name={s.icon} className="text-3xl text-primary" />
                <p className="font-bold text-foreground text-sm">{s.label}</p>
                <p className="text-xs text-foreground-muted">{s.sub}</p>
              </div>
            ))}
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
            {
              icon: "sports_cricket",
              title: "Ball-by-Ball Scoring",
              desc: "Record every run, wicket, wide, and no-ball with one tap. Intuitive interface designed for speed.",
            },
            {
              icon: "lock",
              title: "Scorer Lock System",
              desc: "One active scorer at a time. 60-second auto-expire, takeover capability. No more scoring conflicts.",
            },
            {
              icon: "groups",
              title: "Team Codes (TEAM-XXXX)",
              desc: "Global reusable teams with unique codes. Add registered or guest players to any squad.",
            },
            {
              icon: "live_tv",
              title: "Public Live Scoreboard",
              desc: "Anyone can watch live with a match code — no login needed. Share with fans, parents, spectators.",
            },
            {
              icon: "bar_chart",
              title: "Full Scorecards & Stats",
              desc: "Complete batting & bowling scorecards, fall of wickets, and player career stats.",
            },
            {
              icon: "emoji_events",
              title: "Tournament Management",
              desc: "League tables, knockout brackets, NRR calculations, auto-generated fixtures, prize pools, and team management.",
            },
            {
              icon: "bolt",
              title: "DLS Support",
              desc: "Built-in Duckworth-Lewis-Stern calculations for rain-affected matches. Set par scores in seconds.",
            },
            {
              icon: "notifications",
              title: "Push Notifications",
              desc: "Subscribers get real-time wicket and score alerts pushed to their browser — no app install needed.",
            },
            {
              icon: "tune",
              title: "Score Corrections",
              desc: "Captains can propose score corrections during a match. The scorer approves or rejects with full audit trail.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-outline-variant p-8 rounded-2xl hover:border-primary/40 transition-colors hover:shadow-md">
              <Icon name={f.icon} className="mb-4 block text-4xl text-primary" />
              <h3 className="text-xl font-bold font-display mb-2">{f.title}</h3>
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
              { step: "1", title: "Create Account",    desc: "Register in under 60 seconds. Your scorer profile is ready immediately." },
              { step: "2", title: "Build Your Team",   desc: "Create teams, get your TEAM-XXXX code, add players (registered or guest)." },
              { step: "3", title: "Create a Match",    desc: "Pick teams, do the toss, set overs. Get your MATCH-XXXXXX code to share." },
              { step: "4", title: "Score & Share",     desc: "Score ball-by-ball. Anyone can watch live with the match code — no login needed." },
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

      {/* Tournament CTA strip */}
      <section className="py-16 px-6 md:px-8 max-w-7xl mx-auto">
        <div className="cricket-gradient rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Icon name="emoji_events" className="text-2xl text-white" />
              <span className="text-white font-bold text-lg">Tournament Management is Live</span>
            </div>
            <p className="text-white/80 max-w-md text-sm leading-relaxed">
              Run full tournaments — league groups, knockout brackets, NRR rankings, entry fees, prize pools, and auto-generated fixtures. All in one place.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/tournaments" className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg">
              Browse Tournaments
            </Link>
            <Link href="/register" className="px-6 py-3 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-all">
              Organise One
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-8 bg-inverse-surface">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-display text-5xl font-bold text-inverse-on-surface">Ready to modernize local cricket?</h2>
          <p className="text-lg text-inverse-on-surface/70">Join cricket organizers already using CricketApp to run matches and tournaments professionally.</p>
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
            <Link href="/tournaments" className="text-foreground-muted hover:text-primary transition-colors text-xs">Tournaments</Link>
            <Link href="/live-matches" className="text-foreground-muted hover:text-primary transition-colors text-xs">Live Matches</Link>
            <Link href="/blog"    className="text-foreground-muted hover:text-primary transition-colors text-xs">Blog</Link>
            <Link href="/privacy" className="text-foreground-muted hover:text-primary transition-colors text-xs">Privacy</Link>
            <Link href="/terms"   className="text-foreground-muted hover:text-primary transition-colors text-xs">Terms</Link>
            <Link href="/support" className="text-foreground-muted hover:text-primary transition-colors text-xs">Support</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
