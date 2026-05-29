"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import { PublicShell } from "@/components/layout/public-shell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return n ?? 0; }
function oversStr(overs, balls) { return `${fmt(overs)}.${fmt(balls)}`; }
function rr(runs, overs, balls) {
  const o = (overs ?? 0) + (balls ?? 0) / 6;
  return o > 0 ? (runs / o).toFixed(2) : "0.00";
}

function dismissalText(row) {
  if (!row.how_out || row.how_out === "not_out") return "not out";
  const t = row.how_out.replace(/_/g, " ");
  if (row.how_out === "bowled")      return `b ${row.bowler ?? ""}`;
  if (row.how_out === "lbw")        return `lbw b ${row.bowler ?? ""}`;
  if (row.how_out === "caught")     return `c ${row.fielder ?? ""} b ${row.bowler ?? ""}`;
  if (row.how_out === "stumped")    return `st ${row.fielder ?? ""} b ${row.bowler ?? ""}`;
  if (row.how_out === "run_out")    return `run out (${row.fielder ?? ""})`;
  if (row.how_out === "hit_wicket") return `hit wicket b ${row.bowler ?? ""}`;
  return t;
}

function ballStyle(d) {
  if (!d) return "bg-gray-100 text-gray-400";
  if (d.is_wicket)         return "bg-red-500 text-white shadow-sm shadow-red-200 ring-1 ring-red-600";
  if (d.runs_bat === 6)    return "bg-indigo-600 text-white shadow-sm shadow-indigo-200 ring-1 ring-indigo-700";
  if (d.runs_bat === 4)    return "bg-green-600 text-white shadow-sm shadow-green-200 ring-1 ring-green-700";
  if (d.extras === "wide") return "bg-amber-100 text-amber-700 ring-1 ring-amber-300";
  if (d.extras === "no_ball") return "bg-orange-100 text-orange-700 ring-1 ring-orange-300";
  return "bg-white text-gray-700 ring-1 ring-gray-200";
}

function ballLabel(d) {
  if (!d) return "";
  const ex = d.extras ?? d.extras_type;
  const er = d.extras_runs ?? 0;
  const rb = d.runs_bat ?? 0;
  if (d.is_wicket) return rb > 0 ? `${rb}W` : "W";
  if (ex === "wide")    return er > 0 ? `${er}Wd` : "Wd";
  if (ex === "no_ball") return rb > 0 ? `${rb}Nb` : er > 0 ? `${er}Nb` : "Nb";
  if (ex === "bye")     return er > 0 ? `${er}B`  : "B";
  if (ex === "leg_bye") return er > 0 ? `${er}Lb` : "Lb";
  if (rb === 0) return "0";
  return String(rb);
}

// ─── Match page wrapper ───────────────────────────────────────────────────────

function MatchShell({ children, status }) {
  const badge = status === "live" ? (
    <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 tracking-wider uppercase border border-red-200/50">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      LIVE
    </span>
  ) : null;
  return (
    <PublicShell badge={badge}>
      <div className="mx-auto max-w-3xl px-0 sm:px-4 py-0 sm:py-6 pb-20 sm:pb-16 bg-gray-50/50 min-h-screen">
        {children}
      </div>
    </PublicShell>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-28">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-600 opacity-20" />
        <span className="absolute h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600/40" />
        <span className="material-symbols-outlined text-xl text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>
          sports_cricket
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">Loading live match</p>
        <p className="mt-1 text-xs text-gray-400">Fetching scoreboard, commentary, and match state…</p>
      </div>
    </div>
  );
}

function EmptyStateCard({ icon, title, body }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center shadow-sm">
      <span className="material-symbols-outlined mb-3 block text-5xl text-gray-200" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-gray-400">{body}</p>
    </div>
  );
}

function MatchPageSkeleton() {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-indigo-50 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl bg-slate-900/95 p-4 text-white shadow-lg">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/15" />
            <div className="mt-4 flex items-end gap-3">
              <div className="h-14 w-28 animate-pulse rounded-2xl bg-white/10" />
              <div className="h-9 w-20 animate-pulse rounded-full bg-white/10" />
            </div>
            <div className="mt-4 h-4 w-40 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm">
                <div className="h-2.5 w-20 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-2 h-5 w-16 animate-pulse rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="h-3 w-28 animate-pulse rounded-full bg-gray-200" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="h-3 w-24 animate-pulse rounded-full bg-gray-200" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 p-4">
              <div className="h-4 w-32 animate-pulse rounded-full bg-gray-100" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((__, j) => (
                  <div key={j} className="h-8 animate-pulse rounded-full bg-gray-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveStatusBanner({ match, innings, result, liveState }) {
  const isLive = match.status === "live";
  const isBreak = match.status === "innings_break";
  const isDone = match.status === "completed";
  const currentInnings = liveState?.innings ?? null;
  const liveOver = liveState?.current_over?.over_number ?? null;
  const battingTeam = currentInnings?.batting_team?.name ?? currentInnings?.batting_team ?? null;
  const target = innings?.find((i) => i.innings_number === 1)?.total_runs
    ? Number(innings.find((i) => i.innings_number === 1)?.total_runs) + 1
    : null;
  const breakLabel = isBreak ? "Innings Break" : isLive ? "Live Play" : isDone ? "Final Result" : "Match Not Started";

  return (
    <section className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className={`px-4 py-3 ${isLive ? "bg-red-50" : isBreak ? "bg-amber-50" : isDone ? "bg-blue-50" : "bg-gray-50"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isLive ? "bg-red-100 text-red-700" : isBreak ? "bg-amber-100 text-amber-700" : isDone ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-red-500 animate-pulse" : isBreak ? "bg-amber-500" : isDone ? "bg-blue-500" : "bg-gray-400"}`} />
            {breakLabel}
          </span>
          <p className="text-sm font-semibold text-gray-800">
            {isLive && battingTeam
              ? `${battingTeam} batting now`
              : isBreak && target
                ? `Target ${target} for the chase`
                : isDone && result?.summary
                  ? result.summary
                  : "The first ball has not been bowled yet."}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          {isLive && currentInnings && (
            <>
              <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-gray-700 border border-gray-200">
                Innings {currentInnings.innings_number}
              </span>
              {liveOver !== null && (
                <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-gray-700 border border-gray-200">
                  Current over {liveOver}
                </span>
              )}
            </>
          )}
          {isBreak && target && (
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-gray-700 border border-gray-200">
              Chase target {target}
            </span>
          )}
          {isDone && result?.summary && (
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-gray-700 border border-gray-200">
              Match complete
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function MatchSnapshotStrip({ match, innings, liveState, result }) {
  const inn1 = innings?.find((i) => i.innings_number === 1);
  const inn2 = innings?.find((i) => i.innings_number === 2);
  const currentInn = liveState?.innings ?? null;
  const isLive = match.status === "live";
  const isBreak = match.status === "innings_break";
  const isDone = match.status === "completed";
  const battingTeam = currentInn?.batting_team?.name ?? currentInn?.batting_team ?? null;
  const crr = currentInn ? rr(currentInn.total_runs, currentInn.total_overs, currentInn.total_balls) : null;
  const target = inn1 ? Number(inn1.total_runs ?? inn1.total ?? 0) + 1 : null;
  const runsNeeded = isBreak || (inn2 && target !== null)
    ? Math.max(0, target - Number(inn2?.total_runs ?? inn2?.total ?? 0))
    : null;
  const ballsLeft = currentInn && currentInn.innings_number === 2
    ? Math.max(0, (match.overs_limit ?? 20) * 6 - (currentInn.total_overs ?? 0) * 6 - (currentInn.total_balls ?? 0))
    : null;
  const rrr = runsNeeded !== null && ballsLeft !== null && ballsLeft > 0
    ? ((runsNeeded / ballsLeft) * 6).toFixed(2)
    : null;

  const chips = [];

  if (isLive && battingTeam) chips.push({ label: "Batting", value: battingTeam });
  if (currentInn) chips.push({ label: "Innings", value: String(currentInn.innings_number) });
  if (currentInn) chips.push({ label: "Overs", value: `${currentInn.total_overs ?? 0}.${currentInn.total_balls ?? 0}` });
  if (crr) chips.push({ label: "CRR", value: crr });
  if (rrr) chips.push({ label: "RRR", value: rrr });
  if (currentInn?.next_delivery_is_free) chips.push({ label: "Free ball", value: "Next delivery" });
  if (isBreak && target) chips.push({ label: "Target", value: String(target) });
  if (isDone && result?.summary) chips.push({ label: "Result", value: "Final" });

  return (
    <section className="mb-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-700">
          Match Snapshot
        </p>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          isLive ? "bg-red-100 text-red-700" : isBreak ? "bg-amber-100 text-amber-700" : isDone ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-red-500 animate-pulse" : isBreak ? "bg-amber-500" : isDone ? "bg-blue-500" : "bg-gray-400"}`} />
          {isLive ? "Live" : isBreak ? "Break" : isDone ? "Complete" : "Upcoming"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <div key={`${chip.label}-${chip.value}`} className="rounded-xl border border-white/70 bg-white/85 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{chip.label}</p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">{chip.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Firecrackers / confetti ──────────────────────────────────────────────────

function Firecrackers({ completedAt }) {
  const canvasRef = useRef(null);
  const [now, setNow] = useState(() => Date.now());

  const shouldShow = completedAt
    ? now - new Date(completedAt).getTime() < 24 * 60 * 60 * 1000
    : false;

  useEffect(() => {
    if (!completedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, [completedAt]);

  useEffect(() => {
    if (!shouldShow) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#f59e0b","#ef4444","#3b82f6","#10b981","#8b5cf6","#f97316","#ec4899","#facc15"];

    function makeParticle() {
      return {
        x:    Math.random() * window.innerWidth,
        y:    Math.random() * window.innerHeight * 0.4 - 20,
        vx:   (Math.random() - 0.5) * 5,
        vy:   Math.random() * -7 - 2,
        r:    Math.random() * 5 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
        shape: Math.random() > 0.5 ? "circle" : "rect",
        rot:   Math.random() * Math.PI * 2,
        rotV:  (Math.random() - 0.5) * 0.2,
      };
    }

    // Start with 120 particles; dead ones are recycled so animation never stops
    const particles = Array.from({ length: 120 }, makeParticle);

    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x    += p.vx;
        p.y    += p.vy;
        p.vy   += 0.12;
        p.alpha -= 0.007;
        p.rot  += p.rotV;
        // Recycle faded particles so the burst keeps going indefinitely
        if (p.alpha <= 0) {
          particles[i] = makeParticle();
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        }
        ctx.restore();
      }
      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [shouldShow]);

  if (!shouldShow) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ mixBlendMode: "normal" }}
    />
  );
}

// ─── Google Sports Style Hero ──────────────────────────────────────────────────

function MatchHero({ match, innings, result, liveState, motm }) {
  const home   = match.teams?.find((t) => t.role === "home");
  const away   = match.teams?.find((t) => t.role === "away");
  const inn1   = innings?.find((i) => i.innings_number === 1);
  const inn2   = innings?.find((i) => i.innings_number === 2);
  const isLive = match.status === "live" || match.status === "innings_break";

  const liveInn = liveState?.innings ?? null;

  // Which innings belongs to home/away?
  // inn1.batting_team is a name string from scorecard — match against team names
  const homeInn = inn1?.batting_team === home?.name ? inn1
                : inn2?.batting_team === home?.name ? inn2
                : null;
  const awayInn = inn1?.batting_team === away?.name ? inn1
                : inn2?.batting_team === away?.name ? inn2
                : null;

  // The innings that is currently live (for CRR/RRR)
  const liveInningsNum = liveInn?.innings_number;
  const isHomeLive = homeInn && homeInn.innings_number === liveInningsNum;
  const isAwayLive = awayInn && awayInn.innings_number === liveInningsNum;

  // Target + RRR for chasing team (always inn2)
  const target     = inn1 ? parseInt(inn1.total) + 1 : null;
  const inn2Runs   = inn2 ? parseInt(inn2.total) : 0;
  const runsNeeded = target ? Math.max(0, target - inn2Runs) : null;
  const ballsLeft  = liveInn && liveInn.innings_number === 2
    ? Math.max(0, (match.overs_limit ?? 20) * 6 - (liveInn.total_overs ?? 0) * 6 - (liveInn.total_balls ?? 0))
    : null;
  const rrr = runsNeeded !== null && ballsLeft !== null && ballsLeft > 0
    ? ((runsNeeded / ballsLeft) * 6).toFixed(2)
    : null;

  function teamScoreMarkup({ inn, isLive: teamLive, align = "left" }) {
    const crr = teamLive && liveInn
      ? rr(liveInn.total_runs, liveInn.total_overs, liveInn.total_balls)
      : null;
    const isChasing = inn && inn.innings_number === 2;

    if (!inn) {
      return (
        <div className={align === "right" ? "text-right" : ""}>
          <span className="inline-block mt-2 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Yet to bat
          </span>
        </div>
      );
    }

    return (
      <div className={align === "right" ? "text-right" : ""}>
        <div className={`flex items-end gap-1 ${align === "right" ? "justify-end" : ""}`}>
          <span className="text-5xl sm:text-6xl font-black tracking-tight leading-none">{inn.total}</span>
          <span className="text-xl sm:text-2xl font-bold text-white/70 pb-1">/{inn.wickets ?? 0}</span>
        </div>
        <div className={`mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide ${align === "right" ? "justify-end" : ""}`}>
          <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-white/85">
            {inn.overs} ov
          </span>
          {crr && (
            <span className="rounded-full border border-blue-300/20 bg-blue-400/15 px-2.5 py-1 text-blue-100">
              CRR {crr}
            </span>
          )}
          {isChasing && rrr && teamLive && (
            <span className="rounded-full border border-orange-300/20 bg-orange-400/15 px-2.5 py-1 text-orange-100">
              RRR {rrr}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl shadow-slate-900/20 mb-4 sm:mb-6">
      {/* Header meta */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 pt-4 pb-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 truncate pr-3">
          {match.title ?? "Exhibition Match"}
          {match.venue ? ` • ${match.venue}` : ""}
          {" • "}{match.overs_limit} overs
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* Main Score Area */}
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">

          {/* Home team */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/10">
                {home?.name?.charAt(0) ?? "H"}
              </div>
              <p className="text-sm font-bold text-white/85 truncate">{home?.name ?? "Home"}</p>
              {isHomeLive && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            {teamScoreMarkup({ inn: homeInn, isLive: isHomeLive, align: "left" })}
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                Live Board
              </div>
              <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            </div>
          </div>

          {/* Away team */}
          <div className="min-w-0 flex flex-col items-end">
            <div className="flex items-center gap-2 mb-3 flex-row-reverse">
              <div className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/10">
                {away?.name?.charAt(0) ?? "A"}
              </div>
              <p className="text-sm font-bold text-white/85 truncate">{away?.name ?? "Away"}</p>
              {isAwayLive && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            {teamScoreMarkup({ inn: awayInn, isLive: isAwayLive, align: "right" })}
          </div>
        </div>
      </div>

      {/* Current over ball row */}
      {isLive && liveState?.current_over && (
        <div className="space-y-2">
          {liveState?.innings?.next_delivery_is_free && (
            <div className="mx-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 sm:mx-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-700">Free Delivery</p>
              <p className="text-xs font-semibold text-amber-800">Next ball is free. Only run out can dismiss a batter.</p>
            </div>
          )}
          <CurrentOverBallRow currentOver={liveState.current_over} theme="light" />
        </div>
      )}

      {/* Match Status Footer */}
      <div className="border-t border-white/10 bg-white/5 px-5 py-3">
        {result ? (
          <p className="text-sm font-bold text-white">🏆 {result.summary}</p>
        ) : match.status === "innings_break" ? (
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-amber-300">Innings Break</p>
            {target && <p className="text-sm font-semibold text-white/75">Target: <span className="font-bold text-white">{target}</span></p>}
          </div>
        ) : isLive && liveInn ? (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-100">
              {liveInn.batting_team?.name ?? liveInn.batting_team ?? ""} batting
            </p>
            {inn2 && runsNeeded !== null && ballsLeft !== null ? (
              <p className="text-xs font-semibold text-white/70">
                Need <span className="font-bold text-white">{runsNeeded}</span> off <span className="font-bold text-white">{ballsLeft}</span> balls
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm font-medium text-white/65">Match hasn&apos;t started yet</p>
        )}

        {/* Toss Info */}
        {match.toss_winner && match.toss_decision && (
          <p className="text-xs text-white/45 mt-1">
            🪙 {match.toss_winner} won the toss and elected to {match.toss_decision}
          </p>
        )}
      </div>

      {/* Man of the Match strip */}
      {motm && (
        <div className="px-5 py-3 bg-amber-400/10 border-t border-amber-300/10 flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-amber-500 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Man of the Match</p>
            <p className="font-bold text-sm text-white truncate">{motm.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-xs text-white/60 truncate">{motm.team}</p>
              {(motm.batting || motm.bowling) && (
                <p className="text-xs font-semibold text-amber-200 tabular-nums">
                  {[motm.batting, motm.bowling].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Current Over Ball Row ────────────────────────────────────────────────────

function CurrentOverBallRow({ currentOver, theme = "light" }) {
  const balls = (currentOver?.deliveries ?? [])
    .filter((d) => !d.is_undone)
    .sort((a, b) => a.raw_ball_number - b.raw_ball_number);

  if (!currentOver) return null;

  // 6 legal-ball slots + any extras beyond that
  const legalCount = balls.filter((b) => b.is_legal_ball).length;
  const totalSlots = Math.max(6, balls.length);
  const emptySlots = Math.max(0, totalSlots - balls.length);

  function chipColor(d) {
    if (!d)                        return theme === "dark" ? "bg-white/10 text-white/30" : "bg-gray-100 text-gray-300";
    if (d.is_wicket)               return "bg-red-500 text-white";
    if (d.runs_bat === 6)          return "bg-purple-600 text-white";
    if (d.runs_bat === 4)          return "bg-green-600 text-white";
    const ex = d.extras_type ?? d.extras;
    if (ex === "wide")             return "bg-amber-400 text-white";
    if (ex === "no_ball")          return "bg-orange-500 text-white";
    if (d.runs_bat === 0)          return theme === "dark" ? "bg-white/15 text-white/70" : "bg-gray-100 text-gray-500";
    return theme === "dark" ? "bg-white/25 text-white" : "bg-gray-200 text-gray-700";
  }

  function chipLabel(d) {
    if (!d) return "";
    const ex = d.extras_type ?? d.extras;
    const er = d.extras_runs ?? 0;
    const rb = d.runs_bat ?? 0;
    if (d.is_wicket) return rb > 0 ? `${rb}W` : "W";
    if (ex === "wide")    return er > 1 ? `${er}Wd` : "Wd";
    if (ex === "no_ball") return rb > 0 ? `${rb}Nb` : "Nb";
    if (ex === "bye")     return er > 0 ? `${er}B` : "B";
    if (ex === "leg_bye") return er > 0 ? `${er}Lb` : "Lb";
    return rb === 0 ? "·" : String(rb);
  }

  // Legal ball sequence number for this ball (extras get †)
  let legalSeq = 0;
  const ballsWithSeq = balls.map((b) => {
    if (b.is_legal_ball) legalSeq++;
    return { ...b, seq: b.is_legal_ball ? legalSeq : null };
  });

  const isDark = theme === "dark";
  const borderClass = isDark ? "border-white/10" : "border-gray-100";
  const labelClass  = isDark ? "text-white/50" : "text-gray-400";

  return (
    <div className={`border-t ${borderClass} px-4 py-2.5`}>
      <div className="flex items-center gap-2">
        {ballsWithSeq.map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 shrink-0">
            <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${chipColor(b)}`}>
              {chipLabel(b)}
            </span>
            <span className={`text-[9px] font-medium ${labelClass} leading-none`}>
              {b.seq !== null ? b.seq : "†"}
            </span>
          </div>
        ))}
        {/* Empty future slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`e-${i}`} className="flex flex-col items-center gap-0.5 shrink-0">
            <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${chipColor(null)}`} />
            <span className={`text-[9px] ${labelClass} leading-none`}>{legalCount + i + 1}</span>
          </div>
        ))}
        {/* Live pulse at end */}
        <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shrink-0 ml-1" />
      </div>
    </div>
  );
}

// ─── Recent Overs Scroller ────────────────────────────────────────────────────

function BallChip({ d, size = "md" }) {
  // Normalize: overs_log uses extras_type, current_over deliveries use extras_type too
  // ballStyle/ballLabel check d.extras so unify here
  const norm = d ? { ...d, extras: d.extras ?? d.extras_type } : null;
  const sz = size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <span className={`shrink-0 inline-flex items-center justify-center rounded-full font-bold ${sz} ${ballStyle(norm)}`}>
      {ballLabel(norm)}
    </span>
  );
}

function RecentOvers({ liveState, scorecard }) {
  if (!liveState?.innings) return null;

  const inningsNum = liveState.innings.innings_number;
  const scInnings  = scorecard?.innings?.find((i) => i.innings_number === inningsNum);
  const allOvers   = scInnings?.overs_log ?? [];
  const completedOvers = allOvers.filter((ov) => ov.is_completed);
  const last2      = completedOvers.slice(-2);
  const currentOver = liveState.current_over;

  if (last2.length === 0 && !currentOver) {
    return (
      <div className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 py-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="material-symbols-outlined text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>timeline</span>
          Recent overs will appear here
        </div>
        <p className="mt-1 text-xs leading-5 text-gray-400">
          We&apos;ll show the last completed overs and the live over feed as soon as the innings gets rolling.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden mb-3">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Overs</span>
        {liveState.innings && (
          <span className="text-xs text-gray-400">
            {liveState.innings.total_runs ?? 0}/{liveState.innings.total_wickets ?? 0} · {liveState.innings.total_overs ?? 0}.{liveState.innings.total_balls ?? 0} ov
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-px min-w-fit">
          {/* Last 2 completed overs */}
          {last2.map((ov) => {
            const slots = [...(ov.balls ?? [])];
            while (slots.length < 6) slots.push(null);
            return (
              <div key={ov.over_number} className="flex flex-col gap-1.5 px-3 py-3 border-r border-gray-100 min-w-fit">
                <div className="flex items-center justify-end gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold text-gray-500">{ov.runs}R {ov.wickets > 0 ? `${ov.wickets}W` : ""}</span>
                </div>
                <div className="flex gap-1 items-center">
                  {slots.map((b, i) => (
                    <BallChip key={i} d={b} size="sm" />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{ov.bowler}</p>
              </div>
            );
          })}

          {/* Current live over */}
          {currentOver && (() => {
            const balls = (currentOver.deliveries ?? [])
              .filter((d) => !d.is_undone)
              .sort((a, b) => a.raw_ball_number - b.raw_ball_number);
            const slots = [...balls];
            while (slots.length < 6) slots.push(null);
            const overRuns = balls.reduce((s, d) => s + (d.runs_bat ?? 0) + (d.extras_runs ?? 0), 0);
            const overWkts = balls.filter((d) => d.is_wicket).length;
            return (
              <div className="flex flex-col gap-1.5 px-3 py-3 bg-blue-50/60 min-w-fit">
                <div className="flex items-center justify-between gap-3 mb-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Live
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500">{overRuns}R {overWkts > 0 ? `${overWkts}W` : ""}</span>
                </div>
                <div className="flex gap-1 items-center">
                  {slots.map((b, i) => (
                    <BallChip key={i} d={b ? { ...b, extras: b.extras_type } : null} size="sm" />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{liveState.bowler?.player?.display_name ?? ""}</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Live Tab ─────────────────────────────────────────────────────────────────

function LiveTab({ liveState }) {
  if (!liveState?.innings) return (
    <EmptyStateCard
      icon="radar"
      title="Live details will appear here"
      body="As soon as the scorer starts the innings, the current batter, bowler, and ball-by-ball feed will fill this panel."
    />
  );

  const { batsmen, bowler, current_over } = liveState;
  
  const overDeliveries = (current_over?.deliveries ?? [])
    .filter((d) => !d.is_undone)
    .sort((a, b) => b.raw_ball_number - a.raw_ball_number); // reverse for chronological display

  return (
    <div className="space-y-4">
      {/* Current Players */}
      <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-full">Batter</th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500">R</th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500">B</th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500">4s</th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500">6s</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">SR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {batsmen?.map((b, i) => (
              <tr key={i} className={i === 0 ? "bg-blue-50/30" : ""}>
                <td className="px-4 py-3 font-semibold text-gray-900 flex items-center gap-1.5">
                  {b.player?.display_name ?? "—"}
                  {i === 0 && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                </td>
                <td className="px-2 py-3 text-right font-bold text-gray-900">{b.runs}</td>
                <td className="px-2 py-3 text-right text-gray-500">{b.balls}</td>
                <td className="px-2 py-3 text-right text-gray-600">{b.fours ?? 0}</td>
                <td className="px-2 py-3 text-right text-gray-600">{b.sixes ?? 0}</td>
                <td className="px-4 py-3 text-right text-gray-500">{b.strike_rate ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="border-t-4 border-gray-100"></div>
        
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-full">Bowler</th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500">O</th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500">M</th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500">R</th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500">W</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">ECO</th>
            </tr>
          </thead>
          <tbody>
            {bowler && (
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900">{bowler.player?.display_name ?? "—"}</td>
                <td className="px-2 py-3 text-right text-gray-900 font-medium">{bowler.overs}.{bowler.balls}</td>
                <td className="px-2 py-3 text-right text-gray-500">{bowler.maidens ?? 0}</td>
                <td className="px-2 py-3 text-right text-gray-900">{bowler.runs}</td>
                <td className="px-2 py-3 text-right font-bold text-blue-600">{bowler.wickets}</td>
                <td className="px-4 py-3 text-right text-gray-500">{bowler.economy}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Commentary Feed */}
      {current_over && overDeliveries.length > 0 && (
        <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="font-bold text-gray-900 text-sm">This Over (Over {current_over.over_number})</h3>
             <span className="text-xs font-medium text-gray-500">{bowler?.player?.display_name} bowling</span>
          </div>
          <div className="divide-y divide-gray-100">
            {overDeliveries.map((d, i) => (
              <div key={i} className="px-5 py-4 flex gap-4 items-start hover:bg-gray-50 transition-colors">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${ballStyle(d)}`}>
                  {ballLabel(d)}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {current_over.over_number - 1}.{d.ball_number}
                  </p>
                  <p className={`text-sm mt-0.5 ${d.is_wicket ? "text-red-600 font-medium" : "text-gray-600"}`}>
                    {d.commentary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Player ability helpers ────────────────────────────────────────────────────

function PlayerIcons({ p, size = "text-base" }) {
  if (!p || typeof p === "string") return null;

  const ms = (icon, color, title) => (
    <span
      className={`material-symbols-outlined ${size} ${color} leading-none`}
      style={{ fontVariationSettings: "'FILL' 1" }}
      title={title}
    >{icon}</span>
  );

  const bat  = ms("sports_cricket",  "text-green-600", "Batter");
  const ball = ms("sports_baseball", "text-red-500",   "Bowler");

  const typeIcon = {
    batter:               bat,
    bowler:               ball,
    all_rounder:          ms("bolt", "text-purple-500", "All-Rounder"),
    wicket_keeper:        <span className="text-sm leading-none" title="Wicket Keeper">🧤</span>,
    wicket_keeper_batter: <><span className="text-sm leading-none" title="WK-Batter">🧤</span>{bat}</>,
  }[p.player_type];

  return (
    <span className="inline-flex items-center gap-0.5">
      {p.role === "captain" && ms("star", "text-amber-500", "Captain")}
      {typeIcon}
    </span>
  );
}


// ─── Scorecard Tab (Re-using some old logic but restyled) ─────────────────────

function ScorecardTable({ battingRows, yetToBat, extras, total, overs, teamName, inningsNum, bowlingRows, fowRows }) {
  const totalWkts = battingRows?.filter(r => r.how_out && r.how_out !== "not_out").length ?? 0;

  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden mb-6">
      {/* Innings header */}
      <div className="px-4 py-3 bg-gray-900 text-white flex justify-between items-center">
        <h3 className="font-bold text-sm">
          {teamName}
          <span className="opacity-60 font-normal ml-2 text-xs">Innings {inningsNum}</span>
        </h3>
        <span className="font-bold tabular-nums">
          {total}
          <span className="opacity-60 font-normal text-xs ml-2">({overs} ov)</span>
        </span>
      </div>

      {/* ── Batting card ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-full">Batter</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">R</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">B</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">4s</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">6s</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">SR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {battingRows?.map((row, i) => {
              const isOut   = row.how_out && row.how_out !== "not_out";
              const isNotOut = !isOut;
              return (
                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-semibold ${isOut ? "text-gray-700" : "text-gray-900"}`}>
                        {row.player}
                      </span>
                      <PlayerIcons p={row} size="text-sm" />
                      {isNotOut && (
                        <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 rounded px-1 py-px leading-none">
                          not out
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 italic">
                      {dismissalText(row)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-gray-900 tabular-nums">{row.runs}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{row.balls}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums">{row.fours}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums">{row.sixes}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums">{row.strike_rate}</td>
                </tr>
              );
            })}

            {/* Extras row */}
            <tr className="bg-gray-50/60 border-t border-gray-200">
              <td className="px-4 py-2.5 text-xs font-semibold text-gray-600">
                Extras
                <span className="ml-2 font-normal text-gray-400">
                  (W {extras?.wides ?? 0}, NB {extras?.no_balls ?? 0}, B {extras?.byes ?? 0}, LB {extras?.leg_byes ?? 0})
                </span>
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-gray-700 tabular-nums">{extras?.total ?? 0}</td>
              <td colSpan={4} />
            </tr>

            {/* Total row */}
            <tr className="bg-gray-900 text-white">
              <td className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide">
                Total
                <span className="ml-2 opacity-60 font-normal normal-case tracking-normal">
                  ({totalWkts} wkt{totalWkts !== 1 ? "s" : ""}, {overs} ov)
                </span>
              </td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums text-sm">{total}</td>
              <td colSpan={4} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Yet to bat */}
      {yetToBat && yetToBat.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Yet to bat</p>
          <div className="flex flex-wrap gap-1.5">
            {yetToBat.map((p, i) => {
              const name = typeof p === "string" ? p : p.name;
              return (
                <span key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-full pl-2.5 pr-2 py-0.5 font-medium shadow-sm">
                  {name}
                  <PlayerIcons p={p} size="text-sm" />
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bowling card ── */}
      <div className="overflow-x-auto border-t-4 border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-full">Bowler</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">O</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">M</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">R</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">W</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Econ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bowlingRows?.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-2.5 font-semibold text-gray-900">{row.player}</td>
                <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">{row.overs}</td>
                <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{row.maidens}</td>
                <td className="px-3 py-2.5 text-right text-gray-900 tabular-nums">{row.runs}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span className={`font-bold ${row.wickets > 0 ? "text-blue-600" : "text-gray-400"}`}>
                    {row.wickets}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums">{row.economy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Fall of Wickets ── */}
      {fowRows && fowRows.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-3.5 bg-gray-50/40">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Fall of Wickets</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {fowRows.map((f, i) => (
              <span key={i} className="text-xs text-gray-600 tabular-nums">
                <span className="font-bold text-gray-900">{f.runs}/{f.wicket}</span>
                <span className="text-gray-400 ml-1">({f.player}, {f.over} ov)</span>
                {i < fowRows.length - 1 && <span className="text-gray-300 ml-3">·</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Playing XI panel (shown when team hasn't batted yet) ─────────────────────

function PlayingXI({ players, teamName }) {
  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-900 text-white flex items-center justify-between">
        <h3 className="font-bold text-sm">{teamName}</h3>
        <span className="text-xs text-white/60">Playing XI</span>
      </div>
      {(!players || players.length === 0) ? (
        <div className="px-4 py-8 text-center">
          <span className="material-symbols-outlined text-3xl text-gray-300 block mb-2">group</span>
          <p className="text-sm text-gray-400">Playing XI not confirmed yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {players.map((p, i) => {
            const style = p.batting_style
              ? p.batting_style.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
              : null;
            const bowl = p.bowling_style
              ? p.bowling_style.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
              : null;
            return (
              <li key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                <span className="w-5 text-xs text-gray-400 tabular-nums shrink-0 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                    <PlayerIcons p={p} size="text-base" />
                  </div>
                  {(style || bowl) && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {style}{style && bowl ? " · " : ""}{bowl}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Commentary Tab ───────────────────────────────────────────────────────────

function CommentaryBallRow({ d, overNum }) {
  const norm = { ...d, extras: d.extras_type };
  const isWicket = d.is_wicket;
  return (
    <>
      {/* Wicket banner inline before the ball row */}
      {isWicket && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-600">
          <span className="material-symbols-outlined text-white text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>sports_cricket</span>
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            Wicket! {d.commentary ?? ""}
          </span>
        </div>
      )}
      <div className={`px-4 py-3 flex gap-3 items-start ${isWicket ? "bg-red-50" : ""}`}>
        <BallChip d={norm} size="sm" />
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[10px] font-semibold text-gray-400 tabular-nums mb-0.5">
            {overNum}.{d.ball_number}
          </p>
          <span className={`text-sm leading-snug ${isWicket ? "text-red-700 font-semibold" : "text-gray-700"}`}>
            {d.commentary ?? (isWicket ? "Wicket!" : d.runs_bat === 4 ? "FOUR!" : d.runs_bat === 6 ? "SIX!" : `${d.runs_bat ?? 0} run${d.runs_bat !== 1 ? "s" : ""}`)}
          </span>
        </div>
      </div>
    </>
  );
}

function PartnershipMilestoneCard({ milestone, batting_team }) {
  const colors = {
    50:  { bg: "bg-emerald-50",  border: "border-emerald-200", icon: "text-emerald-500", text: "text-emerald-800", sub: "text-emerald-600" },
    100: { bg: "bg-purple-50",   border: "border-purple-200",  icon: "text-purple-500",  text: "text-purple-800", sub: "text-purple-600" },
    150: { bg: "bg-amber-50",    border: "border-amber-200",   icon: "text-amber-500",   text: "text-amber-800",  sub: "text-amber-600" },
    200: { bg: "bg-rose-50",     border: "border-rose-200",    icon: "text-rose-500",    text: "text-rose-800",   sub: "text-rose-600" },
  };
  const c = colors[milestone.threshold] ?? colors[50];
  return (
    <div className={`${c.bg} border ${c.border} sm:rounded-2xl px-4 py-3 flex items-center gap-3`}>
      <span className={`material-symbols-outlined text-xl shrink-0 ${c.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        handshake
      </span>
      <div>
        <p className={`text-sm font-bold ${c.text}`}>
          {milestone.threshold}-Run Partnership!
        </p>
        <p className={`text-xs mt-0.5 ${c.sub}`}>
          {milestone.player} — Wkt {milestone.wicket} · {batting_team}
        </p>
      </div>
    </div>
  );
}

function CommentaryTab({ scorecard, liveState }) {
  const [openOvers, setOpenOvers] = useState({});

  const innings = scorecard?.innings ?? [];

  // Derive partnership milestone events from FOW data.
  // A milestone fires when partnership_runs crosses 50/100/150/200.
  function getMilestones(inn) {
    const fow = inn?.fall_of_wickets ?? [];
    const milestones = [];
    const thresholds = [200, 150, 100, 50];
    fow.forEach((wkt) => {
      const runs = wkt.partnership_runs ?? 0;
      thresholds.forEach((t) => {
        if (runs >= t) {
          milestones.push({ threshold: t, player: wkt.player, wicket: wkt.wicket, over: wkt.over });
        }
      });
    });
    return milestones;
  }

  // Build flat section list: innings-break card between innings, then completed overs newest-first.
  // Milestone cards are inserted after (above in reversed display) the over where the wicket fell.
  const allSections = [];
  [...innings].reverse().forEach((inn) => {
    // Innings break card between innings 1 and 2
    if (inn.innings_number === 2) {
      allSections.push({ type: "innings_break", inn });
    }
    const milestones = getMilestones(inn);
    // Map over_number → milestone for this innings (use highest threshold per over)
    const milestoneByOver = {};
    milestones.forEach((m) => {
      const ovNum = parseInt(m.over?.split(".")[0], 10) || 0;
      if (!milestoneByOver[ovNum] || m.threshold > milestoneByOver[ovNum].threshold) {
        milestoneByOver[ovNum] = m;
      }
    });
    const log = [...(inn.overs_log ?? [])].reverse();
    log.forEach((ov) => {
      // Insert milestone card before the over it occurred in (since list is reversed = above it visually)
      if (milestoneByOver[ov.over_number]) {
        allSections.push({ type: "milestone", inn, milestone: milestoneByOver[ov.over_number] });
      }
      allSections.push({ type: "over", inn, ov });
    });
  });

  const liveOver = liveState?.current_over;
  const liveBalls = (liveOver?.deliveries ?? [])
    .filter((d) => !d.is_undone)
    .sort((a, b) => a.raw_ball_number - b.raw_ball_number);

  function toggleOver(key) {
    setOpenOvers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (allSections.length === 0 && !liveOver) {
    return (
      <EmptyStateCard
        icon="record_voice_over"
        title="Commentary will appear here"
        body="Over-by-over updates and wicket calls will show up here once the first deliveries are scored."
      />
    );
  }

  return (
    <div className="space-y-2">

      {/* ── Live over — pinned top, always expanded ── */}
      {liveOver && liveBalls.length > 0 && (() => {
        const overRuns = liveBalls.reduce((s, d) => s + (d.runs_bat ?? 0) + (d.extras_runs ?? 0), 0);
        const overWkts = liveBalls.filter((d) => d.is_wicket).length;
        const inn = liveState?.innings;
        const scoreStr = `${inn?.total_runs ?? 0}/${inn?.total_wickets ?? 0}`;
        return (
          <div className="bg-white sm:rounded-2xl overflow-hidden ring-2 ring-blue-500 shadow-md">
            <div className="px-4 py-3 flex items-center justify-between bg-blue-600">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
                <span className="text-sm font-bold text-white">
                  Over {liveOver.over_number}
                </span>
                <span className="text-xs text-blue-200 font-medium">{scoreStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {liveBalls.map((d, i) => <BallChip key={i} d={{ ...d, extras: d.extras_type }} size="sm" />)}
                </div>
                <span className="text-xs font-bold text-white bg-blue-700 px-2 py-0.5 rounded-full">
                  {overRuns}R{overWkts > 0 ? ` ${overWkts}W` : ""}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {[...liveBalls].reverse().map((d, i) => (
                <CommentaryBallRow key={i} d={d} overNum={liveOver.over_number - 1} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Completed overs + innings break cards + milestone cards, newest first ── */}
      {allSections.map((section, idx) => {
        if (section.type === "innings_break") {
          const inn1 = innings.find((i) => i.innings_number === 1);
          return (
            <div key="innings-break" className="bg-amber-50 border border-amber-200 sm:rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>swap_horiz</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Innings Break</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {inn1?.batting_team} scored {inn1?.total} in {inn1?.overs} overs.
                  Target: <span className="font-bold">{(parseInt(inn1?.total?.split("/")[0]) || 0) + 1}</span>
                </p>
              </div>
            </div>
          );
        }

        if (section.type === "milestone") {
          return (
            <PartnershipMilestoneCard
              key={`milestone-${section.inn.innings_number}-${section.milestone.wicket}-${section.milestone.threshold}`}
              milestone={section.milestone}
              batting_team={section.inn.batting_team}
            />
          );
        }

        const { inn, ov } = section;
        const key = `${inn.innings_number}-${ov.over_number}`;
        const isOpen = openOvers[key] ?? false;
        const balls = (ov.balls ?? []).slice().reverse();

        return (
          <div key={key} className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
            {/* Over header */}
            <button
              onClick={() => toggleOver(key)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  <p className="text-sm font-bold text-gray-800">
                    Over {ov.over_number}
                    <span className="text-gray-400 font-normal text-xs ml-2">{inn.batting_team}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{ov.bowler}</p>
                </div>
                {/* Ball chips — hidden on mobile to save space */}
                <div className="hidden sm:flex gap-1 flex-wrap">
                  {(ov.balls ?? []).map((b, i) => <BallChip key={i} d={{ ...b, extras: b.extras_type }} size="sm" />)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ov.wickets > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                  {ov.runs}R{ov.wickets > 0 ? ` ${ov.wickets}W` : ""}
                  {ov.maidens > 0 ? " M" : ""}
                </span>
                <span className="material-symbols-outlined text-gray-300 text-lg leading-none">
                  {isOpen ? "expand_less" : "expand_more"}
                </span>
              </div>
            </button>

            {/* Mobile ball chips always visible */}
            <div className="sm:hidden px-4 pb-2.5 flex gap-1 flex-wrap">
              {(ov.balls ?? []).map((b, i) => <BallChip key={i} d={{ ...b, extras: b.extras_type }} size="sm" />)}
            </div>

            {/* Ball-by-ball detail */}
            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {balls.map((b, i) => (
                  <CommentaryBallRow key={i} d={b} overNum={ov.over_number - 1} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Worm Graph ───────────────────────────────────────────────────────────────

function WormGraph({ scorecard, liveState }) {
  const innings = scorecard?.innings ?? [];
  if (innings.length === 0) return null;

  const oversLimit = scorecard?.match?.overs_limit ?? 20;

  // Build cumulative runs per over per innings from overs_log
  function buildCurve(inn) {
    const log = inn?.overs_log ?? [];
    const points = [{ over: 0, runs: 0 }];
    let cumRuns = 0;
    log.filter((o) => o.is_completed).forEach((o) => {
      cumRuns += o.runs ?? 0;
      points.push({ over: o.over_number, runs: cumRuns });
    });
    // Add current live over partial point
    if (liveState?.innings?.innings_number === inn.innings_number && liveState?.current_over) {
      const liveBalls = (liveState.current_over.deliveries ?? []).filter((d) => !d.is_undone);
      const liveRuns = liveBalls.reduce((s, d) => s + (d.runs_bat ?? 0) + (d.extras_runs ?? 0), 0);
      const overNum = liveState.current_over.over_number - 1 + liveBalls.filter((d) => d.is_legal_ball).length / 6;
      if (liveRuns > 0) points.push({ over: overNum, runs: cumRuns + liveRuns });
    }
    return points;
  }

  const curves = innings.map((inn, idx) => ({
    points: buildCurve(inn),
    color: idx === 0 ? "#2563eb" : "#16a34a",
    label: inn.batting_team,
    dashed: idx === 1,
  }));

  // SVG dimensions
  const W = 320, H = 160, PAD = { top: 12, right: 16, bottom: 28, left: 36 };
  const gW = W - PAD.left - PAD.right;
  const gH = H - PAD.top - PAD.bottom;

  const maxRuns = Math.max(
    ...curves.flatMap((c) => c.points.map((p) => p.runs)),
    50
  );
  const maxOvers = oversLimit;

  function toX(over) { return PAD.left + (over / maxOvers) * gW; }
  function toY(runs) { return PAD.top + gH - (runs / maxRuns) * gH; }

  function makePath(points) {
    if (points.length < 2) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.over).toFixed(1)},${toY(p.runs).toFixed(1)}`).join(" ");
  }

  // Y-axis gridlines
  const yTicks = [0, Math.round(maxRuns * 0.25), Math.round(maxRuns * 0.5), Math.round(maxRuns * 0.75), maxRuns];
  // X-axis ticks every 5 overs
  const xTicks = Array.from({ length: Math.floor(maxOvers / 5) + 1 }, (_, i) => i * 5);

  const currentOver = liveState?.current_over?.over_number;

  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden mb-3">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Worm Graph</span>
        <div className="flex items-center gap-3">
          {curves.map((c) => (
            <span key={c.label} className="flex items-center gap-1 text-[10px] font-semibold text-gray-600">
              <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: c.color }} />
              {c.label}
            </span>
          ))}
        </div>
      </div>
      <div className="px-2 py-3 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 260, maxWidth: 600 }}>
          {/* Grid lines */}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} y1={toY(t)} x2={W - PAD.right} y2={toY(t)} stroke="#f3f4f6" strokeWidth="1" />
              <text x={PAD.left - 4} y={toY(t) + 3.5} textAnchor="end" fontSize="8" fill="#9ca3af">{t}</text>
            </g>
          ))}
          {xTicks.map((t) => (
            <g key={t}>
              <line x1={toX(t)} y1={PAD.top} x2={toX(t)} y2={H - PAD.bottom} stroke="#f3f4f6" strokeWidth="1" />
              <text x={toX(t)} y={H - PAD.bottom + 10} textAnchor="middle" fontSize="8" fill="#9ca3af">{t}</text>
            </g>
          ))}

          {/* Current over dashed vertical line */}
          {currentOver && (
            <line
              x1={toX(currentOver - 1)} y1={PAD.top}
              x2={toX(currentOver - 1)} y2={H - PAD.bottom}
              stroke="#93c5fd" strokeWidth="1" strokeDasharray="3,3"
            />
          )}

          {/* Curves */}
          {curves.map((c) => (
            <path
              key={c.label}
              d={makePath(c.points)}
              fill="none"
              stroke={c.color}
              strokeWidth="2"
              strokeDasharray={c.dashed ? "5,3" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Axis labels */}
          <text x={PAD.left + gW / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#6b7280">Overs</text>
        </svg>
      </div>
    </div>
  );
}

// ─── Partnerships Table ───────────────────────────────────────────────────────

function normalizePartnerships(inn) {
  const apiPartnerships = Array.isArray(inn?.partnerships) ? inn.partnerships : [];

  if (apiPartnerships.length > 0) {
    return apiPartnerships.map((p, idx) => {
      const batters = Array.isArray(p.batters) ? p.batters : [];
      const pairA = batters[0] ?? p.pair_a ?? { name: "Unknown", runs: 0, balls: 0 };
      const pairB = batters[1] ?? p.pair_b ?? { name: "Unknown", runs: 0, balls: 0 };
      const battingRuns = (pairA.runs ?? 0) + (pairB.runs ?? 0);
      const extras = Math.max((p.runs ?? 0) - battingRuns, 0);

      return {
        ...p,
        id: `${inn.innings_number}-${idx}-${p.score_end ?? p.runs ?? idx}`,
        pairA,
        pairB,
        battingRuns,
        extras,
      };
    });
  }

  const fow = inn?.fall_of_wickets ?? [];
  return fow.map((wkt, i) => {
    const partRuns = wkt.partnership_runs != null
      ? wkt.partnership_runs
      : (wkt.runs ?? 0) - (i === 0 ? 0 : fow[i - 1].runs);

    return {
      id: `${inn.innings_number}-fow-${wkt.wicket}`,
      status: "finished",
      wicket: wkt.wicket,
      dismissed: wkt.player,
      dismissed_by: null,
      score_start: i === 0 ? 0 : fow[i - 1].runs,
      score_end: wkt.runs,
      first_over: wkt.over,
      last_over: wkt.over,
      runs: partRuns,
      balls: null,
      extras: 0,
      battingRuns: partRuns,
      pairA: { name: "Unknown", runs: 0, balls: 0 },
      pairB: { name: "Unknown", runs: 0, balls: 0 },
    };
  });
}

function PartnershipSummaryChart({ partnerships }) {
  if (!partnerships.length) return null;

  const maxRuns = Math.max(...partnerships.map((p) => p.runs ?? 0), 1);

  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Partnership chart
        </span>
        <span className="text-[10px] text-gray-400">Contribution split</span>
      </div>
      <div className="p-4 space-y-3">
        {partnerships.map((p, idx) => {
          const battingRuns = Math.max(p.battingRuns ?? 0, 0);
          const extras = Math.max(p.extras ?? 0, 0);
          const total = Math.max(p.runs ?? 0, 1);
          const aRuns = Math.max(p.pairA?.runs ?? 0, 0);
          const bRuns = Math.max(p.pairB?.runs ?? 0, 0);
          const aShare = battingRuns > 0 ? (aRuns / battingRuns) * 100 : 0;
          const bShare = battingRuns > 0 ? (bRuns / battingRuns) * 100 : 0;
          const extraShare = extras > 0 ? (extras / total) * 100 : 0;
          const barWidth = Math.max((p.runs ?? 0) / maxRuns * 100, 6);

          return (
            <div key={p.id ?? idx} className="grid grid-cols-[44px_1fr_44px] items-center gap-3">
              <div className="text-[10px] font-bold text-gray-400 text-right tabular-nums">
                {p.wicket ? `${p.wicket}W` : "C"}
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-gray-100 flex" style={{ width: `${barWidth}%`, minWidth: "72px" }}>
                {aShare > 0 && (
                  <div className="h-full bg-sky-500" style={{ width: `${aShare}%` }} />
                )}
                {bShare > 0 && (
                  <div className="h-full bg-emerald-500" style={{ width: `${bShare}%` }} />
                )}
                {extraShare > 0 && (
                  <div className="h-full bg-gray-300" style={{ width: `${extraShare}%` }} />
                )}
              </div>
              <div className="text-xs font-black text-gray-900 tabular-nums text-left">
                {p.runs}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PartnershipsTable({ inn }) {
  const partnerships = normalizePartnerships(inn);
  if (partnerships.length === 0) return null;

  const highestStand = partnerships.reduce((best, item) => (
    (item.runs ?? 0) > (best?.runs ?? 0) ? item : best
  ), partnerships[0]);
  const currentStand = [...partnerships].reverse().find((item) => item.status === "current") ?? null;

  return (
    <div className="space-y-3">
      <PartnershipSummaryChart partnerships={partnerships} />

      <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Partnerships - {inn.batting_team}
            </span>
            <span className="text-[10px] text-gray-400">
              {partnerships.length} stands, highest {highestStand?.runs ?? 0}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 shrink-0">Innings {inn.innings_number}</span>
        </div>

        <div className="divide-y divide-gray-100">
          {partnerships.map((p) => {
            const battingRuns = Math.max(p.battingRuns ?? 0, 0);
            const extras = Math.max(p.extras ?? 0, 0);
            const total = Math.max(p.runs ?? 0, 1);
            const aRuns = Math.max(p.pairA?.runs ?? 0, 0);
            const bRuns = Math.max(p.pairB?.runs ?? 0, 0);
            const aBalls = Math.max(p.pairA?.balls ?? 0, 0);
            const bBalls = Math.max(p.pairB?.balls ?? 0, 0);
            const aShare = battingRuns > 0 ? (aRuns / battingRuns) * 100 : 0;
            const bShare = battingRuns > 0 ? (bRuns / battingRuns) * 100 : 0;
            const extraShare = extras > 0 ? (extras / total) * 100 : 0;
            const statusLabel = p.status === "current"
              ? "Current stand"
              : p.status === "innings_end"
                ? "Innings end"
                : `Wicket ${p.wicket}`;

            return (
              <div key={p.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {statusLabel}
                      </span>
                      {p.dismissed && (
                        <span className="text-[10px] text-gray-400">
                          {p.dismissed}
                          {p.dismissed_by ? ` c ${p.dismissed_by}` : ""}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-sky-50/70 border border-sky-100 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Player A</p>
                        <p className="mt-1 text-sm font-bold text-gray-900 truncate">{p.pairA?.name ?? "Unknown"}</p>
                        <p className="text-xs text-slate-600 tabular-nums">
                          {aRuns} runs{aBalls !== null ? ` (${aBalls}b)` : ""}
                        </p>
                      </div>
                      <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Player B</p>
                        <p className="mt-1 text-sm font-bold text-gray-900 truncate">{p.pairB?.name ?? "Unknown"}</p>
                        <p className="text-xs text-slate-600 tabular-nums">
                          {bRuns} runs{bBalls !== null ? ` (${bBalls}b)` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-gray-900 tabular-nums">{p.runs}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Partnership</p>
                  </div>
                </div>

                <div className="mt-3 h-3 rounded-full overflow-hidden bg-gray-100 flex">
                  {aShare > 0 && <div className="h-full bg-sky-500" style={{ width: `${aShare}%` }} />}
                  {bShare > 0 && <div className="h-full bg-emerald-500" style={{ width: `${bShare}%` }} />}
                  {extraShare > 0 && <div className="h-full bg-gray-300" style={{ width: `${extraShare}%` }} />}
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-400">
                  <span className="tabular-nums">
                    Score at fall: <span className="font-semibold text-gray-600">{p.score_end ?? p.score_start ?? 0}</span>
                    {p.wicket ? <span className="ml-1">({p.wicket}W)</span> : currentStand?.id === p.id ? <span className="ml-1">(live)</span> : null}
                  </span>
                  <span className="tabular-nums">
                    {p.first_over} - {p.last_over}
                  </span>
                  <span className="tabular-nums">
                    {battingRuns > 0 ? `${aRuns}/${bRuns}` : `extras ${extras}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ scorecard, liveState }) {
  if ((scorecard?.innings ?? []).length === 0) {
    return (
      <EmptyStateCard
        icon="bar_chart"
        title="Stats will fill in after play starts"
        body="Top scorers, bowlers, partnerships, and the worm graph appear automatically as the scorecard grows."
      />
    );
  }

  return (
    <div className="space-y-3">
      <WormGraph scorecard={scorecard} liveState={liveState} />

      {/* Top performers + partnerships per innings */}
      {(scorecard?.innings ?? []).map((inn) => {
        const topBatter = [...(inn.batting ?? [])].sort((a, b) => b.runs - a.runs)[0];
        const topBowler = [...(inn.bowling ?? [])].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0];
        return (
          <div key={inn.innings_number} className="space-y-3">
          <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{inn.batting_team} · Innings {inn.innings_number}</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Top Scorer</p>
                {topBatter ? (
                  <>
                    <p className="text-sm font-bold text-gray-900 truncate">{topBatter.player}</p>
                    <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                      <span className="text-lg font-black text-gray-900">{topBatter.runs}</span>
                      <span className="ml-1">({topBatter.balls}b)</span>
                      {topBatter.fours > 0 && <span className="ml-1 text-green-600">{topBatter.fours}×4</span>}
                      {topBatter.sixes > 0 && <span className="ml-1 text-indigo-600">{topBatter.sixes}×6</span>}
                    </p>
                  </>
                ) : <p className="text-xs text-gray-400">—</p>}
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Top Bowler</p>
                {topBowler ? (
                  <>
                    <p className="text-sm font-bold text-gray-900 truncate">{topBowler.player}</p>
                    <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                      <span className="text-lg font-black text-gray-900">{topBowler.wickets}W</span>
                      <span className="ml-1">/{topBowler.runs}R</span>
                      <span className="ml-1">({topBowler.overs} ov)</span>
                    </p>
                  </>
                ) : <p className="text-xs text-gray-400">—</p>}
              </div>
            </div>
          </div>

          {/* Partnerships table for this innings */}
          <PartnershipsTable inn={inn} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Live Score PiP Widget ────────────────────────────────────────────────────

function useLiveScorePip({ sc, live, code }) {
  const pipWinRef = useRef(null);

  const supported = typeof window !== "undefined" &&
    "documentPictureInPicture" in window;

  const buildWidgetHTML = useCallback((scorecard, liveState, matchCode) => {
    const match   = scorecard?.match ?? {};
    const innings = scorecard?.innings ?? [];
    const inn1    = innings.find((i) => i.innings_number === 1);
    const inn2    = innings.find((i) => i.innings_number === 2);
    const home    = match.teams?.find((t) => t.role === "home");
    const away    = match.teams?.find((t) => t.role === "away");
    const liveInn = liveState?.innings;
    const matchUrl = `${location.origin}/matches/${matchCode}`;

    function teamBlock(team, inn) {
      const isBatting = liveInn && inn && liveInn.innings_number === inn.innings_number;
      const score  = inn ? inn.total : null;
      const overs  = inn ? inn.overs : null;
      const initials = (team?.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

      return `
        <div class="team ${isBatting ? "batting" : ""}">
          <div class="logo">${initials}</div>
          <div class="info">
            <div class="name">${team?.name ?? "—"}</div>
            ${score !== null
              ? `<div class="score">${score} <span class="overs">${overs} ov</span></div>`
              : `<div class="ytb">Yet to bat</div>`
            }
          </div>
          ${isBatting ? `<div class="live-dot"></div>` : ""}
        </div>`;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: #0f172a;
    color: #fff;
    width: 260px;
    cursor: pointer;
    user-select: none;
  }
  a { text-decoration: none; color: inherit; display: block; }
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .header-left { display: flex; align-items: center; gap-6px; gap: 6px; }
  .pip-dot { width:6px; height:6px; border-radius:50%; background:#ef4444; animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .header-title { font-size: 10px; font-weight:700; color:rgba(255,255,255,0.45); letter-spacing:.08em; text-transform:uppercase; }
  .close-btn {
    width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.1);
    border:none; color:#fff; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center;
    line-height:1;
  }
  .close-btn:hover { background: rgba(255,255,255,0.2); }
  .teams { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
  .team {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 10px;
    background: rgba(255,255,255,0.04);
    transition: background .15s;
    position: relative;
  }
  .team.batting { background: rgba(59,130,246,0.15); }
  .logo {
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(255,255,255,0.1);
    display: flex; align-items:center; justify-content:center;
    font-size: 12px; font-weight:800; color:rgba(255,255,255,0.8);
    flex-shrink: 0;
  }
  .team.batting .logo { background: rgba(59,130,246,0.35); color:#93c5fd; }
  .info { flex:1; min-width:0; }
  .name { font-size: 12px; font-weight:700; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .score { font-size: 18px; font-weight:800; color:#fff; line-height:1.2; margin-top:1px; }
  .overs { font-size: 11px; font-weight:400; color:rgba(255,255,255,0.4); }
  .ytb { font-size: 11px; color: rgba(255,255,255,0.3); font-style:italic; margin-top:2px; }
  .live-dot {
    position:absolute; top:8px; right:10px;
    width:6px; height:6px; border-radius:50%; background:#3b82f6; animation:pulse 1.2s infinite;
  }
  .footer {
    padding: 6px 12px 8px;
    font-size: 10px; color:rgba(255,255,255,0.25);
    text-align:center; letter-spacing:.04em;
  }
</style>
</head><body>
<a href="${matchUrl}" target="_blank">
  <div class="header">
    <div class="header-left">
      <div class="pip-dot"></div>
      <span class="header-title">Live · ${matchCode}</span>
    </div>
    <button class="close-btn" id="closeBtn" onclick="event.preventDefault();window.close()">×</button>
  </div>
  <div class="teams">
    ${teamBlock(home, inn1?.batting_team === home?.name ? inn1 : inn2?.batting_team === home?.name ? inn2 : null)}
    ${teamBlock(away, inn1?.batting_team === away?.name ? inn1 : inn2?.batting_team === away?.name ? inn2 : null)}
  </div>
  <div class="footer">Tap to open match · CricketApp</div>
</a>
</body></html>`;
  }, []);

  const updatePip = useCallback((scorecard, liveState) => {
    const win = pipWinRef.current;
    if (!win || win.closed) return;
    const html = buildWidgetHTML(scorecard, liveState, code);
    win.document.open();
    win.document.write(html);
    win.document.close();
  }, [buildWidgetHTML, code]);

  async function openPip() {
    if (!supported) return;
    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 260, height: 200,
      });
      pipWinRef.current = pipWin;
      updatePip(sc, live);
      pipWin.addEventListener("pagehide", () => { pipWinRef.current = null; });
    } catch (e) {
      console.warn("PiP failed:", e);
    }
  }

  function closePip() {
    pipWinRef.current?.close();
    pipWinRef.current = null;
  }

  // Update PiP content whenever sc or live changes
  useEffect(() => {
    if (pipWinRef.current && !pipWinRef.current.closed) {
      updatePip(sc, live);
    }
  }, [sc, live, updatePip]);

  const isOpen = () => pipWinRef.current && !pipWinRef.current?.closed;

  return { supported, openPip, closePip, isOpen };
}

// ─── QR Code Modal ───────────────────────────────────────────────────────────

function QRModal({ url, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 220,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      });
    });
  }, [url]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <p className="font-bold text-gray-900 text-base">Share Match</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <canvas ref={canvasRef} className="rounded-xl" />
        <p className="text-xs text-gray-400 text-center break-all font-mono">{url}</p>
        <button
          onClick={() => { navigator.clipboard?.writeText(url); }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors py-2.5 text-sm font-semibold text-gray-700"
        >
          <span className="material-symbols-outlined text-base">content_copy</span>
          Copy link
        </button>
      </div>
    </div>
  );
}

// ─── Share Result Card ────────────────────────────────────────────────────────

function shareResultCard(sc) {
  const canvas = document.createElement("canvas");
  const DPR = window.devicePixelRatio || 1;
  const W = 800, H = 420;
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width  = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);

  const match   = sc.match;
  const innings = sc.innings ?? [];
  const result  = sc.result;
  const inn1    = innings.find((i) => i.innings_number === 1);
  const inn2    = innings.find((i) => i.innings_number === 2);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e3a5f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative arc
  ctx.beginPath();
  ctx.arc(W + 60, -60, 320, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(59,130,246,0.08)";
  ctx.fill();

  // App branding
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font      = "bold 13px system-ui, sans-serif";
  ctx.fillText("CricketApp", 36, 36);

  // Match title
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font      = "13px system-ui, sans-serif";
  ctx.fillText(`${match?.venue ?? ""} · ${match?.date ?? ""}`, 36, 60);

  // Team scores
  function drawTeamScore(inn, y) {
    if (!inn) return;
    ctx.fillStyle = "#ffffff";
    ctx.font      = "bold 28px system-ui, sans-serif";
    ctx.fillText(inn.batting_team, 36, y);

    ctx.font      = "bold 44px system-ui, sans-serif";
    ctx.fillStyle = "#60a5fa";
    ctx.fillText(inn.total, 36, y + 50);

    ctx.font      = "14px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`${inn.overs} overs`, 36, y + 72);
  }

  drawTeamScore(inn1, 105);
  if (inn2) {
    // Divider
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(36, 235, W - 72, 1);
    drawTeamScore(inn2, 260);
  }

  // MOTM strip
  const motm = sc.motm;
  if (motm) {
    ctx.fillStyle = "rgba(245,158,11,0.15)";
    ctx.beginPath();
    ctx.roundRect(28, H - 130, W - 56, 50, 10);
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.font      = "bold 12px system-ui, sans-serif";
    ctx.fillText("⭐ Man of the Match", 44, H - 113);
    ctx.fillStyle = "#ffffff";
    ctx.font      = "bold 15px system-ui, sans-serif";
    ctx.fillText(`${motm.name}  ·  ${motm.team}`, 44, H - 97);
    const perf = [motm.batting, motm.bowling].filter(Boolean).join("  ·  ");
    if (perf) {
      ctx.fillStyle = "rgba(245,158,11,0.85)";
      ctx.font      = "13px system-ui, sans-serif";
      ctx.fillText(perf, 44, H - 80);
    }
  }

  // Result banner
  if (result?.summary) {
    const bannerY = motm ? H - 76 : H - 70;
    const bannerH = 50;
    ctx.fillStyle = "rgba(59,130,246,0.25)";
    ctx.beginPath();
    ctx.roundRect(28, bannerY, W - 56, bannerH, 12);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font      = "bold 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(result.summary, W / 2, bannerY + 32);
    ctx.textAlign = "left";
  }

  // Match code bottom-right
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font      = "12px monospace";
  ctx.textAlign = "right";
  ctx.fillText(match?.code ?? "", W - 36, H - 18);
  ctx.textAlign = "left";

  // Download the result card as a PNG
  canvas.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${match?.code ?? "match"}-result.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, "image/png");
}

// ─── Live Players Panel ───────────────────────────────────────────────────────

function LivePlayersPanel({ liveState }) {
  const { batsmen, bowler } = liveState;
  if (!batsmen?.length && !bowler) return null;

  const striker    = batsmen?.find((b) => b.is_striker) ?? batsmen?.[0];
  const nonStriker = batsmen?.find((b) => !b.is_striker) ?? batsmen?.[1];

  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden mb-3">
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* Batsmen col */}
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Batting</p>
          <div className="space-y-3">
            {striker && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <p className="text-sm font-bold text-gray-900 truncate">{striker.player?.display_name ?? "—"}</p>
                  <span className="text-[10px] text-blue-500 font-bold">★</span>
                </div>
                <p className="text-sm font-bold text-gray-900 shrink-0 tabular-nums">
                  {striker.runs}<span className="text-gray-400 font-normal text-xs"> ({striker.balls})</span>
                </p>
              </div>
            )}
            {nonStriker && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-gray-300" />
                  <p className="text-sm font-semibold text-gray-600 truncate">{nonStriker.player?.display_name ?? "—"}</p>
                </div>
                <p className="text-sm font-semibold text-gray-600 shrink-0 tabular-nums">
                  {nonStriker.runs}<span className="text-gray-400 font-normal text-xs"> ({nonStriker.balls})</span>
                </p>
              </div>
            )}
            {!striker && !nonStriker && (
              <p className="text-xs text-gray-400">No batsmen data</p>
            )}
          </div>
        </div>

        {/* Bowler col */}
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Bowling</p>
          {bowler ? (
            <div>
              <p className="text-sm font-bold text-gray-900 truncate mb-1">{bowler.player?.display_name ?? "—"}</p>
              <p className="text-xs text-gray-500 tabular-nums">
                {bowler.overs}.{bowler.balls} ov · {bowler.runs} R · {bowler.wickets} W
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Eco {bowler.economy}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Between overs</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Push Notifications ───────────────────────────────────────────────────────

function usePushNotifications({ code }) {
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(() => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window);
  const [busy, setBusy] = useState(false);
  const endpointRef = useRef(null);

  useEffect(() => {
    // Check if already subscribed for this match
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription()
    ).then((sub) => {
      if (sub) {
        endpointRef.current = sub.endpoint;
        setSubscribed(true);
      }
    }).catch(() => {});
  }, []);

  async function toggle() {
    if (busy || !supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      if (subscribed) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await apiRequest(`/api/matches/${code}/push/unsubscribe`, {
            method: "POST",
            body: { endpoint: sub.endpoint },
          });
          await sub.unsubscribe();
        }
        endpointRef.current = null;
        setSubscribed(false);
      } else {
        // Request permission
        const perm = await Notification.requestPermission();
        if (perm !== "granted") return;

        // Get VAPID public key
        const { public_key: vapidKey } = await apiRequest("/api/push/vapid-public-key");

        // Convert base64url to Uint8Array
        const padding = "=".repeat((4 - (vapidKey.length % 4)) % 4);
        const base64 = (vapidKey + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawKey = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: rawKey,
        });

        const json = sub.toJSON();
        await apiRequest(`/api/matches/${code}/push/subscribe`, {
          method: "POST",
          body: {
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
        });

        endpointRef.current = json.endpoint;
        setSubscribed(true);
      }
    } catch (e) {
      console.error("Push toggle failed", e);
    } finally {
      setBusy(false);
    }
  }

  return { supported, subscribed, busy, toggle };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicMatchPage() {
  const { code } = useParams();
  const [sc, setSc] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("scorecard");
  const [scorecardInn, setScorecardInn] = useState(1);
  const [showQR, setShowQR] = useState(false);
  const [pipOpen, setPipOpen] = useState(false);
  const mountedRef = useRef(true);

  const pip = useLiveScorePip({ sc, live, code });
  const push = usePushNotifications({ code });

  const fetchScorecard = useCallback(async () => {
    try {
      const data = await apiRequest(`/api/matches/${code}/scorecard`);
      if (mountedRef.current) setSc(data);
    } catch (e) {
      if (mountedRef.current) setError(e?.data?.message ?? "Match not found.");
    }
  }, [code]);

  const fetchLive = useCallback(async () => {
    try {
      const data = await apiRequest(`/api/matches/${code}/state`);
      if (mountedRef.current) setLive(data);
    } catch {
      // Optional live state
    }
  }, [code]);

  const loadMatch = useCallback(async () => {
    await fetchScorecard();
    if (mountedRef.current) {
      setLoading(false);
      void fetchLive();
    }
  }, [fetchScorecard, fetchLive]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    let active = true;
    (async () => {
      await fetchScorecard();
      if (active && mountedRef.current) {
        setLoading(false);
        void fetchLive();
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchScorecard, fetchLive]);

  // Reverb WebSocket subscription — live matches get real-time delivery updates,
  // completed matches subscribe briefly so MOTM announcements show immediately.
  useEffect(() => {
    const s = sc?.match?.status;
    if (s !== "live" && s !== "innings_break" && s !== "completed") return;

    const echo = getEcho();
    const channel = echo.channel(`match.${code}`);

    channel.listen(".state.updated", () => {
      fetchScorecard();
      if (s !== "completed") fetchLive();
    });

    return () => {
      echo.leaveChannel(`match.${code}`);
    };
  }, [sc?.match?.status, code, fetchScorecard, fetchLive]);

  if (loading) {
    return (
      <MatchShell status={null}>
        <div className="space-y-3">
          <Spinner />
          <MatchPageSkeleton />
        </div>
      </MatchShell>
    );
  }
  
  if (error || !sc) return (
    <MatchShell status={null}>
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center m-4">
        <p className="text-sm font-semibold text-red-700">{error || "Match not found."}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              loadMatch();
            }}
            className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
          <Link href="/live-matches" className="inline-flex items-center text-sm font-semibold text-red-700 hover:text-red-800 underline">
            Browse live matches →
          </Link>
        </div>
      </div>
    </MatchShell>
  );

  const status = sc?.match?.status;
  const isLive = status === "live" || status === "innings_break";

  return (
    <MatchShell status={status}>
      {/* Firecrackers — shown for 24h after match completes */}
      {status === "completed" && <Firecrackers completedAt={sc.match?.completed_at} />}

      {/* Hero — team scores */}
      <MatchHero match={sc.match} innings={sc.innings} result={sc.result} liveState={live} motm={sc.motm} />

      <MatchSnapshotStrip match={sc.match} innings={sc.innings} liveState={live} result={sc.result} />
      <LiveStatusBanner match={sc.match} innings={sc.innings} result={sc.result} liveState={live} />

      {/* Action strip — always visible just below hero */}
      <div className="mb-3 rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Quick Actions</p>
          <p className="text-[10px] text-gray-400">Share, follow, or jump to a section</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
        {/* Share Match — native share sheet on mobile, copy link on desktop */}
        <button
          onClick={async () => {
            const url  = window.location.href;
            const home = sc?.match?.teams?.find((t) => t.role === "home")?.name ?? "";
            const away = sc?.match?.teams?.find((t) => t.role === "away")?.name ?? "";
            const text = home && away ? `${home} vs ${away} — watch live on CricketApp` : "Watch this match on CricketApp";
            if (navigator.share) {
              try { await navigator.share({ title: text, url }); } catch {}
            } else {
              await navigator.clipboard?.writeText(url);
              setShowQR(true);
            }
          }}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>share</span>
          Share Match
        </button>

        {/* QR code */}
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>qr_code</span>
          QR Code
        </button>

        {/* Follow Live PiP */}
        {isLive && pip.supported && (
          <button
            onClick={async () => {
              if (pipOpen) { pip.closePip(); setPipOpen(false); }
              else { await pip.openPip(); setPipOpen(true); }
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition-colors ${
              pipOpen
                ? "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {pipOpen ? "close" : "picture_in_picture"}
            </span>
            {pipOpen ? "Close widget" : "Follow Live"}
          </button>
        )}

        {/* Notify Me */}
        {isLive && (
          <button
            onClick={push.toggle}
            disabled={push.busy || !push.supported}
            title={!push.supported ? "Notifications not supported in this browser" : undefined}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 ${
              push.subscribed
                ? "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {push.subscribed ? "notifications_off" : "notifications"}
            </span>
            {push.busy ? "…" : push.subscribed ? "Mute Alerts" : "Notify Me"}
          </button>
        )}

        {/* Download result card — completed matches */}
        {status === "completed" && sc && (
          <button
            onClick={() => shareResultCard(sc)}
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
            Save Result
          </button>
        )}
        </div>
      </div>

      {/* Live section — always visible when match is live, no tab needed */}
      {isLive && live && (
        <>
          {/* Recent overs scroller */}
          <RecentOvers liveState={live} scorecard={sc} />

          {/* Batsmen + Bowler */}
          <LivePlayersPanel liveState={live} />
        </>
      )}

      {/* Tabs: Scorecard | Commentary | Stats */}
      <div className="sticky top-16 z-20 mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Jump To</p>
        </div>
        <nav className="flex px-2 overflow-x-auto scrollbar-none">
          {[
            { id: "scorecard",  label: "Scorecard", icon: "score" },
            { id: "commentary", label: "Commentary", icon: "chat" },
            { id: "stats",      label: "Stats", icon: "bar_chart" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === "scorecard") setScorecardInn(1); }}
              className={`flex-1 min-w-[100px] py-3.5 px-1 text-center border-b-2 font-bold text-sm transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50/70"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Scorecard tab — always two team sub-tabs */}
      {activeTab === "scorecard" && (() => {
        const teams   = sc?.match?.teams ?? [];
        const innings = sc?.innings ?? [];
        const xi      = sc?.playing_xi ?? {};

        if (teams.length === 0) {
          return (
            <EmptyStateCard
              icon="sports_cricket"
              title="Match hasn&apos;t started yet"
              body="Team scorecards and playing XI will appear here once the toss is complete and the scorecard is published."
            />
          );
        }

        // Ensure scorecardInn maps to a valid team index (1 or 2)
        const teamIdx = scorecardInn <= teams.length ? scorecardInn : 1;
        const activeTeam = teams[teamIdx - 1];

        // Find innings where this team batted
        const teamInnings = innings.filter((i) => i.batting_team === activeTeam?.name);

        return (
          <div>
            {/* Team sub-tabs — always shown */}
            <div className="flex gap-2 mb-4 px-0.5">
              {teams.map((team, idx) => {
                const tabIdx  = idx + 1;
                const active  = tabIdx === teamIdx;
                const teamInn = innings.filter((i) => i.batting_team === team.name);
                const latest  = teamInn[teamInn.length - 1];
                return (
                  <button
                    key={team.id}
                    onClick={() => setScorecardInn(tabIdx)}
                    className={`flex-1 rounded-xl py-2.5 px-2 text-center transition-colors border ${
                      active
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800"
                    }`}
                  >
                    <span className="block text-xs font-bold truncate">{team.name}</span>
                    {latest ? (
                      <span className={`block text-xs tabular-nums mt-0.5 ${active ? "opacity-70" : "text-gray-400"}`}>
                        {latest.total} ({latest.overs} ov)
                      </span>
                    ) : (
                      <span className={`block text-[10px] mt-0.5 ${active ? "opacity-50" : "text-gray-300"}`}>
                        Yet to bat
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content: scorecard if batted, playing XI otherwise */}
            {teamInnings.length > 0 ? (
              teamInnings.map((inn) => (
                <ScorecardTable
                  key={inn.innings_number}
                  battingRows={inn.batting}
                  yetToBat={inn.yet_to_bat}
                  extras={inn.extras}
                  total={inn.total}
                  overs={inn.overs}
                  teamName={inn.batting_team}
                  inningsNum={inn.innings_number}
                  bowlingRows={inn.bowling}
                  fowRows={inn.fall_of_wickets}
                />
              ))
            ) : (
              <PlayingXI players={xi[activeTeam?.id]} teamName={activeTeam?.name} />
            )}
          </div>
        );
      })()}

      {/* Commentary tab */}
      {activeTab === "commentary" && (
        <CommentaryTab scorecard={sc} liveState={live} />
      )}

      {/* Stats tab */}
      {activeTab === "stats" && (
        <StatsTab scorecard={sc} liveState={live} />
      )}

      {/* Match code + realtime status footer */}
      <div className="mt-6 pb-2 text-center">
        <p className="text-xs text-gray-400 font-mono tracking-wider">{code}</p>
        {isLive && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs font-medium text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Realtime updates active
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <QRModal
          url={typeof window !== "undefined" ? window.location.href : ""}
          onClose={() => setShowQR(false)}
        />
      )}
    </MatchShell>
  );
}

