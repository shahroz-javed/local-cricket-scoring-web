"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { PublicShell } from "@/components/layout/public-shell";
import { Icon } from "@/components/ui/icon";

const POLL_MS = 30000;

function formatDate(dateStr) {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function tournamentFormatLabel(t) {
  const overs = t?.overs_limit ? `${t.overs_limit} overs` : "overs TBD";
  const matchType = t?.match_type ?? "Custom";
  return `${t?.format === "league_knockout" ? "League + Knockout" : t?.format === "knockout" ? "Knockout" : "League"} · ${matchType} · ${overs}`;
}

function statusBadge(tournament) {
  if (tournament.status === "active") {
    return { label: "Ongoing", cls: "bg-red-50 text-tertiary border border-red-200", dot: true };
  }
  return { label: "Upcoming", cls: "bg-blue-50 text-blue-700 border border-blue-200", dot: false };
}

function SectionCard({ title, tournaments, emptyText }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
        <span className="text-xs font-semibold text-foreground-muted">{tournaments.length} tournament{tournaments.length === 1 ? "" : "s"}</span>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-outline-variant bg-white px-5 py-10 text-center">
          <Icon name="emoji_events" className="mx-auto mb-3 text-4xl text-outline" />
          <p className="text-sm font-semibold text-foreground">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tournaments.map((tournament) => {
            const badge = statusBadge(tournament);
            return (
              <article key={tournament.code} className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                <div className="relative h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
                  {tournament.banner_url ? (
                    <img src={tournament.banner_url} alt={tournament.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <div className="max-w-[70%]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">CricketApp Tournament</p>
                        <h3 className="mt-1 line-clamp-2 font-display text-xl font-bold text-white">{tournament.title}</h3>
                      </div>
                      <Icon name="emoji_events" className="text-5xl text-white/15" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
                      {badge.dot && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse align-middle" />}
                      {badge.label}
                    </span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90">
                      {tournament.code}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{tournament.title}</h3>
                    <p className="mt-1 text-xs text-foreground-muted">{tournamentFormatLabel(tournament)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-surface-low px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Teams</p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">{tournament.team_count ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-surface-low px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Starts</p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">{formatDate(tournament.starts_at)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-foreground-muted">
                    {tournament.default_venue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-low px-2.5 py-1 font-medium">
                        <Icon name="location_on" className="text-sm" />
                        {tournament.default_venue}
                      </span>
                    )}
                    {tournament.prize_pool_note && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                        <Icon name="workspace_premium" className="text-sm" />
                        Prize pool set
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Organiser</p>
                      <p className="truncate text-sm font-semibold text-foreground">{tournament.organiser?.name ?? "CricketApp"}</p>
                    </div>
                    <Link
                      href={`/tournaments/${tournament.code}`}
                      className="shrink-0 rounded-xl cricket-gradient px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                    >
                      View Tournament
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-24">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-10" />
        <span className="absolute h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/40" />
        <Icon name="emoji_events" className="text-xl text-primary" />
      </div>
      <p className="text-sm text-foreground-muted">Loading tournaments...</p>
    </div>
  );
}

export default function LiveTournamentsPage() {
  const [data, setData] = useState({ ongoing: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchTournaments = useMemo(() => async () => {
    try {
      const res = await apiRequest("/api/tournaments/live");
      setData({
        ongoing: res?.ongoing ?? [],
        upcoming: res?.upcoming ?? [],
      });
      setError("");
      setLastUpdate(new Date());
    } catch (e) {
      setError(e?.data?.message ?? "Failed to load tournaments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
    const timer = setInterval(fetchTournaments, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchTournaments]);

  const hasAny = data.ongoing.length > 0 || data.upcoming.length > 0;

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-6 pb-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">CricketApp</p>
            <h1 className="font-display text-3xl font-bold text-foreground">Tournaments</h1>
            <p className="mt-1 text-sm text-foreground-muted">Ongoing and upcoming tournaments across the platform</p>
          </div>
          {lastUpdate && (
            <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary live-dot" />
              Updated {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {loading && <Spinner />}

        {!loading && error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && hasAny && (
          <div className="space-y-8">
            <SectionCard
              title="Ongoing"
              tournaments={data.ongoing}
              emptyText="No tournaments are live right now."
            />
            <SectionCard
              title="Upcoming"
              tournaments={data.upcoming}
              emptyText="No upcoming tournaments are currently open."
            />
          </div>
        )}

        {!loading && !hasAny && !error && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant bg-white py-16 text-center">
            <Icon name="emoji_events" className="text-5xl text-outline" />
            <div>
              <p className="text-base font-bold text-foreground">No ongoing or upcoming tournaments yet</p>
              <p className="mt-1 text-sm text-foreground-muted">Check back soon for new tournaments across CricketApp.</p>
            </div>
            <Link href="/live-matches" className="cricket-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
              View Live Matches
            </Link>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
