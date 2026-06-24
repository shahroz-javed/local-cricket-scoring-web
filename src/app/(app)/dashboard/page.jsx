"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useUser } from "@/lib/user-context";
import { Icon } from "@/components/ui/icon";
import { apiRequest } from "@/lib/api";

const STATUS_BADGE = {
  upcoming:  { label: "Upcoming",  cls: "bg-gray-100 text-gray-500" },
  live:      { label: "Live",      cls: "bg-green-100 text-green-700" },
  paused:    { label: "Paused",    cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Done",      cls: "bg-blue-100 text-blue-700" },
  abandoned: { label: "Abandoned", cls: "bg-red-100 text-red-600" },
};

const TOURNEY_BADGE = {
  draft:        { label: "Draft",        cls: "bg-gray-100 text-gray-500" },
  registration: { label: "Registration", cls: "bg-blue-100 text-blue-700" },
  active:       { label: "Active",       cls: "bg-green-100 text-green-700" },
  completed:    { label: "Completed",    cls: "bg-purple-100 text-purple-700" },
  cancelled:    { label: "Cancelled",    cls: "bg-red-100 text-red-600" },
};

export default function DashboardPage() {
  const { user, token } = useUser();

  const [matches,     setMatches]     = useState(null);
  const [teams,       setTeams]       = useState(null);
  const [tournaments, setTournaments] = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([
      apiRequest("/api/my-matches",   { token }),
      apiRequest("/api/teams",        { token }),
      apiRequest("/api/tournaments",  { token }),
    ]).then(([m, t, to]) => {
      if (m.status  === "fulfilled") setMatches(m.value);
      if (t.status  === "fulfilled") setTeams(t.value);
      if (to.status === "fulfilled") setTournaments(to.value);
      setLoading(false);
    });
  }, [token]);

  const allMatches   = [...(matches?.created ?? []), ...(matches?.playing ?? [])];
  const liveMatches  = allMatches.filter((m) => m.status === "live" || m.status === "paused");
  const recentMatches = allMatches.slice(0, 5);
  const myTeams      = teams ?? [];
  const myTournaments = (tournaments ?? []).slice(0, 5);

  const stats = [
    {
      icon: "sports_cricket",
      label: "Matches",
      value: loading ? "—" : allMatches.length,
      sub: liveMatches.length > 0 ? `${liveMatches.length} live now` : "total",
      color: "bg-primary-fixed",
      iconCls: "text-primary",
      href: "/my-matches",
      pulse: liveMatches.length > 0,
    },
    {
      icon: "groups",
      label: "Teams",
      value: loading ? "—" : myTeams.length,
      sub: "as captain",
      color: "bg-green-100",
      iconCls: "text-secondary",
      href: "/team-management",
    },
    {
      icon: "emoji_events",
      label: "Tournaments",
      value: loading ? "—" : (tournaments ?? []).length,
      sub: "organised",
      color: "bg-amber-100",
      iconCls: "text-amber-600",
      href: "/tournaments",
    },
    {
      icon: "person",
      label: "Profile",
      value: user?.name?.split(" ")[0] ?? "—",
      sub: user?.email ?? "",
      color: "bg-purple-100",
      iconCls: "text-purple-600",
      href: "/profile",
      truncate: true,
    },
  ];

  return (
    <AppShell
      title={`Welcome back, ${user?.name?.split(" ")[0] ?? "there"}`}
      subtitle="Your dashboard — matches, teams and tournaments at a glance."
      action={
        <Link
          href="/create-match"
          className="cricket-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          <Icon name="add" className="text-lg" />
          New Match
        </Link>
      }
    >
      <div className="space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href}
              className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-sm hover:shadow-md hover:border-outline-variant transition-all group">
              <div className="mb-3 flex items-start justify-between">
                <div className={`rounded-xl ${s.color} p-2.5 inline-flex`}>
                  <Icon name={s.icon} className={`text-xl ${s.iconCls}`} />
                </div>
                {s.pulse && (
                  <span className="flex h-2 w-2 mt-1">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
              </div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{s.label}</p>
              <p className={`font-display text-2xl font-bold text-foreground ${s.truncate ? "truncate text-base mt-1" : ""}`}>
                {s.value}
              </p>
              <p className={`text-[10px] text-foreground-muted mt-0.5 ${s.truncate ? "truncate" : ""}`}>{s.sub}</p>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Link href="/create-match" className="cricket-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            <Icon name="add_circle" /> Create Match
          </Link>
          <Link href="/team-management" className="inline-flex items-center gap-2 rounded-xl bg-surface border border-outline-variant px-5 py-2.5 text-sm font-semibold hover:bg-surface-low transition-colors">
            <Icon name="group_add" /> Manage Teams
          </Link>
          <Link href="/tournaments" className="inline-flex items-center gap-2 rounded-xl bg-surface border border-outline-variant px-5 py-2.5 text-sm font-semibold hover:bg-surface-low transition-colors">
            <Icon name="emoji_events" /> Tournaments
          </Link>
          <Link href="/my-matches" className="inline-flex items-center gap-2 rounded-xl border border-primary-fixed px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary-fixed transition-colors">
            <Icon name="sports_cricket" /> My Matches
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">

          {/* Recent matches */}
          <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
            <div className="px-4 py-3 bg-surface-low border-b border-outline-variant flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Recent Matches</span>
              <Link href="/my-matches" className="text-xs text-primary font-semibold hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="divide-y divide-outline-variant">
                {[1,2,3].map((i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-surface-low animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 bg-surface-low rounded-full animate-pulse" />
                      <div className="h-2.5 w-20 bg-surface-low rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentMatches.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Icon name="sports_cricket" className="text-3xl text-outline mb-2" />
                <p className="text-sm text-foreground-muted">No matches yet</p>
                <Link href="/create-match" className="mt-2 inline-block text-xs text-primary font-semibold hover:underline">Create your first match →</Link>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {recentMatches.map((m) => {
                  const badge = STATUS_BADGE[m.status] ?? { label: m.status, cls: "bg-gray-100 text-gray-500" };
                  const isLive = m.status === "live" || m.status === "paused";
                  return (
                    <Link key={m.code} href={`/matches/${m.code}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-low transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isLive ? "bg-green-100" : "bg-surface-low"}`}>
                        <Icon name={isLive ? "live_tv" : "sports_cricket"} className={`text-sm ${isLive ? "text-secondary" : "text-foreground-muted"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {m.title || (m.teams?.map((t) => t.name).join(" vs ")) || m.code}
                        </p>
                        <p className="text-[11px] text-foreground-muted font-mono">{m.code}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Tournaments */}
          <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
            <div className="px-4 py-3 bg-surface-low border-b border-outline-variant flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">My Tournaments</span>
              <Link href="/tournaments" className="text-xs text-primary font-semibold hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="divide-y divide-outline-variant">
                {[1,2,3].map((i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-surface-low animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-36 bg-surface-low rounded-full animate-pulse" />
                      <div className="h-2.5 w-24 bg-surface-low rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : myTournaments.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Icon name="emoji_events" className="text-3xl text-outline mb-2" />
                <p className="text-sm text-foreground-muted">No tournaments organised yet</p>
                <Link href="/tournaments" className="mt-2 inline-block text-xs text-primary font-semibold hover:underline">Browse or create one →</Link>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {myTournaments.map((t) => {
                  const badge = TOURNEY_BADGE[t.status] ?? { label: t.status, cls: "bg-gray-100 text-gray-500" };
                  return (
                    <Link key={t.code} href={`/tournaments/${t.code}/manage`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-low transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Icon name="emoji_events" className="text-sm text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                        <p className="text-[11px] text-foreground-muted capitalize">{t.format?.replace("_", " ")} · {t.team_count ?? 0} teams</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </AppShell>
  );
}
