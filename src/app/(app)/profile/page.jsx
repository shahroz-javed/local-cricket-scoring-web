"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { apiRequest } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";
import { useUser } from "@/lib/user-context";

// ─── constants ────────────────────────────────────────────────────────────────

const PLAYER_TYPES = [
  { value: "batter",               label: "Batter",             icon: "🏏" },
  { value: "bowler",               label: "Bowler",             icon: "🎯" },
  { value: "all_rounder",          label: "All-Rounder",        icon: "⚡" },
  { value: "wicket_keeper",        label: "Wicket Keeper",      icon: "🧤" },
  { value: "wicket_keeper_batter", label: "WK-Batter",          icon: "🧤" },
];

const BATTING_STYLES = [
  { value: "right_hand", label: "Right Hand" },
  { value: "left_hand",  label: "Left Hand"  },
];

const BOWLING_STYLES = [
  { value: "right_arm_fast",      label: "Right Arm Fast"      },
  { value: "right_arm_medium",    label: "Right Arm Medium"    },
  { value: "right_arm_off_spin",  label: "Right Arm Off Spin"  },
  { value: "right_arm_leg_spin",  label: "Right Arm Leg Spin"  },
  { value: "left_arm_fast",       label: "Left Arm Fast"       },
  { value: "left_arm_medium",     label: "Left Arm Medium"     },
  { value: "left_arm_orthodox",   label: "Left Arm Orthodox"   },
  { value: "left_arm_wrist_spin", label: "Left Arm Wrist Spin" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function labelOf(list, value) {
  return list.find((i) => i.value === value)?.label ?? null;
}

function iconOf(list, value) {
  return list.find((i) => i.value === value)?.icon ?? null;
}


// ─── small components ─────────────────────────────────────────────────────────

function Spinner({ sm }) {
  return (
    <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${sm ? "h-3 w-3" : "h-4 w-4"}`} />
  );
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

function AvatarUpload({ user, token, onUpdated }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const updated = await apiRequest("/api/me/avatar", {
        method: "POST",
        token,
        body: formData,
      });
      onUpdated(updated);
    } catch (err) {
      setError(err?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="relative group w-fit">
      {/* Avatar display */}
      <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-surface">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full cricket-gradient flex items-center justify-center text-white text-3xl font-bold font-display">
            {initials(user.name)}
          </div>
        )}

        {/* Overlay on hover */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Spinner />
          ) : (
            <>
              <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
              <span className="text-white text-xs font-semibold mt-1">Change</span>
            </>
          )}
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

// ─── Edit profile form ────────────────────────────────────────────────────────

function EditProfileForm({ user, token, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name:          user.name ?? "",
    phone:         user.phone ?? "",
    player_type:   user.player_type ?? null,
    batting_style: user.batting_style ?? null,
    bowling_style: user.bowling_style ?? null,
  });
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

    try {
      const updated = await apiRequest("/api/me", {
        method: "PATCH",
        token,
        body: {
          name:          form.name,
          phone:         form.phone || null,
          player_type:   form.player_type || null,
          batting_style: form.batting_style || null,
          bowling_style: needsBowling ? (form.bowling_style || null) : null,
        },
      });
      onSaved(updated);
    } catch (err) {
      setError(err?.data?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+92 300 1234567"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-foreground placeholder-outline focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Player type */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Player Type</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {PLAYER_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => set("player_type", form.player_type === pt.value ? null : pt.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-semibold transition-all ${form.player_type === pt.value ? "border-primary bg-primary-fixed text-primary" : "border-outline-variant bg-surface-container-low text-foreground hover:border-primary/40"}`}
            >
              <span className="text-2xl">{pt.icon}</span>
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Batting style */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Batting Style</label>
          <select
            value={form.batting_style ?? ""}
            onChange={(e) => set("batting_style", e.target.value || null)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select style</option>
            {BATTING_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Bowling style */}
        {needsBowling ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Bowling Style</label>
            <select
              value={form.bowling_style ?? ""}
              onChange={(e) => set("bowling_style", e.target.value || null)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select style</option>
              {BOWLING_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="cricket-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {saving ? <Spinner sm /> : null}
          Save Changes
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-outline-variant px-6 py-3 text-sm font-semibold text-foreground-muted hover:bg-surface-container-low transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { token, user: ctxUser } = useUser();
  const [user, setUser] = useState(ctxUser);
  const [loading, setLoading] = useState(!ctxUser);
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Re-fetch fresh data (avatar_url may have changed)
    apiRequest("/api/me", { token })
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function handleUpdated(updated) {
    setUser(updated);
    // Keep localStorage user in sync
    setAuthSession({ token, user: updated });
    setEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function handleAvatarUpdated(updated) {
    setUser(updated);
    setAuthSession({ token, user: updated });
  }

  if (loading) {
    return (
      <AppShell title="Player Profile" subtitle="Career stats across all matches">
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-foreground-muted">
          <Spinner /> Loading profile…
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell title="Player Profile" subtitle="Career stats across all matches">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          Could not load profile. Please refresh the page.
        </div>
      </AppShell>
    );
  }

  const playerTypeLabel = labelOf(PLAYER_TYPES, user.player_type);
  const playerTypeIcon  = iconOf(PLAYER_TYPES, user.player_type);
  const battingLabel    = labelOf(BATTING_STYLES, user.batting_style);
  const bowlingLabel    = labelOf(BOWLING_STYLES, user.bowling_style);

  return (
    <AppShell title="Player Profile" subtitle="Career stats across all matches">
      <div className="space-y-6">

        {/* ── Profile card ── */}
        <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
          <div className="cricket-gradient h-24" />
          <div className="px-5 pb-6 md:px-6">
            <div className="-mt-12 flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
              <AvatarUpload user={user} token={token} onUpdated={handleAvatarUpdated} />

              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl font-bold text-foreground">{user.name}</h2>
                <p className="text-sm text-foreground-muted">{user.email}</p>
                {user.phone ? <p className="text-sm text-foreground-muted">{user.phone}</p> : null}

                {/* Cricket identity tags */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {playerTypeLabel ? (
                    <span className="flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-foreground">
                      {playerTypeIcon} {playerTypeLabel}
                    </span>
                  ) : null}
                  {battingLabel ? (
                    <span className="rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-xs text-foreground">
                      🏏 {battingLabel} bat
                    </span>
                  ) : null}
                  {bowlingLabel ? (
                    <span className="rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-xs text-foreground">
                      🎯 {bowlingLabel}
                    </span>
                  ) : null}
                  {!playerTypeLabel && !battingLabel ? (
                    <span className="rounded-full border border-dashed border-outline-variant px-2.5 py-1 text-xs text-foreground-muted">
                      Complete your cricket profile below
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                onClick={() => setEditing((v) => !v)}
                className="shrink-0 rounded-xl cricket-gradient px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* Success banner */}
          {saveSuccess ? (
            <div className="mx-5 mb-4 rounded-xl border border-secondary/20 bg-green-50 px-4 py-3 text-sm text-secondary md:mx-6">
              Profile updated successfully.
            </div>
          ) : null}

          {/* Edit form */}
          {editing ? (
            <div className="border-t border-outline-variant px-5 py-6 md:px-6">
              <h3 className="mb-4 font-display text-base font-bold text-foreground">Edit Profile</h3>
              <EditProfileForm
                user={user}
                token={token}
                onSaved={handleUpdated}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : null}
        </section>

        {/* ── Career stats — static placeholders until stats API is wired ── */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Matches", value: "—" },
            { label: "Runs",    value: "—" },
            { label: "Wickets", value: "—" },
            { label: "Win Rate",value: "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-foreground-muted">{label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </section>

        {/* ── Batting & Bowling (placeholders) ── */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {["Batting", "Bowling"].map((stat) => (
            <div key={stat} className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-foreground">{stat}</h3>
                <span className="rounded-full bg-primary-fixed px-2 py-1 text-xs font-semibold text-primary">Career</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {["Average", "Strike Rate", "50s / 100s", "Best"].map((metric) => (
                  <div key={metric} className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-foreground-muted">{metric}</p>
                    <p className="mt-0.5 text-xl font-bold text-foreground">—</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── Recent Matches ── */}
        <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-foreground">Recent Matches</h3>
            <Link href="/my-matches" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
          </div>
          <div className="rounded-xl border border-dashed border-outline-variant py-8 text-center text-sm text-foreground-muted">
            Match history will appear here once you play your first match.
          </div>
        </section>
      </div>
    </AppShell>
  );
}
