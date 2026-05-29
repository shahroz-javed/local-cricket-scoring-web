"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { PublicShell } from "@/components/layout/public-shell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v, fallback = "—") {
  return v == null || v === 0 ? fallback : v;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-24">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-10" />
        <span className="absolute h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/40" />
        <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
      </div>
      <p className="text-sm text-foreground-muted">Loading profile…</p>
    </div>
  );
}

// ─── Stat Grid ────────────────────────────────────────────────────────────────

function StatGrid({ stats }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 divide-x divide-y divide-gray-100">
      {stats.map(({ label, value, highlight }) => (
        <div key={label} className="px-3 py-3 text-center">
          <p className={`text-lg font-black tabular-nums ${highlight ? "text-blue-600" : "text-gray-900"}`}>
            {value}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Batting Card ─────────────────────────────────────────────────────────────

function BattingCard({ b }) {
  if (!b) return null;
  const stats = [
    { label: "Innings",  value: fmt(b.matches, "0") },
    { label: "Runs",     value: fmt(b.runs, "0"),     highlight: true },
    { label: "HS",       value: fmt(b.high_score, "0") },
    { label: "Avg",      value: fmt(b.average, "0") },
    { label: "SR",       value: fmt(b.strike_rate, "0") },
    { label: "50s",      value: fmt(b.fifties, "0") },
    { label: "100s",     value: fmt(b.hundreds, "0") },
    { label: "4s",       value: fmt(b.fours, "0") },
    { label: "6s",       value: fmt(b.sixes, "0") },
    { label: "NO",       value: fmt(b.not_outs, "0") },
  ];
  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>sports_cricket</span>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Batting</span>
      </div>
      <StatGrid stats={stats} />
    </div>
  );
}

// ─── Bowling Card ─────────────────────────────────────────────────────────────

function BowlingCard({ b }) {
  if (!b || (b.wickets === 0 && b.overs === 0)) return null;
  const stats = [
    { label: "Wickets",  value: fmt(b.wickets, "0"),      highlight: true },
    { label: "Overs",    value: fmt(b.overs, "0") },
    { label: "Runs",     value: fmt(b.runs_conceded, "0") },
    { label: "Avg",      value: fmt(b.average, "0") },
    { label: "Economy",  value: fmt(b.economy, "0") },
    { label: "Maidens",  value: fmt(b.maidens, "0") },
    { label: "Best",     value: b.best ?? "—" },
  ];
  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-purple-600" style={{ fontVariationSettings: "'FILL' 1" }}>sports_baseball</span>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Bowling</span>
      </div>
      <StatGrid stats={stats} />
    </div>
  );
}

// ─── Result Badge ─────────────────────────────────────────────────────────────

function ResultBadge({ result }) {
  const map = {
    won:       "bg-emerald-100 text-emerald-700",
    lost:      "bg-red-100 text-red-700",
    tie:       "bg-amber-100 text-amber-700",
    abandoned: "bg-gray-100 text-gray-500",
  };
  const cls = map[result] ?? "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {result ?? "—"}
    </span>
  );
}

// ─── Match History Table ───────────────────────────────────────────────────────

function MatchHistory({ matches }) {
  if (!matches?.length) return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Match History</span>
      </div>
      <p className="px-4 py-8 text-center text-sm text-gray-400">No completed matches yet.</p>
    </div>
  );

  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Match History</span>
        <span className="text-[10px] text-gray-400">{matches.length} matches</span>
      </div>
      <div className="divide-y divide-gray-100">
        {matches.map((m) => (
          <Link
            key={m.match_code}
            href={`/matches/${m.match_code}`}
            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            {/* Date + result */}
            <div className="shrink-0 w-16 text-center">
              <p className="text-[10px] text-gray-400">{fmtDate(m.date)}</p>
              <ResultBadge result={m.result} />
            </div>

            {/* Opponent */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">vs {m.opponent}</p>
              <p className="font-mono text-[10px] text-gray-400 mt-0.5">{m.match_code}</p>
            </div>

            {/* Batting */}
            <div className="shrink-0 text-right">
              {m.batting ? (
                <>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">
                    {m.batting.runs}
                    <span className="text-xs font-normal text-gray-400"> ({m.batting.balls}b)</span>
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {m.batting.fours > 0 && <span className="text-green-600 mr-1">{m.batting.fours}×4</span>}
                    {m.batting.sixes > 0 && <span className="text-indigo-600">{m.batting.sixes}×6</span>}
                    {!m.batting.fours && !m.batting.sixes ? m.batting.how_out?.replace("_", " ") : ""}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-300">DNB</p>
              )}
            </div>

            {/* Bowling */}
            {m.bowling && (
              <div className="shrink-0 text-right ml-2">
                <p className="text-sm font-bold text-purple-700 tabular-nums">{m.bowling.wickets}W</p>
                <p className="text-[10px] text-gray-400">{m.bowling.overs} ov · {m.bowling.runs}R</p>
              </div>
            )}

            <span className="material-symbols-outlined text-gray-200 text-base self-center shrink-0">chevron_right</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayerProfilePage() {
  const { teamMemberId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest(`/api/players/${teamMemberId}/stats`)
      .then(setData)
      .catch((e) => setError(e?.data?.message ?? "Player not found."))
      .finally(() => setLoading(false));
  }, [teamMemberId]);

  if (loading) return (
    <PublicShell>
      <Spinner />
    </PublicShell>
  );

  if (error || !data) return (
    <PublicShell>
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-10 text-center m-4">
        <p className="text-sm font-semibold text-red-700">{error || "Player not found."}</p>
      </div>
    </PublicShell>
  );

  return (
    <PublicShell>
      <div className="max-w-2xl mx-auto space-y-3 px-0 sm:px-4 pb-10">

        {/* Hero */}
        <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
          <div className="cricket-gradient px-5 py-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-white">{data.player ?? "Player"}</h1>
                <p className="text-sm text-white/70 mt-0.5">
                  {data.batting.matches} {data.batting.matches === 1 ? "match" : "matches"} played
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Batting stats */}
        <BattingCard b={data.batting} />

        {/* Bowling stats — only if they've bowled */}
        <BowlingCard b={data.bowling} />

        {/* Match-by-match history */}
        <MatchHistory matches={data.matches} />

      </div>
    </PublicShell>
  );
}
