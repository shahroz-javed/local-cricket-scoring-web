"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { apiRequest } from "@/lib/api";
import { useUser } from "@/lib/user-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

function PageSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-10" />
        <span className="absolute h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/40" />
        <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>sports_cricket</span>
      </div>
      <p className="text-sm text-foreground-muted">Loading match…</p>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const STATUS_CONFIG = {
  upcoming:      { label: "Upcoming",       color: "bg-primary-fixed text-primary",           icon: "schedule" },
  live:          { label: "Live",           color: "bg-tertiary text-white",                  icon: "sports_cricket" },
  innings_break: { label: "Innings Break",  color: "bg-amber-100 text-amber-700",              icon: "pause_circle" },
  completed:     { label: "Completed",      color: "bg-green-100 text-secondary",             icon: "check_circle" },
  abandoned:     { label: "Abandoned",      color: "bg-surface-container text-foreground-muted", icon: "cancel" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.upcoming;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cfg.color}`}>
      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── Man of the Match modal ───────────────────────────────────────────────────

function MotmModal({ match, token, onClose, onSaved }) {
  const [selected, setSelected] = useState(match.motm_player_id ?? null);
  const [saving,   setSaving]   = useState(false);

  const teamNameMap = (match.match_teams ?? []).reduce((acc, mt) => {
    acc[mt.team_id] = mt.team?.name ?? "";
    return acc;
  }, {});

  const players = (match.players ?? [])
    .filter((p) => !p.is_substitute)
    .map((p) => ({ id: p.id, name: p.display_name, team: teamNameMap[p.team_id] ?? "" }));

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      await apiRequest(`/api/matches/${match.code}/motm`, {
        method: "POST", token,
        body: { match_player_id: selected },
      });
      toast.success("Man of the match set!");
      onSaved(selected);
    } catch (err) {
      toast.error(err?.data?.message || "Could not set MOTM.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface shadow-2xl overflow-hidden">
        <div className="cricket-gradient px-5 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Man of the Match</h3>
            <p className="text-xs text-white/70">Select the standout performer</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-xl p-1.5 text-white/70 hover:bg-white/10">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/30">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                selected === p.id ? "bg-primary/10" : "hover:bg-surface-container"
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                selected === p.id ? "bg-primary text-white" : "bg-surface-container text-foreground-muted"
              }`}>
                {selected === p.id
                  ? <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  : p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                <p className="text-xs text-foreground-muted truncate">{p.team}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3 p-4 border-t border-outline-variant">
          <button onClick={onClose} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!selected || saving}
            className="flex-1 rounded-xl cricket-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Spinner /> : "Announce"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule modal ─────────────────────────────────────────────────────────

function RescheduleModal({ match, token, onClose, onSaved }) {
  const [date,  setDate]  = useState(match.date?.split("T")[0] ?? "");
  const [venue, setVenue] = useState(match.venue ?? "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function save() {
    if (!date) { setError("Date is required."); return; }
    setSaving(true); setError("");
    try {
      const updated = await apiRequest(`/api/matches/${match.code}/reschedule`, {
        method: "POST", token,
        body: { date, venue: venue || null },
      });
      onSaved(updated);
    } catch (err) {
      setError(err?.data?.message || "Could not reschedule.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-foreground">Reschedule Match</h3>
          <button onClick={onClose} className="rounded-xl p-1.5 text-foreground-muted hover:bg-surface-container">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">New Date</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">calendar_today</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Venue <span className="font-normal text-foreground-muted">(optional)</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">location_on</span>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Iqbal Park, Lahore"
                maxLength={150}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          {error && <p className="text-xs font-semibold text-error">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 rounded-xl border border-outline-variant py-3 text-sm font-semibold text-foreground hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="cricket-gradient flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? <Spinner /> : null}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm action modal (abandon / delete) ──────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-white p-6 shadow-2xl">
        <div className={`mb-1 flex items-center gap-2 font-display text-lg font-bold ${danger ? "text-error" : "text-foreground"}`}>
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {danger ? "warning" : "info"}
          </span>
          {title}
        </div>
        <p className="mb-5 text-sm text-foreground-muted">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 rounded-xl border border-outline-variant py-3 text-sm font-semibold text-foreground hover:bg-surface-container transition-colors">
            Keep Match
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60 ${
              danger ? "bg-error hover:bg-red-700" : "cricket-gradient"
            }`}
          >
            {loading ? <Spinner /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MatchDetailPage() {
  const { token, user } = useUser();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const code         = searchParams.get("code");

  const [match,    setMatch]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [modal,    setModal]    = useState(null); // "reschedule" | "abandon" | "delete"
  const [acting,   setActing]   = useState(false);

  const load = useCallback(async () => {
    if (!code || !token) return;
    try {
      const data = await apiRequest(`/api/matches/${code}`, { token });
      setMatch(data);
    } catch (err) {
      setError(err?.data?.message || "Match not found.");
    } finally {
      setLoading(false);
    }
  }, [code, token]);

  useEffect(() => { load(); }, [load]);

  async function doAbandon() {
    setActing(true);
    try {
      const updated = await apiRequest(`/api/matches/${match.code}/abandon`, { method: "POST", token });
      setMatch((prev) => ({ ...prev, ...updated }));
      setModal(null);
    } catch (err) {
      toast.error(err?.data?.message || "Could not abandon match.");
    } finally {
      setActing(false);
    }
  }

  async function doDelete() {
    setActing(true);
    try {
      await apiRequest(`/api/matches/${match.code}`, { method: "DELETE", token });
      router.replace("/my-matches");
    } catch (err) {
      toast.error(err?.data?.message || "Could not delete match.");
      setActing(false);
    }
  }

  if (!code) return <AppShell title="Match Detail"><p className="text-foreground-muted">No match code provided.</p></AppShell>;
  if (loading) return <AppShell title="Match Detail"><PageSpinner /></AppShell>;
  if (error)   return <AppShell title="Match Detail"><p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p></AppShell>;

  const isCreator   = match.created_by === user?.id;
  const isCaptain   = (match.match_teams ?? []).some((mt) => mt.team?.captain_user_id === user?.id);
  const canManage   = isCreator || isCaptain;

  // Determine winning team from innings to restrict MOTM button to winning captain
  const inn1 = (match.innings ?? []).find((i) => i.innings_number === 1);
  const inn2 = (match.innings ?? []).find((i) => i.innings_number === 2);
  let winnerTeamId = null;
  if (inn1 && inn2) {
    if (inn2.total_runs > inn1.total_runs)      winnerTeamId = inn2.batting_team_id;
    else if (inn1.total_runs > inn2.total_runs) winnerTeamId = inn1.batting_team_id;
  }
  const isWinningCaptain = winnerTeamId
    ? (match.match_teams ?? []).some((mt) => mt.team_id === winnerTeamId && mt.team?.captain_user_id === user?.id)
    : isCaptain;
  const canSetMotm = isCreator || isWinningCaptain;
  const isUpcoming  = match.status === "upcoming";
  const isLive      = match.status === "live" || match.status === "innings_break";
  const isOver      = match.status === "completed" || match.status === "abandoned";
  const isCompleted = match.status === "completed";
  const matchTeams  = match.match_teams ?? [];
  const home        = matchTeams.find((mt) => mt.role === "home");
  const away        = matchTeams.find((mt) => mt.role === "away");

  return (
    <AppShell
      title="Match Detail"
      subtitle={match.title}
      action={
        <Link href="/my-matches" className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold text-foreground-muted hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          My Matches
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl space-y-5">

        {/* Hero card */}
        <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
          <div className="cricket-gradient p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-lg bg-white/20 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-white">
                {match.code}
              </span>
              {match.overs_limit && (
                <span className="text-xs text-white/70">{match.overs_limit} overs</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="mb-1 text-3xl">🏏</div>
                <p className="text-sm font-bold text-white">{home?.team?.name ?? "TBD"}</p>
                <p className="text-xs text-white/60">Home</p>
              </div>
              <div className="font-display text-2xl font-bold text-white">VS</div>
              <div className="text-center">
                <div className="mb-1 text-3xl">🏏</div>
                <p className="text-sm font-bold text-white">{away?.team?.name ?? "TBD"}</p>
                <p className="text-xs text-white/60">Away</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-outline-variant">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="flex items-center gap-2 text-sm text-foreground-muted">
                <span className="material-symbols-outlined text-lg text-outline">info</span>
                Status
              </span>
              <StatusBadge status={match.status} />
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="flex items-center gap-2 text-sm text-foreground-muted">
                <span className="material-symbols-outlined text-lg text-outline">calendar_today</span>
                Date
              </span>
              <span className="text-sm font-semibold text-foreground">{formatDate(match.date)}</span>
            </div>
            {match.venue && (
              <div className="flex items-center justify-between px-5 py-3">
                <span className="flex items-center gap-2 text-sm text-foreground-muted">
                  <span className="material-symbols-outlined text-lg text-outline">location_on</span>
                  Venue
                </span>
                <span className="text-sm font-semibold text-foreground">{match.venue}</span>
              </div>
            )}
            {match.toss_winner_team_id && (
              <div className="flex items-center justify-between px-5 py-3">
                <span className="flex items-center gap-2 text-sm text-foreground-muted">
                  <span className="material-symbols-outlined text-lg text-outline">sports_cricket</span>
                  Toss
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {match.toss_winner?.name} won · {match.toss_decision === "bat" ? "Batting" : "Bowling"} first
                </span>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="flex items-center gap-2 text-sm text-foreground-muted">
                <span className="material-symbols-outlined text-lg text-outline">person</span>
                Created by
              </span>
              <span className="text-sm font-semibold text-foreground">{match.creator?.name ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Teams */}
        {matchTeams.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white">
            <div className="border-b border-outline-variant px-5 py-4">
              <h3 className="font-display text-base font-bold text-foreground">Teams</h3>
            </div>
            <div className="divide-y divide-outline-variant">
              {matchTeams.map((mt) => (
                <div key={mt.team.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl cricket-gradient text-lg">🏏</div>
                    <div>
                      <p className="font-semibold text-foreground">{mt.team.name}</p>
                      <p className="font-mono text-xs text-foreground-muted">{mt.team.code}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                    mt.role === "home" ? "bg-primary-fixed text-primary" : "bg-green-100 text-secondary"
                  }`}>
                    {mt.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions — creator or captain */}
        {canManage && (
          <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white">
            <div className="border-b border-outline-variant px-5 py-4">
              <h3 className="font-display text-base font-bold text-foreground">Actions</h3>
            </div>
            <div className="p-4 space-y-3">

              {/* Setup & Start — upcoming only */}
              {isUpcoming && (
                <Link
                  href={`/match-setup?code=${match.code}`}
                  className="cricket-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  Setup & Start Match
                </Link>
              )}

              {/* Score — live */}
              {isLive && (
                <Link
                  href={`/live-scoring?code=${match.code}`}
                  className="cricket-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-lg">sports_cricket</span>
                  Continue Scoring
                </Link>
              )}

              {/* Scorecard — completed / abandoned */}
              {isOver && (
                <Link
                  href={`/matches/${match.code}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-lg">bar_chart</span>
                  View Full Scorecard
                </Link>
              )}

              {/* Man of the Match — completed, winning captain or creator only */}
              {isCompleted && canSetMotm && (
                <button
                  type="button"
                  onClick={() => setModal("motm")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                >
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                  {match.motm_player_id ? "Change Man of the Match" : "Set Man of the Match"}
                </button>
              )}

              {/* Reschedule — upcoming or abandoned */}
              {(isUpcoming || match.status === "abandoned") && (
                <button
                  type="button"
                  onClick={() => setModal("reschedule")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-lg">edit_calendar</span>
                  {match.status === "abandoned" ? "Reschedule (Reopen)" : "Reschedule"}
                </button>
              )}

              {/* Abandon — upcoming or live */}
              {!isOver && (
                <button
                  type="button"
                  onClick={() => setModal("abandon")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                >
                  <span className="material-symbols-outlined text-lg">block</span>
                  {isUpcoming ? "Cancel Match" : "Abandon Match"}
                </button>
              )}

              {/* Delete — cannot delete live match */}
              {!isLive && (
                <button
                  type="button"
                  onClick={() => setModal("delete")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-error transition-colors hover:bg-red-100"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Delete Match
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "motm" && (
        <MotmModal
          match={match}
          token={token}
          onClose={() => setModal(null)}
          onSaved={(playerId) => { setMatch((prev) => ({ ...prev, motm_player_id: playerId })); setModal(null); }}
        />
      )}

      {modal === "reschedule" && (
        <RescheduleModal
          match={match}
          token={token}
          onClose={() => setModal(null)}
          onSaved={(updated) => { setMatch((prev) => ({ ...prev, ...updated })); setModal(null); }}
        />
      )}

      {modal === "abandon" && (
        <ConfirmModal
          title={isUpcoming ? "Cancel Match?" : "Abandon Match?"}
          message={
            isUpcoming
              ? "This will cancel the match. Players will be notified. You can reschedule it later."
              : "This will end the match immediately. The result will show as abandoned. This cannot be undone."
          }
          confirmLabel={isUpcoming ? "Yes, Cancel" : "Yes, Abandon"}
          danger={isLive}
          onConfirm={doAbandon}
          onClose={() => setModal(null)}
          loading={acting}
        />
      )}

      {modal === "delete" && (
        <ConfirmModal
          title="Delete Match?"
          message="This will permanently delete the match and all its data. This cannot be undone."
          confirmLabel="Delete Forever"
          danger={true}
          onConfirm={doDelete}
          onClose={() => setModal(null)}
          loading={acting}
        />
      )}
    </AppShell>
  );
}
