"use client";

import Link from "next/link";

export function PublicShell({ children, badge }) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">

      {/* ── Nav — identical to homepage ── */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-lg border-b border-outline-variant shadow-sm">
        <div className="flex items-center justify-between px-6 md:px-8 h-16 max-w-7xl mx-auto">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏏</span>
            <span className="font-display text-xl font-bold text-foreground">CricketApp</span>
          </Link>

          {/* Centre links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/live-matches" className="flex items-center gap-1.5 text-foreground-muted hover:text-primary transition-colors text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
              Live Matches
            </Link>
            <a href="/#features"    className="text-foreground-muted hover:text-primary transition-colors text-sm font-medium">Features</a>
            <a href="/#how-it-works" className="text-foreground-muted hover:text-primary transition-colors text-sm font-medium">How It Works</a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {badge}
            <Link href="/login"    className="text-foreground font-semibold text-sm px-4 py-2 rounded-xl hover:bg-surface-mid transition-colors">Sign In</Link>
            <Link href="/register" className="cricket-gradient text-white rounded-xl px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-all shadow-md">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Page content — pt-16 clears fixed nav, min-h pushes footer to bottom */}
      <main className="pt-16 min-h-[calc(100vh-64px)]">
        {children}
      </main>

      {/* ── Footer — identical to homepage ── */}
      <footer className="w-full py-10 border-t border-outline-variant bg-surface-low">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <span className="font-bold text-foreground font-display">CricketApp</span>
            <span className="text-xs text-foreground-muted ml-2">© 2026 CricketApp</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-foreground-muted hover:text-primary transition-colors text-xs">Privacy</a>
            <a href="#" className="text-foreground-muted hover:text-primary transition-colors text-xs">Terms</a>
            <a href="#" className="text-foreground-muted hover:text-primary transition-colors text-xs">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
