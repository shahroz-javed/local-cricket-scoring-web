"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { apiRequest } from "@/lib/api";
import { useUser } from "@/lib/user-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function teamPair(match) {
  const home = match.teams?.find((t) => t.role === "home");
  const away = match.teams?.find((t) => t.role === "away");
  return { home: home?.name ?? "TBD", away: away?.name ?? "TBD" };
}

function PageSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-10" />
        <span className="absolute h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/40" />
        <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>sports_cricket</span>
      </div>
      <p className="text-sm text-foreground-muted">Loading matches…</p>
    </div>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function LiveCard({ match }) {
  const { home, away } = teamPair(match);
  return (
    <article className="overflow-hidden rounded-2xl border-2 border-tertiary/30 bg-white shadow-md">
      <div className="cricket-gradient flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          <span className="text-xs font-bold text-white">LIVE NOW</span>
        </div>
        <span className="font-mono text-xs text-white/70">{match.code}</span>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏏</span>
            <div>
              <p className="font-bold text-foreground">{home}</p>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-outline-variant font-display text-sm font-bold text-foreground-muted">VS</div>
          <div className="flex flex-row-reverse items-center gap-3">
            <span className="text-2xl">🏏</span>
            <div className="text-right">
              <p className="font-bold text-foreground">{away}</p>
            </div>
          </div>
        </div>
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-3">
          <span className="material-symbols-outlined text-lg text-foreground-muted">location_on</span>
          <div>
            <p className="text-xs text-foreground-muted">
              {[match.venue, match.overs_limit ? `${match.overs_limit} overs` : null].filter(Boolean).join(" · ") || "Venue not set"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/matches/${match.code}`} className="flex-1 rounded-xl bg-tertiary py-2.5 text-center text-sm font-semibold text-white transition-all hover:scale-[1.02]">
            Watch Live
          </Link>
          <Link href={`/live-scoring?code=${match.code}`} className="cricket-gradient flex-1 rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-all hover:scale-[1.02]">
            Score Match
          </Link>
        </div>
      </div>
    </article>
  );
}

function UpcomingCard({ match }) {
  const { home, away } = teamPair(match);
  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-primary">event</span>
          <span className="text-sm font-semibold text-foreground">{formatDate(match.date)}</span>
        </div>
        <span className="font-mono text-xs text-foreground-muted">{match.code}</span>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <p className="text-sm font-bold text-foreground">{home}</p>
          </div>
          <p className="font-display font-bold text-foreground-muted">VS</p>
          <div className="flex flex-row-reverse items-center gap-2">
            <span className="text-xl">🏏</span>
            <p className="text-sm font-bold text-foreground">{away}</p>
          </div>
        </div>
        {(match.venue || match.overs_limit) && (
          <p className="mb-3 flex items-center gap-1 text-xs text-foreground-muted">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {[match.venue, match.overs_limit ? `${match.overs_limit} overs` : null].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="flex gap-2">
          <Link href={`/match-detail?code=${match.code}`} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface-container">
            Manage
          </Link>
          <Link href={`/match-setup?code=${match.code}`} className="cricket-gradient flex-1 rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-all hover:scale-[1.02]">
            Setup & Start
          </Link>
        </div>
      </div>
    </article>
  );
}

function CompletedCard({ match }) {
  const { home, away } = teamPair(match);
  const abandoned = match.status === "abandoned";
  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-foreground-muted">{formatDate(match.date)}{match.overs_limit ? ` · ${match.overs_limit} overs` : ""}</span>
          <div className="flex items-center gap-2">
            {abandoned && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-bold text-foreground-muted">Abandoned</span>
            )}
            <span className="font-mono text-xs text-foreground-muted">{match.code}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏏</span>
            <p className="text-sm font-semibold text-foreground">{home}</p>
          </div>
          <p className="font-display font-bold text-foreground-muted">VS</p>
          <div className="flex flex-row-reverse items-center gap-2">
            <span className="text-lg">🏏</span>
            <p className="text-sm font-semibold text-foreground">{away}</p>
          </div>
        </div>
        <Link
          href={`/match-detail?code=${match.code}`}
          className="mt-3 block rounded-xl border border-outline-variant py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-surface-container-low"
        >
          View Match →
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ tab }) {
  const cfg = {
    live:      { icon: "sports_cricket", text: "No live matches right now." },
    upcoming:  { icon: "event",          text: "No upcoming matches scheduled." },
    completed: { icon: "check_circle",   text: "No completed matches yet." },
  };
  const { icon, text } = cfg[tab];
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-outline-variant bg-white py-12 text-center">
      <span className="material-symbols-outlined text-4xl text-outline">{icon}</span>
      <p className="text-sm font-semibold text-foreground-muted">{text}</p>
      {tab !== "completed" && (
        <Link href="/create-match" className="cricket-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
          Create a Match
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyMatchesPage() {
  const { token } = useUser();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [search,    setSearch]    = useState("");
  const [matches,   setMatches]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!token) return;
    apiRequest("/api/my-matches", { token })
      .then((data) => {
        const all  = [...(data.created ?? []), ...(data.playing ?? [])];
        const seen = new Set();
        const deduped = all.filter((m) => { if (seen.has(m.code)) return false; seen.add(m.code); return true; });
        setMatches(deduped);
        if (deduped.some((m) => m.status === "live")) setActiveTab("live");
      })
      .catch((err) => setError(err?.data?.message || "Failed to load matches."))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    if (!matches) return [];
    const q = search.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((m) => {
      const haystack = [m.title, m.code, ...(m.teams?.map((t) => t.name) ?? [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [matches, search]);

  const live      = filtered.filter((m) => m.status === "live");
  const upcoming  = filtered.filter((m) => m.status === "upcoming");
  const completed = filtered.filter((m) => m.status === "completed" || m.status === "abandoned");

  const tabs = [
    { id: "live",      label: `Live (${live.length})`,           dot: true },
    { id: "upcoming",  label: `Upcoming (${upcoming.length})`,   icon: "schedule" },
    { id: "completed", label: `Completed (${completed.length})`, icon: "check_circle" },
  ];

  const activeList = { live, upcoming, completed }[activeTab] ?? [];

  return (
    <AppShell
      title="My Matches"
      subtitle="All matches you've created or played in"
      action={
        <Link href="/create-match" className="cricket-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 active:scale-95">
          <span className="material-symbols-outlined text-lg">add</span>
          New Match
        </Link>
      }
    >
      <div className="max-w-4xl space-y-5">
        {/* Search + Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search matches…"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-container">
            <span className="material-symbols-outlined text-lg">tune</span>
            Filter
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-foreground-muted hover:bg-surface-container hover:text-primary"
              }`}
            >
              {tab.dot
                ? <span className={`h-2 w-2 rounded-full ${activeTab === tab.id ? "bg-white" : "bg-tertiary live-dot"}`} />
                : <span className="material-symbols-outlined text-base">{tab.icon}</span>
              }
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && <PageSpinner />}

        {!loading && error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {activeList.length === 0 && <EmptyState tab={activeTab} />}

            {activeTab === "live"      && live.map((m)      => <LiveCard      key={m.code} match={m} />)}
            {activeTab === "upcoming"  && upcoming.map((m)  => <UpcomingCard  key={m.code} match={m} />)}
            {activeTab === "completed" && completed.map((m) => <CompletedCard key={m.code} match={m} />)}

            {activeTab === "upcoming" && upcoming.length > 0 && (
              <div className="rounded-2xl border-2 border-dashed border-outline-variant bg-white p-6 text-center">
                <span className="material-symbols-outlined mb-2 text-3xl text-outline">add_circle</span>
                <p className="text-sm font-semibold text-foreground-muted">Schedule another match</p>
                <Link href="/create-match" className="mt-1 block text-xs font-semibold text-primary hover:underline">
                  Create Match →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
