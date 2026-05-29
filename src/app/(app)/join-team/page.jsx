"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { apiRequest } from "@/lib/api";
import { useUser } from "@/lib/user-context";

const PLAYER_TYPE_LABELS = {
  batter:               { label: "Batter",           icon: "🏏" },
  bowler:               { label: "Bowler",           icon: "🎯" },
  all_rounder:          { label: "All-Rounder",      icon: "⚡" },
  wicket_keeper:        { label: "Wicket Keeper",    icon: "🧤" },
  wicket_keeper_batter: { label: "WK-Batter",        icon: "🧤" },
};

const BATTING_LABELS = {
  right_hand: "Right Hand",
  left_hand:  "Left Hand",
};

const BOWLING_LABELS = {
  right_arm_fast:      "Right Arm Fast",
  right_arm_medium:    "Right Arm Medium",
  right_arm_off_spin:  "Right Arm Off Spin",
  right_arm_leg_spin:  "Right Arm Leg Spin",
  left_arm_fast:       "Left Arm Fast",
  left_arm_medium:     "Left Arm Medium",
  left_arm_orthodox:   "Left Arm Orthodox",
  left_arm_wrist_spin: "Left Arm Wrist Spin",
};

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function Avatar({ url, name, size = "md" }) {
  const dim = size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
  return url ? (
    <img src={url} alt={name} className={`${dim} rounded-xl object-cover`} />
  ) : (
    <div className={`${dim} cricket-gradient rounded-xl flex items-center justify-center font-bold text-white`}>
      {initials(name)}
    </div>
  );
}

// ─── Team preview card shown after code lookup ────────────────────────────────

function TeamPreview({ result, onSend, sending }) {
  const { team, is_member, request_status } = result;

  let statusBlock = null;

  if (is_member) {
    statusBlock = (
      <div className="flex items-center gap-2 rounded-xl border border-secondary/30 bg-green-50 px-4 py-3 text-sm font-semibold text-secondary">
        <span className="material-symbols-outlined text-lg">check_circle</span>
        You are already a member of this team.
      </div>
    );
  } else if (request_status === "pending") {
    statusBlock = (
      <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-semibold text-foreground-muted">
        <span className="material-symbols-outlined text-lg">hourglass_top</span>
        Join request sent — waiting for captain to approve.
      </div>
    );
  } else if (request_status === "approved") {
    statusBlock = (
      <div className="flex items-center gap-2 rounded-xl border border-secondary/30 bg-green-50 px-4 py-3 text-sm font-semibold text-secondary">
        <span className="material-symbols-outlined text-lg">check_circle</span>
        Your request was approved. You are now a member!
      </div>
    );
  } else if (request_status === "rejected") {
    statusBlock = (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <span className="material-symbols-outlined text-lg">cancel</span>
          Your previous request was rejected. You can send a new one.
        </div>
        <button
          onClick={onSend}
          disabled={sending}
          className="cricket-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {sending ? <Spinner /> : <span className="material-symbols-outlined text-lg">send</span>}
          Send New Request
        </button>
      </div>
    );
  } else {
    statusBlock = (
      <button
        onClick={onSend}
        disabled={sending}
        className="cricket-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {sending ? <Spinner /> : <span className="material-symbols-outlined text-lg">send</span>}
        Send Join Request
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
      <div className="cricket-gradient p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl">🏏</div>
          <div>
            <h3 className="font-display text-xl font-bold text-white">{team.name}</h3>
            <p className="font-mono text-sm text-white/70">{team.code}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
          <span className="text-sm text-foreground-muted">Members</span>
          <span className="font-display font-bold text-foreground">{team.members_count}</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
          <Avatar url={team.captain.avatar_url} name={team.captain.name} />
          <div>
            <p className="text-xs text-foreground-muted">Captain</p>
            <p className="font-semibold text-foreground">{team.captain.name}</p>
          </div>
        </div>

        {statusBlock}
      </div>
    </div>
  );
}

// ─── My pending requests list ─────────────────────────────────────────────────

function MyRequests({ token, refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    apiRequest("/api/join-requests", { token })
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [token, refreshKey]);

  async function handleCancel(id) {
    setCancelling(id);
    try {
      await apiRequest(`/api/join-requests/${id}`, { method: "DELETE", token });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(err?.data?.message || "Could not cancel request.");
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return null;
  if (requests.length === 0) return null;

  const statusStyle = {
    pending:  "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-secondary",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-display text-base font-bold text-foreground">My Join Requests</h3>
      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl border border-outline-variant px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{r.team.name}</p>
              <p className="font-mono text-xs text-foreground-muted">{r.team.code}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[r.status]}`}>
              {r.status}
            </span>
            {r.status === "pending" ? (
              <button
                onClick={() => handleCancel(r.id)}
                disabled={cancelling === r.id}
                className="rounded-lg p-1.5 text-outline transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                title="Cancel request"
              >
                {cancelling === r.id ? <Spinner /> : <span className="material-symbols-outlined text-lg">close</span>}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JoinTeamPage() {
  const { token } = useUser();
  const [code, setCode] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleLookup(e) {
    e.preventDefault();
    setLooking(true);
    setLookupError("");
    setLookupResult(null);

    try {
      const data = await apiRequest("/api/join-requests/lookup", {
        method: "POST",
        token,
        body: { code: code.trim().toUpperCase() },
      });
      setLookupResult(data);
    } catch (err) {
      setLookupError(err?.data?.message || "Team not found. Check the code and try again.");
    } finally {
      setLooking(false);
    }
  }

  async function handleSend() {
    if (!lookupResult) return;
    setSending(true);

    try {
      await apiRequest("/api/join-requests", {
        method: "POST",
        token,
        body: { team_id: lookupResult.team.id },
      });
      // Re-fetch to show updated status
      const updated = await apiRequest("/api/join-requests/lookup", {
        method: "POST",
        token,
        body: { code: lookupResult.team.code },
      });
      setLookupResult(updated);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.data?.message || "Could not send request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell title="Join a Team" subtitle="Enter a team code to send a join request">
      <div className="mx-auto max-w-lg space-y-6">

        {/* Code entry */}
        <div className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <h2 className="mb-1 font-display text-lg font-bold text-foreground">Enter Team Code</h2>
          <p className="mb-5 text-sm text-foreground-muted">
            Ask your captain for the team code (format: TEAM-XXXXXX).
          </p>

          <form onSubmit={handleLookup} className="space-y-4">
            {lookupError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{lookupError}</p>
            ) : null}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">group_add</span>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setLookupResult(null);
                  setLookupError("");
                }}
                placeholder="TEAM-XXXXXX"
                maxLength={11}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-12 pr-4 font-mono text-base tracking-widest text-foreground placeholder-outline focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              disabled={looking || code.length < 6}
              className="cricket-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {looking ? <Spinner /> : <span className="material-symbols-outlined text-lg">search</span>}
              Find Team
            </button>
          </form>
        </div>

        {/* Lookup result */}
        {lookupResult ? (
          <TeamPreview result={lookupResult} onSend={handleSend} sending={sending} />
        ) : null}

        {/* My requests */}
        <MyRequests token={token} refreshKey={refreshKey} />
      </div>
    </AppShell>
  );
}
