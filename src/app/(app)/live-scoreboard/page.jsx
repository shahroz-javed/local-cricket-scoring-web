"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

export default function LiveScoreboardPage() {
  return (
    <AppShell
      title="Live Scoreboard"
      subtitle="MATCH-9KR3T1 · CricketApp Live"
      action={
        <Link
          href="/scorecard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-base">table_rows</span>
          Full Scorecard
        </Link>
      }
    >
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Live Score Section */}
        <section className="cricket-gradient rounded-2xl text-white p-5 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wider">Live · 1st Innings · 14.3 Overs</p>
              <p className="font-display text-5xl font-bold leading-none mt-1">142/4</p>
              <p className="text-sm text-white/80 mt-1">Lahore Panthers batting · RR 9.79</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-white/70">Green Stars FC</p>
              <p className="font-display text-2xl font-bold">Yet to bat</p>
            </div>
          </div>
        </section>

        {/* Player Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface rounded-2xl border border-outline-variant p-4">
            <p className="text-xs text-foreground-muted">Striker</p>
            <p className="font-semibold text-foreground mt-1">Ahmed Khan*</p>
            <p className="font-display text-2xl text-foreground font-bold mt-2">42 (28)</p>
          </div>
          <div className="bg-surface rounded-2xl border border-outline-variant p-4">
            <p className="text-xs text-foreground-muted">Non-Striker</p>
            <p className="font-semibold text-foreground mt-1">Bilal C.</p>
            <p className="font-display text-2xl text-foreground font-bold mt-2">19 (14)</p>
          </div>
          <div className="bg-surface rounded-2xl border border-outline-variant p-4">
            <p className="text-xs text-foreground-muted">Current Bowler</p>
            <p className="font-semibold text-foreground mt-1">Hamza Butt</p>
            <p className="font-display text-2xl text-foreground font-bold mt-2">2.3-0-21-1</p>
          </div>
          <div className="bg-surface rounded-2xl border border-outline-variant p-4">
            <p className="text-xs text-foreground-muted">Partnership</p>
            <p className="font-semibold text-foreground mt-1">Ahmed + Bilal</p>
            <p className="font-display text-2xl text-foreground font-bold mt-2">38 (22)</p>
          </div>
        </section>

        {/* Current Over Section */}
        <section className="bg-surface rounded-2xl border border-outline-variant p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-foreground">Current Over</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-secondary font-semibold">Live</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { ball: "1", color: "" },
              { ball: "4", color: "bg-primary text-white border-primary" },
              { ball: "W", color: "bg-tertiary text-white border-tertiary" },
              { ball: ".", color: "" },
              { ball: "2", color: "" },
              { ball: "?", color: "" },
            ].map((item, idx) => (
              <span
                key={idx}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${
                  item.color ? item.color : "border-outline-variant"
                }`}
              >
                {item.ball}
              </span>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
