import Link from "next/link";

export function AuthShell({ title, subtitle, leftContent, children }) {
  return (
    <main className="flex min-h-screen flex-col text-foreground md:flex-row">
      <section
        className="relative hidden min-h-screen flex-col overflow-hidden md:flex md:w-5/12 lg:w-2/5"
        style={{ background: "linear-gradient(135deg,#002d7a 0%,#004ac6 50%,#2563eb 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px,rgba(255,255,255,0.4) 1px,transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-white">sports_cricket</span>
            <span className="font-display text-2xl font-bold tracking-tight text-white">CricketApp</span>
          </div>
          {leftContent ?? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="mb-3 font-display text-4xl font-bold leading-tight tracking-tight text-white">Live Cricket Scoring Platform</h2>
                <p className="text-base leading-relaxed text-blue-200">Team codes, match codes, scorer lock, public live links, and full scorecards.</p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: "lock", title: "Scorer Lock System", sub: "One scorer at a time, 60s auto-expire" },
                  { icon: "live_tv", title: "Public Live Scoreboard", sub: "Share MATCH-XXXXXX with anyone" },
                  { icon: "bar_chart", title: "Full Career Stats", sub: "Batting, bowling, strike rate and more" },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-center gap-3 text-white/90">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <span className="material-symbols-outlined text-lg text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{feature.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{feature.title}</p>
                      <p className="text-xs text-blue-200">{feature.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-blue-300">CricketApp - Free for local cricket teams worldwide.</p>
        </div>
      </section>

      <section className="flex min-h-screen w-full flex-col items-center justify-center overflow-y-auto bg-surface px-6 py-12 md:w-7/12 md:px-12 lg:w-3/5 lg:px-16">
        <div className="flex w-full max-w-md flex-col gap-7">
          <div className="flex items-center gap-2 md:hidden">
            <span className="material-symbols-outlined text-2xl text-primary">sports_cricket</span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">CricketApp</span>
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-foreground-muted">{subtitle}</p>
          </div>
          {children}
          <div className="flex justify-center gap-6 text-xs text-outline">
            <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground">Support</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
