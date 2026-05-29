import { AppShell } from "@/components/layout/app-shell";

export default function TournamentsPage() {
  return (
    <AppShell title="Tournaments" subtitle="Organize & compete in league tournaments">
      <div className="max-w-4xl">
        {/* Coming Soon Hero */}
        <div className="relative bg-surface rounded-3xl border border-outline-variant overflow-hidden mb-6 shadow-lg">
          {/* Gold gradient top bar */}
          <div className="h-1.5 gold-gradient"></div>

          <div className="p-8 text-center">
            {/* Trophy icon */}
            <div className="float-anim inline-block mb-4">
              <div className="w-24 h-24 rounded-3xl gold-gradient flex items-center justify-center shadow-xl mx-auto">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              COMING SOON — PHASE T1
            </div>

            <h2 className="font-display text-3xl font-bold text-foreground mb-3">Tournament Mode</h2>
            <p className="text-foreground-muted max-w-md mx-auto mb-6">Full tournament management — league tables, knockout brackets, NRR calculations, auto-fixtures, and live standings. Built on the same match engine you already love.</p>

            {/* Waitlist form */}
            <div className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="Your email for early access"
                className="flex-1 px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:bg-surface transition-all outline-none text-foreground"
              />
              <button className="px-4 py-3 cricket-gradient text-white text-sm font-semibold rounded-xl hover:scale-105 transition-all">
                Notify Me
              </button>
            </div>
          </div>
        </div>

        {/* Blurred Preview Cards */}
        <p className="text-sm font-semibold text-foreground-muted uppercase tracking-wide mb-3">Preview — What's Coming</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Tournament Type Cards */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-full border border-amber-200">Coming Soon</span>
            </div>
            <div className="w-12 h-12 rounded-xl cricket-gradient flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>table_rows</span>
            </div>
            <h3 className="font-display font-bold text-foreground mb-1">League Format</h3>
            <p className="text-sm text-foreground-muted">Round-robin group stages with full points table, NRR, and automatic qualification.</p>
            <div className="coming-soon-blur mt-3 p-3 bg-surface-container-low rounded-xl">
              <div className="h-3 bg-outline-variant rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-outline-variant rounded w-1/2"></div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-outline-variant p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-full border border-amber-200">Coming Soon</span>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg,#ab0b1c,#ef4444)" }}>
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
            </div>
            <h3 className="font-display font-bold text-foreground mb-1">Knockout Bracket</h3>
            <p className="text-sm text-foreground-muted">Single or double elimination brackets with auto-generated match fixtures.</p>
            <div className="coming-soon-blur mt-3 p-3 bg-surface-container-low rounded-xl">
              <div className="h-3 bg-outline-variant rounded mb-2 w-2/3"></div>
              <div className="h-3 bg-outline-variant rounded w-3/4"></div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-outline-variant p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-full border border-amber-200">Coming Soon</span>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}>
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>leaderboard</span>
            </div>
            <h3 className="font-display font-bold text-foreground mb-1">Points Table</h3>
            <p className="text-sm text-foreground-muted">Live standings with NRR, wins, losses, and real-time updates after every match.</p>
            <div className="coming-soon-blur mt-3">
              {/* Fake points table rows */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg">
                  <div className="w-4 h-4 bg-outline-variant rounded"></div>
                  <div className="flex-1 h-2.5 bg-outline-variant rounded"></div>
                  <div className="w-6 h-2.5 bg-outline-variant rounded"></div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg">
                  <div className="w-4 h-4 bg-outline-variant rounded"></div>
                  <div className="flex-1 h-2.5 bg-outline-variant rounded"></div>
                  <div className="w-6 h-2.5 bg-outline-variant rounded"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-outline-variant p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-full border border-amber-200">Coming Soon</span>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            </div>
            <h3 className="font-display font-bold text-foreground mb-1">Tournament Stats</h3>
            <p className="text-sm text-foreground-muted">Top run-scorers, wicket-takers, and best performances across the entire tournament.</p>
            <div className="coming-soon-blur mt-3 space-y-2">
              <div className="h-3 bg-outline-variant rounded w-full"></div>
              <div className="h-3 bg-outline-variant rounded w-5/6"></div>
              <div className="h-3 bg-outline-variant rounded w-3/4"></div>
            </div>
          </div>
        </div>

        {/* Roadmap timeline */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-6">
          <h3 className="font-display font-bold text-foreground mb-4">📋 Tournament Roadmap</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <div className="flex-1 w-0.5 bg-secondary mt-1"></div>
              </div>
              <div className="flex-1 pb-4">
                <p className="font-semibold text-foreground text-sm">Phase 1–5 Complete</p>
                <p className="text-xs text-foreground-muted">Auth, teams, matches, live scoring, stats — all shipped ✅</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full cricket-gradient flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
                </div>
                <div className="flex-1 w-0.5 bg-outline-variant mt-1"></div>
              </div>
              <div className="flex-1 pb-4">
                <p className="font-semibold text-foreground text-sm">Phase 6–8: Web App</p>
                <p className="text-xs text-foreground-muted">Next.js frontend, live scoreboard, mobile UI — in progress</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-sm">schedule</span>
                </div>
                <div className="flex-1 w-0.5 bg-outline-variant mt-1"></div>
              </div>
              <div className="flex-1 pb-4">
                <p className="font-semibold text-foreground text-sm">Phase T1: Tournament Core</p>
                <p className="text-xs text-foreground-muted">Create tournaments, auto-fixtures, team management — up next</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-container border-2 border-outline-variant flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-outline text-sm">lock</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground-muted text-sm">Phase T2–T5: Full Tournament Platform</p>
                <p className="text-xs text-foreground-muted">Points table, NRR, sponsors, monetization — the full vision</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

