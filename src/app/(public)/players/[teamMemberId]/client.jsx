"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v, fallback = "—") {
  return v == null || v === 0 ? fallback : v;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
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
            <div className="shrink-0 w-16 text-center">
              <p className="text-[10px] text-gray-400">{fmtDate(m.date)}</p>
              <ResultBadge result={m.result} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">vs {m.opponent}</p>
              <p className="font-mono text-[10px] text-gray-400 mt-0.5">{m.match_code}</p>
            </div>
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

// ─── Career Wagon Wheel ───────────────────────────────────────────────────────

const WW_CAREER_COLORS = {
  six:    { stroke: "#4f46e5", label: "6",   width: 2.2, tip: 5 },
  four:   { stroke: "#16a34a", label: "4",   width: 1.8, tip: 4 },
  runs:   { stroke: "#0ea5e9", label: "1–3", width: 1.2, tip: 3 },
  dot:    { stroke: "#94a3b8", label: "Dot", width: 0.8, tip: 2.5 },
  wicket: { stroke: "#ef4444", label: "W",   width: 2,   tip: 4.5 },
};

function wwType(ball) {
  if (ball.is_wicket) return "wicket";
  const r = ball.runs ?? 0;
  if (r === 6) return "six";
  if (r === 4) return "four";
  if (r > 0)  return "runs";
  return "dot";
}

function CareerFieldBase({ cx, cy, rx, ry }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#15803d" stroke="#14532d" strokeWidth="2" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.52} ry={ry * 0.52} fill="#16a34a" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.52} ry={ry * 0.52} fill="none"
               stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="5 4" />
      <rect x={cx - 9} y={cy - 52} width={18} height={104} rx="3"
            fill="rgba(255,218,90,0.2)" stroke="rgba(255,218,90,0.45)" strokeWidth="1" />
      <line x1={cx - 13} y1={cy - 40} x2={cx + 13} y2={cy - 40}
            stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
      <line x1={cx - 13} y1={cy + 40} x2={cx + 13} y2={cy + 40}
            stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
      {[-3, 0, 3].map((dx) => (
        <line key={`ts${dx}`} x1={cx + dx} y1={cy - 40} x2={cx + dx} y2={cy - 52}
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      ))}
      {[-3, 0, 3].map((dx) => (
        <line key={`bs${dx}`} x1={cx + dx} y1={cy + 40} x2={cx + dx} y2={cy + 52}
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      ))}
      <text x={cx} y={12} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7.5" fontWeight="600">STRAIGHT</text>
      <text x={cx} y={ry * 2 - 5} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7.5" fontWeight="600">FINE / 3RD MAN</text>
      <text x={7}        y={cy + 4} textAnchor="start" fill="rgba(255,255,255,0.35)" fontSize="7.5" fontWeight="600">LEG</text>
      <text x={rx*2 - 7} y={cy + 4} textAnchor="end"   fill="rgba(255,255,255,0.35)" fontSize="7.5" fontWeight="600">OFF</text>
    </>
  );
}

function CareerBatterFigure({ cx, cy }) {
  const bx = cx, by = cy + 48;
  return (
    <g style={{ pointerEvents: "none" }}>
      <circle cx={bx} cy={by + 2} r="3" fill="white" />
      <line x1={bx} y1={by + 5} x2={bx} y2={by + 15} stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1={bx} y1={by + 8} x2={bx - 4} y2={by + 12} stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1={bx} y1={by + 8} x2={bx + 6} y2={by + 5} stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1={bx + 6} y1={by + 5} x2={bx + 11} y2={by - 1}
            stroke="rgba(255,218,90,0.9)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={bx} y1={by + 15} x2={bx - 3} y2={by + 22} stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1={bx} y1={by + 15} x2={bx + 3} y2={by + 22} stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <text x={bx} y={by + 29} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="6" fontWeight="600">BATTER</text>
    </g>
  );
}

function CareerWagonWheel({ balls }) {
  const [filter, setFilter] = useState("all");

  if (!balls?.length) return null;

  const filtered = filter === "all" ? balls : balls.filter((b) => wwType(b) === filter);

  const CX = 150, CY = 158, RX = 136, RY = 146;
  const BATTER_Y = CY + 48;

  function toSVG(x, y) {
    return [CX - RX + x * RX * 2, CY - RY + y * RY * 2];
  }

  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-indigo-500"
                style={{ fontVariationSettings: "'FILL' 1" }}>sports_cricket</span>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Career Wagon Wheel</span>
        </div>
        <span className="text-[10px] text-gray-400">{filtered.length} shot{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors ${
            filter === "all"
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-300 text-gray-500 hover:border-gray-500"
          }`}
        >
          All ({balls.length})
        </button>
        {Object.entries(WW_CAREER_COLORS).map(([key, { stroke, label }]) => {
          const count = balls.filter((b) => wwType(b) === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "all" : key)}
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors"
              style={{
                background: filter === key ? stroke : "transparent",
                borderColor: stroke,
                color: filter === key ? "white" : stroke,
              }}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3">
        <svg viewBox="0 0 300 330" className="w-full max-w-xs mx-auto">
          <CareerFieldBase cx={CX} cy={CY} rx={RX} ry={RY} />
          {filtered.map((ball, i) => {
            const [sx, sy] = toSVG(ball.x ?? 0.5, ball.y ?? 0.5);
            const type = wwType(ball);
            const { stroke, width } = WW_CAREER_COLORS[type];
            return (
              <line key={`l${i}`}
                x1={CX} y1={BATTER_Y}
                x2={sx} y2={sy}
                stroke={stroke} strokeWidth={width}
                strokeOpacity="0.55" strokeLinecap="round"
              />
            );
          })}
          {filtered.map((ball, i) => {
            const [sx, sy] = toSVG(ball.x ?? 0.5, ball.y ?? 0.5);
            const type = wwType(ball);
            const { stroke, tip } = WW_CAREER_COLORS[type];
            return (
              <circle key={`d${i}`} cx={sx} cy={sy} r={tip}
                fill={stroke} fillOpacity="0.9" />
            );
          })}
          <CareerBatterFigure cx={CX} cy={CY} />
        </svg>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-3 justify-center">
        {Object.entries(WW_CAREER_COLORS).map(([key, { stroke, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 rounded-full" style={{ background: stroke }} />
            <span className="text-[10px] text-gray-500 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Client Component ─────────────────────────────────────────────────────────

export default function PlayerProfileClient({ data }) {
  return (
    <PublicShell>
      <div className="max-w-2xl mx-auto space-y-3 px-0 sm:px-4 pb-10">

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

        <BattingCard b={data.batting} />
        <BowlingCard b={data.bowling} />
        <CareerWagonWheel balls={data.wagon_wheel} />
        <MatchHistory matches={data.matches} />

      </div>
    </PublicShell>
  );
}
