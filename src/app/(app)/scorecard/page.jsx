"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Icon } from "@/components/ui/icon";

export default function ScorecardPage() {
  const [activeTab, setActiveTab] = useState("batting");

  const tabs = [
    { id: "batting", label: "Batting" },
    { id: "bowling", label: "Bowling" },
    { id: "fow", label: "Fall of Wickets" },
    { id: "summary", label: "Summary" },
    { id: "charts", label: "Charts" },
  ];

  return (
    <AppShell
      title="Scorecard"
      subtitle="Panthers vs Green Stars · T20 · Iqbal Park, Lahore · 27 Apr 2026"
      action={
        <div className="flex items-center gap-2">
          <Link
            href="/live-scoreboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-container transition-colors"
          >
            <Icon name="arrow_back" className="text-base" />
            Live
          </Link>
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-fixed transition-colors">
            <Icon name="share" className="text-base" />
            Share
          </button>
        </div>
      }
    >
      {/* Match Result Banner */}
      <div className="cricket-gradient rounded-2xl px-4 py-5 text-white mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center flex-1">
            <div className="text-3xl">🐆</div>
            <p className="text-white font-bold text-sm mt-1">Lahore Panthers</p>
            <p className="text-white font-display text-2xl font-bold mt-1">186/7</p>
            <p className="text-white/60 text-xs">20 overs</p>
          </div>
          <div className="text-center px-4">
            <div className="font-display font-bold text-white text-xl">VS</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-3xl">⭐</div>
            <p className="text-white font-bold text-sm mt-1">Green Stars FC</p>
            <p className="text-white font-display text-2xl font-bold mt-1">172/9</p>
            <p className="text-white/60 text-xs">20 overs</p>
          </div>
        </div>
        <div className="text-center bg-white/15 rounded-xl py-2 px-4">
          <span className="text-white font-display font-bold">🏆 Lahore Panthers won by 14 runs</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl space-y-4">
        {/* BATTING TAB */}
        {activeTab === "batting" && (
          <div className="space-y-4">
            {/* Innings 1 */}
            <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐆</span>
                  <h3 className="font-display font-bold text-foreground">Lahore Panthers — 1st Innings</h3>
                </div>
                <span className="text-foreground-muted text-sm font-mono">186/7 (20)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                      <th style={{ minWidth: "120px" }} className="px-3 py-2 text-left text-xs font-bold text-outline uppercase">Batsman</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-outline uppercase"></th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">R</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">B</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">4s</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">6s</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { batsman: "Ahmed Khan", mode: "c Hamza b Tariq", r: 88, b: 52, fours: 9, sixes: 4, sr: "169.2" },
                      { batsman: "Salman Asif", mode: "b Hamza", r: 41, b: 35, fours: 3, sixes: 2, sr: "117.1" },
                      { batsman: "Mohammad Raza", mode: "run out (Umar)", r: 22, b: 18, fours: 2, sixes: 1, sr: "122.2" },
                      { batsman: "Bilal Chaudhry", mode: "not out", r: 18, b: 9, fours: 1, sixes: 1, sr: "200.0" },
                    ].map((row) => (
                      <tr key={row.batsman} className="border-t border-outline-variant hover:bg-surface-low">
                        <td className="px-3 py-2 font-semibold text-foreground text-sm">{row.batsman}</td>
                        <td className="px-3 py-2 text-foreground-muted text-xs">{row.mode}</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground text-sm">{row.r}</td>
                        <td className="px-3 py-2 text-right text-foreground-muted text-sm">{row.b}</td>
                        <td className="px-3 py-2 text-right text-primary font-semibold text-sm">{row.fours}</td>
                        <td className="px-3 py-2 text-right text-secondary font-semibold text-sm">{row.sixes}</td>
                        <td className="px-3 py-2 text-right font-semibold text-secondary text-sm">{row.sr}</td>
                      </tr>
                    ))}
                    <tr className="bg-surface-container-low border-t border-outline-variant">
                      <td className="px-3 py-2 font-semibold text-foreground-muted text-sm" colSpan={2}>Extras</td>
                      <td className="px-3 py-2 text-right font-bold text-foreground text-sm">17</td>
                      <td colSpan={4} className="px-3 py-2 text-foreground-muted text-xs">W: 8, NB: 4, B: 3, LB: 2</td>
                    </tr>
                    <tr className="bg-surface-container border-t border-outline-variant">
                      <td className="px-3 py-2 font-bold text-foreground text-sm" colSpan={2}>TOTAL</td>
                      <td className="px-3 py-2 text-right font-display font-bold text-foreground text-base">186</td>
                      <td colSpan={3} className="px-3 py-2 text-foreground-muted text-xs">7 wickets · 20 overs</td>
                      <td className="px-3 py-2 text-right font-bold text-secondary text-sm">9.30</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Innings 2 */}
            <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⭐</span>
                  <h3 className="font-display font-bold text-foreground">Green Stars FC — 2nd Innings</h3>
                </div>
                <span className="text-foreground-muted text-sm font-mono">172/9 (20) · T: 187</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                      <th style={{ minWidth: "120px" }} className="px-3 py-2 text-left text-xs font-bold text-outline uppercase">Batsman</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-outline uppercase"></th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">R</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">B</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">4s</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">6s</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { batsman: "Umar Akmal", mode: "c Ahmed b Salman", r: 65, b: 44, fours: 6, sixes: 3, sr: "147.7" },
                      { batsman: "Hamza Butt", mode: "not out", r: 48, b: 38, fours: 4, sixes: 2, sr: "126.3" },
                    ].map((row) => (
                      <tr key={row.batsman} className="border-t border-outline-variant hover:bg-surface-low">
                        <td className="px-3 py-2 font-semibold text-foreground text-sm">{row.batsman}</td>
                        <td className="px-3 py-2 text-foreground-muted text-xs">{row.mode}</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground text-sm">{row.r}</td>
                        <td className="px-3 py-2 text-right text-foreground-muted text-sm">{row.b}</td>
                        <td className="px-3 py-2 text-right text-primary font-semibold text-sm">{row.fours}</td>
                        <td className="px-3 py-2 text-right text-secondary font-semibold text-sm">{row.sixes}</td>
                        <td className="px-3 py-2 text-right font-semibold text-secondary text-sm">{row.sr}</td>
                      </tr>
                    ))}
                    <tr className="bg-surface-container border-t border-outline-variant">
                      <td className="px-3 py-2 font-bold text-foreground text-sm" colSpan={2}>TOTAL</td>
                      <td className="px-3 py-2 text-right font-display font-bold text-foreground text-base">172</td>
                      <td colSpan={3} className="px-3 py-2 text-foreground-muted text-xs">9 wickets · 20 overs</td>
                      <td className="px-3 py-2 text-right font-bold text-tertiary text-sm">8.60</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BOWLING TAB */}
        {activeTab === "bowling" && (
          <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant">
              <h3 className="font-display font-bold text-foreground">Green Stars FC — Bowling vs Panthers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    <th style={{ minWidth: "120px" }} className="px-3 py-2 text-left text-xs font-bold text-outline uppercase">Bowler</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">O</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">M</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">R</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">W</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">WD</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">NB</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-outline uppercase">Eco</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { bowler: "Tariq Mahmood", o: 4, m: 0, r: 42, w: 3, wd: 2, nb: 0, eco: "10.50" },
                    { bowler: "Hamza Butt", o: 4, m: 0, r: 36, w: 2, wd: 3, nb: 1, eco: "9.00" },
                    { bowler: "Rizwan Shah", o: 4, m: 0, r: 32, w: 1, wd: 1, nb: 2, eco: "8.00" },
                  ].map((row) => (
                    <tr key={row.bowler} className="border-t border-outline-variant hover:bg-surface-low">
                      <td className="px-3 py-2 font-semibold text-foreground text-sm">{row.bowler}</td>
                      <td className="px-3 py-2 text-right text-foreground-muted text-sm">{row.o}</td>
                      <td className="px-3 py-2 text-right text-foreground-muted text-sm">{row.m}</td>
                      <td className="px-3 py-2 text-right font-bold text-foreground text-sm">{row.r}</td>
                      <td className="px-3 py-2 text-right font-bold text-tertiary text-sm">{row.w}</td>
                      <td className="px-3 py-2 text-right text-foreground-muted text-sm">{row.wd}</td>
                      <td className="px-3 py-2 text-right text-foreground-muted text-sm">{row.nb}</td>
                      <td className="px-3 py-2 text-right font-semibold text-tertiary text-sm">{row.eco}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FALL OF WICKETS TAB */}
        {activeTab === "fow" && (
          <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant">
              <h3 className="font-display font-bold text-foreground">🐆 Lahore Panthers — Fall of Wickets</h3>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { wicket: "1st Wicket", score: "42/1", over: "Over 5.2", player: "M. Raza 18" },
                { wicket: "2nd Wicket", score: "89/2", over: "Over 10.1", player: "B. Ali 22" },
                { wicket: "3rd Wicket", score: "124/3", over: "Over 14.3", player: "U. Ali 32" },
                { wicket: "4th Wicket", score: "148/4", over: "Over 16.1", player: "S. Asif 41" },
              ].map((item) => (
                <div key={item.wicket} className="bg-surface-container-low rounded-xl p-3 border border-outline-variant">
                  <p className="text-xs text-foreground-muted">{item.wicket}</p>
                  <p className="font-display font-bold text-foreground text-xl">{item.score}</p>
                  <p className="text-xs text-foreground-muted mt-1">{item.over} · {item.player}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUMMARY TAB */}
        {activeTab === "summary" && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 text-center">
            <p className="text-foreground-muted">Summary view coming soon...</p>
          </div>
        )}

        {/* CHARTS TAB */}
        {activeTab === "charts" && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 text-center">
            <p className="text-foreground-muted">Charts view coming soon...</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
