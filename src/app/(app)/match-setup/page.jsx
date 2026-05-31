"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Icon } from "@/components/ui/icon";
import { apiRequest } from "@/lib/api";
import { useUser } from "@/lib/user-context";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Spinner({ size = "sm" }) {
  const cls = size === "lg"
    ? "h-8 w-8 border-4"
    : "h-4 w-4 border-2";
  return (
    <span className={`inline-block animate-spin rounded-full border-current border-t-transparent ${cls}`} />
  );
}

function Check({ done }) {
  return done ? (
    <Icon name="check_circle" className="text-xl text-secondary" />
    
  ) : (
    <Icon name="radio_button_unchecked" className="text-xl text-outline" />
  );
}

function SectionHeader({ icon, title, done, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white">
      <div className={`flex items-center gap-3 border-b px-5 py-4 ${done ? "border-secondary/20 bg-green-50" : "border-outline-variant"}`}>
        <Icon name={icon} className="text-xl text-primary" />
        <h3 className="flex-1 font-display text-base font-bold text-foreground">{title}</h3>
        <Check done={done} />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Toss section ─────────────────────────────────────────────────────────────

function TossSection({ match, token, onUpdated }) {
  const teams = match.match_teams ?? [];
  const [winnerId,  setWinnerId]  = useState(match.toss_winner_team_id ?? null);
  const [decision,  setDecision]  = useState(match.toss_decision ?? null);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [saved,     setSaved]     = useState(false);

  const done = !!(match.toss_winner_team_id && match.toss_decision);

  async function save() {
    if (!winnerId || !decision) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      const updated = await apiRequest(`/api/matches/${match.code}/toss`, {
        method: "POST", token,
        body: { toss_winner_team_id: winnerId, toss_decision: decision },
      });
      setSaved(true);
      onUpdated(updated);
    } catch (err) {
      setError(err?.data?.message || "Could not save toss.");
    } finally {
      setSaving(false);
    }
  }

  const winnerTeam = teams.find((mt) => mt.team.id === winnerId)?.team;
  const loserTeam  = teams.find((mt) => mt.team.id !== winnerId)?.team;
  const battingFirst = winnerTeam && decision
    ? (decision === "bat" ? winnerTeam : loserTeam)
    : null;
  const bowlingFirst = battingFirst && winnerTeam && loserTeam
    ? (battingFirst.id === winnerTeam.id ? loserTeam : winnerTeam)
    : null;

  return (
    <SectionHeader icon="sports_cricket" title="Toss Result" done={done}>
      <div className="space-y-4">
        {/* Toss winner */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Who won the toss?</p>
          <div className="grid grid-cols-2 gap-3">
            {teams.map((mt) => (
              <button
                key={mt.team.id}
                type="button"
                onClick={() => { setWinnerId(mt.team.id); setSaved(false); }}
                className={`rounded-2xl border-2 p-4 text-center transition-all ${
                  winnerId === mt.team.id
                    ? "border-primary bg-primary-fixed"
                    : "border-outline-variant bg-white hover:border-primary"
                }`}
              >
                <p className="font-bold text-foreground text-sm">{mt.team.name}</p>
                <p className="font-mono text-xs text-foreground-muted mt-1">{mt.role}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Toss decision */}
        {winnerId && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {winnerTeam?.name} elected to…
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "bat",  icon: "sports_cricket",  label: "BAT",  sub: "Batting first" },
                { id: "bowl", icon: "sports_baseball",  label: "BOWL", sub: "Bowl / Field first" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setDecision(opt.id); setSaved(false); }}
                  className={`rounded-2xl border-2 p-4 text-center transition-all ${
                    decision === opt.id
                      ? "border-primary bg-primary-fixed"
                      : "border-outline-variant bg-white hover:border-primary"
                  }`}
                >
                  <Icon name={opt.icon} className={`mb-1 text-3xl ${decision === opt.id ? "text-primary" : "text-foreground-muted"}`} />
                  <p className="font-display font-bold text-foreground text-sm">{opt.label}</p>
                  <p className="text-xs text-foreground-muted">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Innings preview */}
        {battingFirst && bowlingFirst && (
          <div className="rounded-xl border border-secondary/20 bg-green-50 p-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Innings Order</p>
            <div className="flex items-center gap-2 text-sm">
              <Icon name="sports_cricket" className="text-base text-primary" />
              <span className="font-semibold text-foreground">{battingFirst.name}</span>
              <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-semibold text-primary">Bat 1st</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Icon name="sports_baseball" className="text-base text-secondary" />
              <span className="font-semibold text-foreground">{bowlingFirst.name}</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-secondary">Bowl 1st</span>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-error font-semibold">{error}</p>}

        {winnerId && decision && !saved && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="cricket-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Spinner /> : null}
            Save Toss
          </button>
        )}
        {saved && (
          <p className="text-sm font-semibold text-secondary flex items-center gap-1">
            <Icon name="check_circle" className="text-base" />
            Toss saved
          </p>
        )}
      </div>
    </SectionHeader>
  );
}

// ─── Playing XI section (per team) ───────────────────────────────────────────

const PLAYER_TYPE_ICON = {
  batter:               "🏏",
  bowler:               "🎯",
  all_rounder:          "⚡",
  wicket_keeper:        "🧤",
  wicket_keeper_batter: "🧤",
};

function PlayerRow({ member, selected, onToggle, isSub, onSubToggle }) {
  const typeIcon = PLAYER_TYPE_ICON[member.player_type] ?? "👤";
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all cursor-pointer select-none ${
        selected
          ? isSub
            ? "border-amber-300 bg-amber-50"
            : "border-primary bg-primary-fixed"
          : "border-outline-variant bg-white hover:border-primary/50"
      }`}
      onClick={() => onToggle(member.id)}
    >
      {/* Avatar / emoji */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl cricket-gradient text-base font-bold text-white">
        {member.user?.avatar_url
          ? <img src={member.user.avatar_url} alt={member.display_name} className="h-9 w-9 rounded-xl object-cover" />
          : member.avatar_emoji || member.display_name?.[0]?.toUpperCase() || "?"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{member.display_name}</p>
        <p className="text-xs text-foreground-muted">{typeIcon} {member.player_type?.replace(/_/g, " ") ?? "Player"}</p>
      </div>

      {selected && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSubToggle(member.id); }}
          title={isSub ? "Mark as playing" : "Mark as substitute"}
          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold transition-colors ${
            isSub
              ? "bg-amber-200 text-amber-800 hover:bg-amber-300"
              : "bg-surface-container text-foreground-muted hover:bg-amber-100 hover:text-amber-700"
          }`}
        >
          {isSub ? "Sub" : "In"}
        </button>
      )}

      <div className={`h-5 w-5 shrink-0 rounded-full border-2 transition-all ${
        selected ? "border-primary bg-primary" : "border-outline-variant"
      }`}>
        {selected && (
          <Icon name="check" className="flex h-full items-center justify-center text-xs text-white" />
        )}
      </div>
    </div>
  );
}

function PlayingXISection({ match, matchTeam, token, onUpdated }) {
  const team    = matchTeam.team;
  const members = team.members ?? [];

  // Build initial state from existing match players
  const existingForTeam = (match.players ?? []).filter((p) => p.team_id === team.id);
  const initSelected = new Set(existingForTeam.map((p) => p.team_member_id));
  const initSubs     = new Set(existingForTeam.filter((p) => p.is_substitute).map((p) => p.team_member_id));

  const [selected, setSelected] = useState(initSelected);
  const [subs,     setSubs]     = useState(initSubs);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [saved,    setSaved]    = useState(existingForTeam.length > 0);

  const activeCount = [...selected].filter((id) => !subs.has(id)).length;
  const subCount = [...selected].filter((id) =>  subs.has(id)).length;
  const done     = activeCount > 0;

  function toggleSelect(memberId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
        setSubs((s) => { const ns = new Set(s); ns.delete(memberId); return ns; });
      } else {
        next.add(memberId);
      }
      setSaved(false);
      return next;
    });
  }

  function toggleSub(memberId) {
    setSubs((prev) => {
      const next = new Set(prev);
      next.has(memberId) ? next.delete(memberId) : next.add(memberId);
      setSaved(false);
      return next;
    });
  }

  async function save() {
    if (selected.size === 0) return;
    setSaving(true); setError("");
    try {
      const players = [...selected].map((memberId) => ({
        team_member_id: memberId,
        is_substitute:  subs.has(memberId),
      }));
      await apiRequest(`/api/matches/${match.code}/teams/${team.id}/players`, {
        method: "POST", token,
        body: { players },
      });
      setSaved(true);
      onUpdated();
    } catch (err) {
      setError(err?.data?.message || "Could not save squad.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionHeader
      icon="groups"
      title={`${team.name} — Playing Squad`}
      done={done && saved}
    >
      <div className="space-y-3">
        {/* Counter */}
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            activeCount > 0 ? "bg-green-100 text-secondary" : "bg-primary-fixed text-primary"
          }`}>
            {activeCount} active selected
          </span>
          {subCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              +{subCount} sub{subCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-foreground-muted">This team has no squad members yet.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {members.map((m) => (
              <PlayerRow
                key={m.id}
                member={m}
                selected={selected.has(m.id)}
                onToggle={toggleSelect}
                isSub={subs.has(m.id)}
                onSubToggle={toggleSub}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-foreground-muted">
          Tap a player to select. Tap <strong>Sub</strong> badge to mark as substitute.
        </p>

        {error && <p className="text-xs text-error font-semibold">{error}</p>}

        {!saved && (
          <button
            type="button"
            onClick={save}
            disabled={saving || selected.size === 0}
            className="cricket-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Spinner /> : null}
            Save Squad
          </button>
        )}
        {saved && (
          <p className="text-sm font-semibold text-secondary flex items-center gap-1">
            <Icon name="check_circle" className="text-base" />
            Squad saved
          </p>
        )}
      </div>
    </SectionHeader>
  );
}

// ─── Match details section ────────────────────────────────────────────────────

function DetailsSection({ match, token, onUpdated }) {
  const [title,  setTitle]  = useState(match.title ?? "");
  const [venue,  setVenue]  = useState(match.venue ?? "");
  const [date,   setDate]   = useState(match.date ? match.date.split("T")[0] : "");
  const [overs,  setOvers]  = useState(match.overs_limit ?? 20);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [saved,  setSaved]  = useState(true);

  async function save() {
    setSaving(true); setError("");
    try {
      const updated = await apiRequest(`/api/matches/${match.code}`, {
        method: "PATCH", token,
        body: { title, venue: venue || null, date, overs_limit: Number(overs) },
      });
      setSaved(true);
      onUpdated(updated);
    } catch (err) {
      setError(err?.data?.message || "Could not save details.");
    } finally {
      setSaving(false);
    }
  }

  function markDirty() { setSaved(false); }

  return (
    <SectionHeader icon="edit_note" title="Match Details" done={true}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            maxLength={150}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); markDirty(); }}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Overs</label>
            <input
              type="number"
              min={1}
              max={50}
              value={overs}
              onChange={(e) => { setOvers(e.target.value); markDirty(); }}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Venue</label>
          <input
            type="text"
            value={venue}
            onChange={(e) => { setVenue(e.target.value); markDirty(); }}
            placeholder="e.g. Iqbal Park, Lahore"
            maxLength={150}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="text-xs text-error font-semibold">{error}</p>}

        {!saved && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-container transition-colors disabled:opacity-60"
          >
            {saving ? <Spinner /> : null}
            Save Changes
          </button>
        )}
      </div>
    </SectionHeader>
  );
}

// ─── Readiness checklist ──────────────────────────────────────────────────────

function ReadinessBar({ match, teamADone, teamBDone }) {
  const tossDone = !!(match.toss_winner_team_id && match.toss_decision);
  const items = [
    { label: "Toss recorded",         done: tossDone },
    { label: "Home squad saved",      done: teamADone },
    { label: "Away squad saved",      done: teamBDone },
  ];
  const allDone = items.every((i) => i.done);

  return (
    <div className={`overflow-hidden rounded-2xl border-2 ${allDone ? "border-secondary bg-green-50" : "border-outline-variant bg-white"}`}>
      <div className="px-5 py-4">
        <p className="font-display text-base font-bold text-foreground mb-3">
          {allDone ? "Ready to Start" : "Pre-match Checklist"}
        </p>
        <div className="space-y-2">
          {items.map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon name={done ? "check_circle" : "radio_button_unchecked"} className={`text-lg ${done ? "text-secondary" : "text-outline"}`} />
              <span className={`text-sm font-semibold ${done ? "text-foreground" : "text-foreground-muted"}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MatchSetupPage() {
  const { token, user } = useUser();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const code         = searchParams.get("code");

  const [match,    setMatch]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [starting, setStarting] = useState(false);
  const [startErr, setStartErr] = useState("");

  // Track squad confirmation per team locally (re-derived on load)
  const [xiDone, setXiDone] = useState({});

  const loadMatch = useCallback(async () => {
    if (!code || !token) return;
    try {
      const data = await apiRequest(`/api/matches/${code}`, { token });
      setMatch(data);

      // Derive which teams already have at least one active player selected
      const done = {};
      for (const mt of data.match_teams ?? []) {
        const xi = (data.players ?? []).filter(
          (p) => p.team_id === mt.team.id && !p.is_substitute
        ).length;
        done[mt.team.id] = xi > 0;
      }
      setXiDone(done);
    } catch (err) {
      setError(err?.data?.message || "Match not found.");
    } finally {
      setLoading(false);
    }
  }, [code, token]);

  useEffect(() => { loadMatch(); }, [loadMatch]);

  async function startMatch() {
    setStarting(true); setStartErr("");
    try {
      await apiRequest(`/api/matches/${match.code}/start`, { method: "POST", token });
      router.push(`/live-scoring?code=${code}`);
    } catch (err) {
      setStartErr(err?.data?.message || "Could not start match.");
      setStarting(false);
    }
  }

  if (!code) {
    return (
      <AppShell title="Match Setup">
        <p className="text-foreground-muted">No match code provided.</p>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="Match Setup">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Match Setup">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </AppShell>
    );
  }

  const matchTeams = match.match_teams ?? [];
  const teamA = matchTeams.find((mt) => mt.role === "home") ?? matchTeams[0];
  const teamB = matchTeams.find((mt) => mt.role === "away") ?? matchTeams[1];

  const tossDone  = !!(match.toss_winner_team_id && match.toss_decision);
  const teamADone = teamA ? (xiDone[teamA.team.id] ?? false) : false;
  const teamBDone = teamB ? (xiDone[teamB.team.id] ?? false) : false;
  const allReady  = tossDone && teamADone && teamBDone;

  const isCreator = match.created_by === user?.id;

  return (
    <AppShell
      title="Match Setup"
      subtitle={match.title}
      action={
        <Link
          href="/my-matches"
          className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold text-foreground-muted hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" className="text-lg" />
          My Matches
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl space-y-5">

        {/* Match code */}
        <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
          <span className="text-sm text-foreground-muted">Match code</span>
          <span className="font-mono text-sm font-bold text-primary tracking-wider">{match.code}</span>
        </div>

        {/* Readiness checklist */}
        <ReadinessBar match={match} teamADone={teamADone} teamBDone={teamBDone} />

        {/* Match Details — always editable until started */}
        {isCreator && (
          <DetailsSection
            match={match}
            token={token}
            onUpdated={(updated) => setMatch((prev) => ({ ...prev, ...updated }))}
          />
        )}

        {/* Toss */}
        {isCreator && (
          <TossSection
            match={match}
            token={token}
            onUpdated={(updated) => setMatch((prev) => ({ ...prev, ...updated }))}
          />
        )}

        {/* Playing squads */}
        {teamA && (
          <PlayingXISection
            key={`xi-${teamA.team.id}`}
            match={match}
            matchTeam={teamA}
            token={token}
            onUpdated={() => {
              setXiDone((prev) => ({ ...prev, [teamA.team.id]: true }));
            }}
          />
        )}
        {teamB && (
          <PlayingXISection
            key={`xi-${teamB.team.id}`}
            match={match}
            matchTeam={teamB}
            token={token}
            onUpdated={() => {
              setXiDone((prev) => ({ ...prev, [teamB.team.id]: true }));
            }}
          />
        )}

        {/* Start Match */}
        {isCreator && (
          <div className="rounded-2xl border border-outline-variant bg-white p-5">
            <h3 className="mb-1 font-display text-base font-bold text-foreground">Start Match</h3>
            <p className="mb-4 text-xs text-foreground-muted">
              Once started, match details cannot be edited. The scorer lock system will activate immediately.
            </p>

            {!allReady && (
              <p className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                <Icon name="warning" className="text-lg" />
                Complete the checklist above before starting.
              </p>
            )}

            {startErr && (
              <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{startErr}</p>
            )}

            <button
              type="button"
              onClick={startMatch}
              disabled={!allReady || starting}
              className="cricket-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {starting ? <Spinner /> : <Icon name="sports_cricket" className="text-lg" />}
              {starting ? "Starting…" : "Start Match"}
            </button>
          </div>
        )}

        {!isCreator && (
          <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
            <Icon name="info" className="text-lg text-outline" />
            <p className="text-sm text-foreground-muted">Only the match creator can start the match.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
