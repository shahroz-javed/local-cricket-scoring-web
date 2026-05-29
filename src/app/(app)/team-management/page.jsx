"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { apiRequest } from "@/lib/api";
import { useUser } from "@/lib/user-context";

// ─── constants ───────────────────────────────────────────────────────────────

const PLAYER_TYPES = [
  { value: "batter",               label: "Batter",                  icon: "🏏" },
  { value: "bowler",               label: "Bowler",                  icon: "🎯" },
  { value: "all_rounder",          label: "All-Rounder",             icon: "⚡" },
  { value: "wicket_keeper",        label: "Wicket Keeper",           icon: "🧤" },
  { value: "wicket_keeper_batter", label: "Wicket Keeper-Batter",    icon: "🧤" },
];

const BATTING_STYLES = [
  { value: "right_hand", label: "Right Hand" },
  { value: "left_hand",  label: "Left Hand"  },
];

const BOWLING_STYLES = [
  { value: "right_arm_fast",       label: "Right Arm Fast"        },
  { value: "right_arm_medium",     label: "Right Arm Medium"      },
  { value: "right_arm_off_spin",   label: "Right Arm Off Spin"    },
  { value: "right_arm_leg_spin",   label: "Right Arm Leg Spin"    },
  { value: "left_arm_fast",        label: "Left Arm Fast"         },
  { value: "left_arm_medium",      label: "Left Arm Medium"       },
  { value: "left_arm_orthodox",    label: "Left Arm Orthodox"     },
  { value: "left_arm_wrist_spin",  label: "Left Arm Wrist Spin"   },
];

const AVATAR_OPTIONS = ["🏏", "⚡", "🎯", "🧤", "🦁", "🐆", "🦅", "🐉", "⭐", "🔥", "💎", "🏆"];

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function avatarBg(index) {
  const colors = ["cricket-gradient", "bg-secondary", "bg-tertiary", "bg-purple-500", "bg-orange-500", "bg-teal-500"];
  return colors[index % colors.length];
}

function playerTypeIcon(type) {
  return PLAYER_TYPES.find((t) => t.value === type)?.icon ?? "🏏";
}

function playerTypeLabel(type) {
  return PLAYER_TYPES.find((t) => t.value === type)?.label ?? "—";
}

function battingLabel(style) {
  return BATTING_STYLES.find((s) => s.value === style)?.label ?? "—";
}

function bowlingLabel(style) {
  return BOWLING_STYLES.find((s) => s.value === style)?.label ?? "—";
}

// ─── small components ─────────────────────────────────────────────────────────

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-outline transition-colors hover:bg-surface-container hover:text-foreground">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder = "Select…" }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-foreground">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Create / Edit team modal ─────────────────────────────────────────────────

function TeamFormModal({ team, token, onSaved, onClose }) {
  const [name, setName] = useState(team?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = team
        ? await apiRequest(`/api/teams/${team.id}`, { method: "PATCH", token, body: { name } })
        : await apiRequest("/api/teams", { method: "POST", token, body: { name } });
      onSaved(data);
    } catch (err) {
      setError(err?.data?.errors?.name?.[0] || err?.data?.message || "Could not save team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={team ? "Rename Team" : "Create New Team"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Team Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lahore Panthers"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-foreground placeholder-outline focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            required
            autoFocus
          />
        </div>
        <button type="submit" disabled={saving} className="cricket-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-70">
          {saving ? <Spinner /> : null}
          {team ? "Save Changes" : "Create Team"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Add / Edit member modal ──────────────────────────────────────────────────

const EMPTY_MEMBER_FORM = {
  guest_name: "",
  role: "player",
  avatar_emoji: "🏏",
  player_type: null,
  batting_style: null,
  bowling_style: null,
};

function MemberFormModal({ member, token, teamId, onSaved, onClose }) {
  const isEdit = Boolean(member);
  const [form, setForm] = useState(
    member
      ? {
          guest_name:    member.guest_name ?? "",
          role:          member.role ?? "player",
          avatar_emoji:  member.avatar_emoji ?? "🏏",
          player_type:   member.player_type ?? null,
          batting_style: member.batting_style ?? null,
          bowling_style: member.bowling_style ?? null,
        }
      : { ...EMPTY_MEMBER_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const needsBowling = ["bowler", "all_rounder", "wicket_keeper", "wicket_keeper_batter"].includes(form.player_type);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      role:          form.role,
      avatar_emoji:  form.avatar_emoji || null,
      player_type:   form.player_type || null,
      batting_style: form.batting_style || null,
      bowling_style: needsBowling ? (form.bowling_style || null) : null,
    };

    if (!isEdit) {
      body.guest_name = form.guest_name;
    } else if (member?.guest_name !== undefined) {
      body.guest_name = form.guest_name;
    }

    try {
      const data = isEdit
        ? await apiRequest(`/api/teams/${teamId}/members/${member.id}`, { method: "PATCH", token, body })
        : await apiRequest(`/api/teams/${teamId}/members`, { method: "POST", token, body });
      onSaved(data);
    } catch (err) {
      setError(err?.data?.message || "Could not save player.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Player" : "Add Guest Player"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {/* Avatar picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => set("avatar_emoji", emoji)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all ${form.avatar_emoji === emoji ? "bg-primary-fixed ring-2 ring-primary" : "bg-surface-container hover:bg-surface-container-high"}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name — only for guests */}
        {(!isEdit || member?.guest_name !== undefined) ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Player Name</label>
            <input
              type="text"
              value={form.guest_name}
              onChange={(e) => set("guest_name", e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-foreground placeholder-outline focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              required={!isEdit}
              autoFocus={!isEdit}
            />
          </div>
        ) : null}

        {/* Role */}
        <SelectField
          label="Role"
          value={form.role}
          onChange={(v) => set("role", v ?? "player")}
          options={[
            { value: "player",  label: "Player"  },
            { value: "captain", label: "Captain" },
          ]}
        />

        {/* Player type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Player Type</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PLAYER_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => set("player_type", pt.value)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${form.player_type === pt.value ? "border-primary bg-primary-fixed text-primary" : "border-outline-variant bg-surface-container-low text-foreground hover:border-primary/40"}`}
              >
                <span className="text-xl">{pt.icon}</span>
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Batting style */}
        <SelectField
          label="Batting Style"
          value={form.batting_style}
          onChange={(v) => set("batting_style", v)}
          options={BATTING_STYLES}
          placeholder="Select batting style"
        />

        {/* Bowling style — only relevant for non-pure-batters */}
        {needsBowling ? (
          <SelectField
            label="Bowling Style"
            value={form.bowling_style}
            onChange={(v) => set("bowling_style", v)}
            options={BOWLING_STYLES}
            placeholder="Select bowling style"
          />
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="cricket-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {saving ? <Spinner /> : null}
          {isEdit ? "Save Changes" : "Add Player"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Team card ────────────────────────────────────────────────────────────────

function TeamCard({ team, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full overflow-hidden rounded-2xl border text-left shadow-sm transition-all hover:shadow-md ${selected ? "border-primary ring-2 ring-primary/20" : "border-outline-variant"}`}
    >
      <div className="cricket-gradient p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl">🏏</div>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">Captain</span>
        </div>
        <h3 className="mt-3 font-display text-lg font-bold text-white">{team.name}</h3>
        <p className="font-mono text-sm text-white/70">{team.code}</p>
      </div>
      <div className="bg-white p-4">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="font-display text-lg font-bold text-foreground">{team.members_count ?? 0}</div>
            <div className="text-xs text-foreground-muted">Players</div>
          </div>
          <div>
            <div className="font-display text-sm font-bold text-primary font-mono">{team.code}</div>
            <div className="text-xs text-foreground-muted">Share Code</div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Join request inbox (captain view) ───────────────────────────────────────

const PT_LABELS = {
  batter: { label: "Batter", icon: "🏏" },
  bowler: { label: "Bowler", icon: "🎯" },
  all_rounder: { label: "All-Rounder", icon: "⚡" },
  wicket_keeper: { label: "Wicket Keeper", icon: "🧤" },
  wicket_keeper_batter: { label: "WK-Batter", icon: "🧤" },
};
const BAT_LABELS = { right_hand: "Right Hand", left_hand: "Left Hand" };
const BOWL_LABELS = {
  right_arm_fast: "RA Fast", right_arm_medium: "RA Medium",
  right_arm_off_spin: "RA Off Spin", right_arm_leg_spin: "RA Leg Spin",
  left_arm_fast: "LA Fast", left_arm_medium: "LA Medium",
  left_arm_orthodox: "LA Orthodox", left_arm_wrist_spin: "LA Wrist Spin",
};

function JoinRequestInbox({ team, token, onMemberAdded }) {
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    apiRequest(`/api/teams/${team.id}/join-requests`, { token })
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [team.id, token]);

  async function handleApprove(req) {
    setActing(req.id);
    try {
      const data = await apiRequest(`/api/teams/${team.id}/join-requests/${req.id}/approve`, { method: "POST", token });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      if (data.member) onMemberAdded(data.member);
    } catch (err) {
      toast.error(err?.data?.message || "Could not approve request.");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(req) {
    setActing(req.id);
    try {
      await apiRequest(`/api/teams/${team.id}/join-requests/${req.id}/reject`, { method: "POST", token });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (err) {
      toast.error(err?.data?.message || "Could not reject request.");
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-foreground-muted">
        <Spinner /> Loading requests…
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant py-10 text-center text-sm text-foreground-muted">
        No pending join requests.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const pt = PT_LABELS[req.user.player_type];
        return (
          <div key={req.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-outline-variant px-4 py-3 transition-colors hover:bg-surface-container-low">
            {/* Avatar */}
            <div className="shrink-0">
              {req.user.avatar_url ? (
                <img src={req.user.avatar_url} alt={req.user.name} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="cricket-gradient flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white">
                  {initials(req.user.name)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{req.user.name}</p>
              <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-foreground-muted">
                {pt ? <span>{pt.icon} {pt.label}</span> : null}
                {req.user.batting_style ? <span>· {BAT_LABELS[req.user.batting_style]} bat</span> : null}
                {req.user.bowling_style ? <span>· {BOWL_LABELS[req.user.bowling_style]}</span> : null}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => handleApprove(req)}
                disabled={acting === req.id}
                className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {acting === req.id ? <Spinner /> : <span className="material-symbols-outlined text-base">check</span>}
                Approve
              </button>
              <button
                onClick={() => handleReject(req)}
                disabled={acting === req.id}
                className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-semibold text-foreground-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-base">close</span>
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Team detail panel ────────────────────────────────────────────────────────

function TeamDetail({ team, token, onTeamUpdated }) {
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("squad"); // "squad" | "requests"

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/teams/${team.code}`);
      setMembers(data.members ?? []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [team.code]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  async function handleRemove(member) {
    if (!confirm(`Remove ${member.display_name} from the team?`)) return;
    setRemoving(member.id);
    try {
      await apiRequest(`/api/teams/${team.id}/members/${member.id}`, { method: "DELETE", token });
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      onTeamUpdated({ ...team, members_count: Math.max(0, (team.members_count ?? 1) - 1) });
    } catch (err) {
      toast.error(err?.data?.message || "Could not remove member.");
    } finally {
      setRemoving(null);
    }
  }

  function handleMemberSaved(saved) {
    setMembers((prev) => {
      const existing = prev.find((m) => m.id === saved.id);
      if (existing) return prev.map((m) => (m.id === saved.id ? saved : m));
      onTeamUpdated({ ...team, members_count: (team.members_count ?? 0) + 1 });
      return [...prev, saved];
    });
    setModal(null);
  }

  function copyCode() {
    navigator.clipboard.writeText(team.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
      {/* Header */}
      <div className="cricket-gradient p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl">🏏</div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white">{team.name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-sm text-white/80">{team.code}</span>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs text-white transition-colors hover:bg-white/20"
                >
                  <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setModal("editTeam")}
            className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/20"
          >
            <span className="material-symbols-outlined text-lg">edit</span> Rename
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <div className="font-display text-2xl font-bold text-white">{team.members_count ?? 0}</div>
            <div className="text-xs text-white/70">Players</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <div className="font-display text-lg font-bold text-white font-mono">{team.code}</div>
            <div className="text-xs text-white/70">Share Code</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant">
        {[
          { key: "squad",    label: "Squad",         icon: "groups"     },
          { key: "requests", label: "Join Requests",  icon: "group_add"  },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === t.key ? "border-primary text-primary" : "border-transparent text-foreground-muted hover:text-foreground"}`}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Squad */}
      {tab === "squad" ? (
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-foreground">
            Squad ({members?.length ?? "…"})
          </h3>
          <button
            onClick={() => setModal("addMember")}
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-lg">person_add</span> Add Guest Player
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-foreground-muted">
            <Spinner /> Loading squad…
          </div>
        ) : members?.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant py-10 text-center text-sm text-foreground-muted">
            No players yet. Add your first squad member above.
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <MemberRow
                key={member.id}
                member={member}
                index={index}
                removing={removing === member.id}
                onEdit={() => setModal({ editMember: member })}
                onRemove={() => handleRemove(member)}
              />
            ))}
          </div>
        )}
      </div>
      ) : (
      <div className="p-6">
        <JoinRequestInbox
          team={team}
          token={token}
          onMemberAdded={(member) => {
            setMembers((prev) => (prev ? [...prev, member] : [member]));
            onTeamUpdated({ ...team, members_count: (team.members_count ?? 0) + 1 });
          }}
        />
      </div>
      )}

      {/* Modals */}
      {modal === "editTeam" ? (
        <TeamFormModal
          team={team}
          token={token}
          onSaved={(updated) => { onTeamUpdated(updated); setModal(null); }}
          onClose={() => setModal(null)}
        />
      ) : null}

      {modal === "addMember" ? (
        <MemberFormModal token={token} teamId={team.id} onSaved={handleMemberSaved} onClose={() => setModal(null)} />
      ) : null}

      {modal?.editMember ? (
        <MemberFormModal member={modal.editMember} token={token} teamId={team.id} onSaved={handleMemberSaved} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}

// ─── Member row card ──────────────────────────────────────────────────────────

function MemberRow({ member, index, removing, onEdit, onRemove }) {
  const typeIcon = playerTypeIcon(member.player_type);
  const typeLabel = playerTypeLabel(member.player_type);
  const isCaptain = member.role === "captain";
  const isGuest = !member.user_id;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-white px-4 py-3 transition-colors hover:bg-surface-container-low">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${member.avatar_emoji ? "bg-surface-container" : avatarBg(index) + " text-white text-sm font-bold"}`}>
          {member.avatar_emoji ?? initials(member.display_name)}
        </div>
        {member.player_type ? (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow-sm border border-outline-variant" title={typeLabel}>
            {typeIcon}
          </span>
        ) : null}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-foreground truncate">{member.display_name}</span>
          {isCaptain ? (
            <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-semibold text-primary">Captain</span>
          ) : null}
          {isGuest ? (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">Guest</span>
          ) : (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-secondary">Registered</span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-foreground-muted">
          {member.player_type ? <span>{typeIcon} {typeLabel}</span> : null}
          {member.batting_style ? <span>· {battingLabel(member.batting_style)} bat</span> : null}
          {member.bowling_style ? <span>· {bowlingLabel(member.bowling_style)}</span> : null}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container hover:text-foreground"
          title="Edit player"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
        {!isCaptain ? (
          <button
            onClick={onRemove}
            disabled={removing}
            className="rounded-lg p-1.5 text-outline transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Remove player"
          >
            {removing ? <Spinner /> : <span className="material-symbols-outlined text-lg">person_remove</span>}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamManagementPage() {
  const { token } = useUser();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    apiRequest("/api/teams", { token })
      .then((data) => {
        setTeams(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const selectedTeam = teams.find((t) => t.id === selectedId) ?? null;

  function handleTeamCreated(team) {
    setTeams((prev) => [{ ...team, members_count: 1 }, ...prev]);
    setSelectedId(team.id);
    setShowCreate(false);
  }

  function handleTeamUpdated(updated) {
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
  }

  return (
    <AppShell title="My Teams" subtitle="Manage your cricket squads">
      <div className="space-y-6">
        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center gap-2 py-16 text-sm text-foreground-muted">
              <Spinner /> Loading your teams…
            </div>
          ) : (
            <>
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  selected={team.id === selectedId}
                  onClick={() => setSelectedId(team.id)}
                />
              ))}
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="group flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant p-8 transition-all hover:border-primary hover:bg-surface-container-low"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container transition-colors group-hover:bg-primary-fixed">
                  <span className="material-symbols-outlined text-2xl text-outline transition-colors group-hover:text-primary">add_circle</span>
                </div>
                <p className="text-sm font-semibold text-foreground-muted transition-colors group-hover:text-primary">Create New Team</p>
                <p className="mt-1 text-center text-xs text-outline">Start a squad and invite your players</p>
              </button>
            </>
          )}
        </div>

        {/* Detail */}
        {selectedTeam ? (
          <TeamDetail key={selectedTeam.id} team={selectedTeam} token={token} onTeamUpdated={handleTeamUpdated} />
        ) : !loading && teams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant py-16 text-center text-sm text-foreground-muted">
            You have no teams yet. Create your first team above.
          </div>
        ) : null}
      </div>

      {showCreate ? (
        <TeamFormModal token={token} onSaved={handleTeamCreated} onClose={() => setShowCreate(false)} />
      ) : null}
    </AppShell>
  );
}
