"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Icon } from "@/components/ui/icon";
import { apiRequest } from "@/lib/api";
import { useUser } from "@/lib/user-context";

// ─── Constants ───────────────────────────────────────────────────────────────

const OVER_PRESETS = [5, 10, 15, 20, 35, 50];

const MATCH_TYPES = [
  { id: "T20",    label: "T20",    overs: 20 },
  { id: "ODI",    label: "ODI",    overs: 50 },
  { id: "T10",    label: "T10",    overs: 10 },
  { id: "single_wicket", label: "Single Wicket", overs: null },
  { id: "Custom", label: "Custom", overs: null },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-semibold text-error">{msg}</p>;
}

function StepDot({ n, current }) {
  const done   = n < current;
  const active = n === current;
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all
      ${done   ? "bg-secondary text-white"
      : active ? "bg-primary text-white shadow-[0_0_0_4px_rgba(0,74,198,0.2)]"
      :          "border-2 border-outline-variant bg-white text-outline"}`}
    >
      {done
        ? <Icon name="check" className="text-base" />
        : n}
    </div>
  );
}

function StepBar({ current, total }) {
  const labels = ["Details", "Teams", "Toss", "Confirm"];
  return (
    <div className="border-b border-outline-variant bg-white px-6 py-4">
      <div className="mx-auto flex max-w-lg items-center">
        {labels.map((label, i) => {
          const n = i + 1;
          const last = n === total;
          return (
            <div key={n} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <StepDot n={n} current={current} />
                <span className={`hidden text-xs font-semibold sm:block ${n === current ? "text-primary" : "text-foreground-muted"}`}>
                  {label}
                </span>
              </div>
              {!last && (
                <div className={`mx-1 h-0.5 flex-1 transition-colors ${n < current ? "bg-secondary" : "bg-outline-variant"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 1: Match Details ────────────────────────────────────────────────────

function StepDetails({ data, onChange, errors }) {
  const today = new Date().toISOString().split("T")[0];

  function setOvers(val) {
    const n = parseInt(val, 10);
    onChange("overs", isNaN(n) ? "" : Math.min(50, Math.max(1, n)));
  }

  function pickType(t) {
    onChange("match_type", t.id);
    if (t.overs) onChange("overs", t.overs);
  }

  const isPast = data.date && data.date < today;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Match Details</h2>
        <p className="mt-1 text-sm text-foreground-muted">Name your match and set the basics</p>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">
          Match Title <span className="font-normal text-foreground-muted">(optional — auto-filled from teams)</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="e.g. Panthers vs Stars — Sunday League"
          maxLength={150}
          className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-foreground placeholder-outline outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
        />
        <FieldError msg={errors.title} />
      </div>

      {/* Match type */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Match Format</label>
        <div className="flex flex-wrap gap-2">
          {MATCH_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => pickType(t)}
              className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                data.match_type === t.id
                  ? "border-primary bg-primary-fixed text-primary"
                  : "border-outline-variant bg-white text-foreground-muted hover:border-primary hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overs */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Overs per Innings</label>
        <div className="flex flex-wrap gap-2">
          {OVER_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { onChange("overs", n); onChange("match_type", "Custom"); }}
              className={`rounded-xl border-2 px-4 py-2 font-display text-sm font-bold transition-all ${
                data.overs === n
                  ? "border-primary bg-primary text-white"
                  : "border-outline-variant bg-white text-foreground-muted hover:border-primary hover:text-primary"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <Icon name="timer" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline" />
          <input
            type="number"
            min={1}
            max={50}
            value={data.overs}
            onChange={(e) => setOvers(e.target.value)}
            placeholder="Custom (1–50)"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
          />
        </div>
        <FieldError msg={errors.overs} />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Date</label>
          <div className="relative">
            <Icon name="calendar_today" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline" />
            <input
              type="date"
              value={data.date}
              onChange={(e) => onChange("date", e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
          {isPast && (
            <p className="text-xs text-amber-600 font-semibold">Recording a past match?</p>
          )}
          <FieldError msg={errors.date} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            Start Time <span className="font-normal text-foreground-muted">(optional)</span>
          </label>
          <div className="relative">
            <Icon name="schedule" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline" />
            <input
              type="time"
              value={data.time}
              onChange={(e) => onChange("time", e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Venue */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">
          Venue <span className="font-normal text-foreground-muted">(optional)</span>
        </label>
        <div className="relative">
          <Icon name="location_on" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline" />
          <input
            type="text"
            value={data.venue}
            onChange={(e) => onChange("venue", e.target.value)}
            placeholder="e.g. Iqbal Park, Lahore"
            maxLength={150}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Team lookup card ─────────────────────────────────────────────────────────

function TeamLookup({ role, token, value, onSelect, otherTeamCode, error, setError }) {
  const TEAM_PREFIX = "TEAM-";
  const [input, setInput]     = useState(value?.code || TEAM_PREFIX);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput(value?.code || TEAM_PREFIX);
  }, [value]);

  async function lookup() {
    const code = input.trim().toUpperCase();
    if (!code) return;
    if (code === otherTeamCode) {
      setError("Cannot use the same team for both sides.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/api/teams/${code}`, { token });
      onSelect(data);
    } catch (err) {
      setError(err?.data?.message || "Team not found. Check the code.");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") { e.preventDefault(); lookup(); }
  }

  function handleInputChange(nextValue) {
    const upper = nextValue.toUpperCase();
    const suffix = upper.startsWith(TEAM_PREFIX)
      ? upper.slice(TEAM_PREFIX.length)
      : upper;
    const cleaned = suffix.replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setInput(`${TEAM_PREFIX}${cleaned}`);
    onSelect(null);
    setError("");
  }

  const memberCount = value?.members?.length ?? 0;
  const lowSquad    = value && memberCount < 2;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline" />
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder="TEAM-"
            maxLength={11}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 font-mono text-sm tracking-widest outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={lookup}
          disabled={loading || input.length < 6}
          className="cricket-gradient flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Spinner /> : <Icon name="search" className="text-lg" />}
          Find
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {value && (
        <div className="overflow-hidden rounded-2xl border-2 border-primary bg-primary-fixed">
          <div className="flex items-center gap-4 p-4">
            <div className="cricket-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl">
              🏏
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{value.name}</p>
              <p className="font-mono text-xs text-foreground-muted">{value.code}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">
                {memberCount} players · {value.captain?.name ?? "—"} (Captain)
              </p>
            </div>
            <button
              type="button"
              onClick={() => { onSelect(null); setInput(TEAM_PREFIX); setError(""); }}
              className="rounded-lg p-1.5 text-foreground-muted hover:bg-white/60 hover:text-error"
              title="Remove"
            >
              <Icon name="close" className="text-lg" />
            </button>
          </div>

          {lowSquad && (
            <div className="flex items-center gap-2 border-t border-primary/20 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700">
              <Icon name="warning" className="text-base" />
              This team has fewer than 2 players. You can still create the match, but you'll need enough active players before it can start.
            </div>
          )}

          {value.members && value.members.length > 0 && (
            <div className="border-t border-primary/20 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Squad</p>
              <div className="flex flex-wrap gap-1.5">
                {value.members.slice(0, 5).map((m) => (
                  <span key={m.id} className="rounded-lg border border-outline-variant bg-white px-2 py-0.5 text-xs">
                    {m.display_name}
                  </span>
                ))}
                {value.members.length > 5 && (
                  <span className="rounded-lg bg-surface-container px-2 py-0.5 text-xs text-foreground-muted">
                    +{value.members.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Teams ────────────────────────────────────────────────────────────

function StepTeams({ data, onChange, token, errors, setErrors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Select Teams</h2>
        <p className="mt-1 text-sm text-foreground-muted">Find each team by their TEAM-XXXXXX code</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full cricket-gradient text-xs font-bold text-white">A</div>
          <label className="text-sm font-semibold text-foreground">Home Team</label>
        </div>
        <TeamLookup
          role="home"
          token={token}
          value={data.teamA}
          onSelect={(t) => onChange("teamA", t)}
          otherTeamCode={data.teamB?.code}
          error={errors.teamA}
          setError={(msg) => setErrors((e) => ({ ...e, teamA: msg }))}
        />
      </div>

      {data.teamA && (
        <>
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-outline-variant" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-outline-variant font-display text-sm font-bold text-foreground-muted">
              VS
            </div>
            <div className="flex-1 border-t border-outline-variant" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">B</div>
              <label className="text-sm font-semibold text-foreground">Away Team</label>
            </div>
            <TeamLookup
              role="away"
              token={token}
              value={data.teamB}
              onSelect={(t) => onChange("teamB", t)}
              otherTeamCode={data.teamA?.code}
              error={errors.teamB}
              setError={(msg) => setErrors((e) => ({ ...e, teamB: msg }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 3: Toss ─────────────────────────────────────────────────────────────

function StepToss({ data, onChange, teamA, teamB }) {
  const teams = [
    { team: teamA, role: "home" },
    { team: teamB, role: "away" },
  ];

  const winner  = data.toss_winner_team_id;
  const decision = data.toss_decision;

  // Derive innings order
  let battingFirst = null;
  let bowlingFirst = null;
  if (winner && decision && teamA && teamB) {
    const winnerTeam = [teamA, teamB].find((t) => t.id === winner);
    const loserTeam  = [teamA, teamB].find((t) => t.id !== winner);
    battingFirst = decision === "bat" ? winnerTeam : loserTeam;
    bowlingFirst = decision === "bat" ? loserTeam  : winnerTeam;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Toss Result</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Optional — you can skip and set this before starting the match.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
        <Icon name="info" className="text-lg text-primary" />
        <p className="text-xs text-foreground-muted">
          Toss can be skipped now and recorded later from the match page before you hit <strong>Start Match</strong>.
        </p>
      </div>

      {/* Toss winner */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Who won the toss?</label>
        <div className="grid grid-cols-2 gap-3">
          {teams.map(({ team }) => (
            <button
              key={team.id}
              type="button"
              onClick={() => onChange("toss_winner_team_id", winner === team.id ? null : team.id)}
              className={`rounded-2xl border-2 p-4 text-center transition-all ${
                winner === team.id
                  ? "border-primary bg-primary-fixed"
                  : "border-outline-variant bg-white hover:border-primary"
              }`}
            >
              <div className="mb-2 text-3xl">🏏</div>
              <p className="text-sm font-bold text-foreground">{team.name}</p>
              <p className="font-mono text-xs text-foreground-muted">{team.code}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Toss decision */}
      {winner && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">
            {teams.find(({ team }) => team.id === winner)?.team.name} elected to...
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "bat",  icon: "sports_cricket", label: "BAT", sub: "Batting first" },
              { id: "bowl", icon: "sports_baseball", label: "BOWL", sub: "Bowl / Field first" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange("toss_decision", decision === opt.id ? null : opt.id)}
                className={`rounded-2xl border-2 p-5 text-center transition-all ${
                  decision === opt.id
                    ? "border-primary bg-primary-fixed"
                    : "border-outline-variant bg-white hover:border-primary"
                }`}
              >
                <Icon name={opt.icon} className={`mb-2 text-4xl ${decision === opt.id ? "text-primary" : "text-foreground-muted"}`} />
                <p className="font-display text-base font-bold text-foreground">{opt.label}</p>
                <p className="text-xs text-foreground-muted">{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Innings order preview */}
      {battingFirst && bowlingFirst && (
        <div className="rounded-2xl border border-secondary/30 bg-green-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Innings Order</p>
          <div className="flex items-center gap-3">
            <Icon name="sports_cricket" className="text-lg text-primary" />
            <span className="text-sm font-semibold text-foreground">{battingFirst.name}</span>
            <span className="text-xs rounded-full bg-primary-fixed px-2 py-0.5 text-primary font-semibold">Batting 1st</span>
          </div>
          <div className="flex items-center gap-3">
            <Icon name="sports_baseball" className="text-lg text-secondary" />
            <span className="text-sm font-semibold text-foreground">{bowlingFirst.name}</span>
            <span className="text-xs rounded-full bg-green-100 px-2 py-0.5 text-secondary font-semibold">Bowling 1st</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Confirm ──────────────────────────────────────────────────────────

function StepConfirm({ details, teamA, teamB, toss, matchCode }) {
  const tossWinnerTeam = toss.toss_winner_team_id
    ? [teamA, teamB].find((t) => t.id === toss.toss_winner_team_id)
    : null;

  const tossText = tossWinnerTeam && toss.toss_decision
    ? `${tossWinnerTeam.name} won · ${toss.toss_decision === "bat" ? "Batting" : "Bowling"} first`
    : "Not set — can be recorded before start";

  const displayTitle = details.title.trim()
    || (teamA && teamB ? `${teamA.name} vs ${teamB.name}` : "");

  const dateStr = details.date
    ? new Date(details.date + "T00:00:00").toLocaleDateString("en-PK", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
      })
    : "Not set";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Confirm Match</h2>
        <p className="mt-1 text-sm text-foreground-muted">Review everything before creating</p>
      </div>

      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
        <div className="cricket-gradient p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-lg bg-white/20 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-white">
              {matchCode || "MATCH-??????"}
            </span>
            <span className="text-xs text-white/70">
              {details.match_type} · {details.overs} Overs
            </span>
          </div>
          <p className="mb-4 font-display text-lg font-bold text-white">{displayTitle}</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-3xl mb-1">🏏</div>
              <p className="text-sm font-bold text-white">{teamA?.name ?? "—"}</p>
              <p className="text-xs text-white/60">Home</p>
            </div>
            <div className="font-display text-2xl font-bold text-white">VS</div>
            <div className="text-center">
              <div className="text-3xl mb-1">🏏</div>
              <p className="text-sm font-bold text-white">{teamB?.name ?? "—"}</p>
              <p className="text-xs text-white/60">Away</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-outline-variant">
          {[
            { icon: "calendar_today", label: "Date",    value: dateStr },
            { icon: "schedule",       label: "Time",    value: details.time || "Not set" },
            { icon: "location_on",    label: "Venue",   value: details.venue || "Not set" },
            { icon: "sports_cricket", label: "Toss",    value: tossText },
            { icon: "timer",          label: "Overs",   value: `${details.overs} overs per innings` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span className="flex items-center gap-2 text-sm text-foreground-muted">
                <Icon name={icon} className="text-lg text-outline" />
                {label}
              </span>
              <span className="text-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Public code note */}
      <div className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <Icon name="share" className="mt-0.5 text-xl text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Anyone can watch via match code</p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            A unique <span className="font-mono font-bold">MATCH-XXXXXX</span> code is generated. Share it and anyone can view the live scoreboard — no login needed.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

function initDetails() {
  return {
    title:      "",
    match_type: "T20",
    overs:      20,
    date:       new Date().toISOString().split("T")[0],
    time:       "",
    venue:      "",
  };
}

function initToss() {
  return { toss_winner_team_id: null, toss_decision: null };
}

export default function CreateMatchPage() {
  const { token } = useUser();
  const router    = useRouter();

  const [step,    setStep]    = useState(1);
  const [details, setDetails] = useState(initDetails);
  const [teamA,   setTeamA]   = useState(null);
  const [teamB,   setTeamB]   = useState(null);
  const [toss,    setToss]    = useState(initToss);
  const [errors,  setErrors]  = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState("");

  // details updater
  const updateDetail = useCallback((key, val) => {
    setDetails((d) => ({ ...d, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }, []);

  // toss updater
  const updateToss = useCallback((key, val) => {
    setToss((t) => ({ ...t, [key]: val }));
  }, []);

  // ── Validation per step ──────────────────────────────────────────────────
  function validateStep() {
    const errs = {};

    if (step === 1) {
      if (!details.date) errs.date = "Date is required.";
      if (!details.overs || details.overs < 1 || details.overs > 50)
        errs.overs = "Overs must be between 1 and 50.";
    }

    if (step === 2) {
      if (!teamA) errs.teamA = "Please select a home team.";
      if (!teamB) errs.teamB = "Please select an away team.";
      if (teamA && teamB && teamA.id === teamB.id)
        errs.teamB = "Home and away teams must be different.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  function goNext() {
    if (!validateStep()) return;
    setApiError("");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setApiError("");
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!validateStep()) return;
    setSubmitting(true);
    setApiError("");

    try {
      // 1. Create match
      const dateVal = details.time
        ? `${details.date} ${details.time}:00`
        : details.date;

      const title = details.title.trim() || `${teamA.name} vs ${teamB.name}`;

      const match = await apiRequest("/api/matches", {
        method: "POST",
        token,
        body: {
          title,
          venue:       details.venue.trim() || null,
          date:        dateVal,
          overs_limit: details.overs,
          match_type:  details.match_type,
        },
      });

      // 2. Attach teams
      await apiRequest(`/api/matches/${match.code}/teams`, {
        method: "POST",
        token,
        body: { team_code: teamA.code, role: "home" },
      });

      await apiRequest(`/api/matches/${match.code}/teams`, {
        method: "POST",
        token,
        body: { team_code: teamB.code, role: "away" },
      });

      // 3. Set toss (optional)
      if (toss.toss_winner_team_id && toss.toss_decision) {
        await apiRequest(`/api/matches/${match.code}/toss`, {
          method: "POST",
          token,
          body: {
            toss_winner_team_id: toss.toss_winner_team_id,
            toss_decision:       toss.toss_decision,
          },
        });
      }

      router.push("/my-matches");
    } catch (err) {
      setApiError(err?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canProceedStep2 = step === 2 && teamA && teamB;
  const isLastStep      = step === TOTAL_STEPS;

  return (
    <AppShell
      title="Create Match"
      subtitle={`Step ${step} of ${TOTAL_STEPS}`}
      action={
        <Link
          href="/my-matches"
          className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold text-foreground-muted hover:bg-surface-container transition-colors"
        >
          <Icon name="close" className="text-lg" />
          Cancel
        </Link>
      }
    >
      {/* Step progress bar — bleeds to content edge */}
      <div className="-mx-4 -mt-4 mb-6 md:-mx-6">
        <StepBar current={step} total={TOTAL_STEPS} />
      </div>

      <div className="mx-auto max-w-lg">
        {/* Step content */}
        {step === 1 && (
          <StepDetails
            data={details}
            onChange={updateDetail}
            errors={errors}
          />
        )}

        {step === 2 && (
          <StepTeams
            data={{ teamA, teamB }}
            onChange={(key, val) => { key === "teamA" ? setTeamA(val) : setTeamB(val); }}
            token={token}
            errors={errors}
            setErrors={setErrors}
          />
        )}

        {step === 3 && (
          <StepToss
            data={toss}
            onChange={updateToss}
            teamA={teamA}
            teamB={teamB}
          />
        )}

        {step === 4 && (
          <StepConfirm
            details={details}
            teamA={teamA}
            teamB={teamB}
            toss={toss}
          />
        )}

        {/* API error */}
        {apiError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className="flex-1 rounded-xl border border-outline-variant py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              ← Back
            </button>
          )}

          {/* Step 3 skip */}
          {step === 3 && (
            <button
              type="button"
              onClick={() => { setToss(initToss()); goNext(); }}
              className="rounded-xl border border-outline-variant px-4 py-3.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-container"
            >
              Skip
            </button>
          )}

          <button
            type="button"
            onClick={isLastStep ? handleCreate : goNext}
            disabled={submitting || (step === 2 && (!teamA || !teamB))}
            className="cricket-gradient flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? (
              <><Spinner /> Creating…</>
            ) : isLastStep ? (
              "🎉 Create Match"
            ) : (
              "Continue →"
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
