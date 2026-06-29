"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Icon } from "@/components/ui/icon";
import { useUser } from "@/lib/user-context";
import { apiRequest } from "@/lib/api";

const FORMAT_LABELS = {
  league: "League",
  knockout: "Knockout",
  league_knockout: "League + Knockout",
};

const STATUS_BADGE = {
  draft: {
    label: "Draft",
    cls: "bg-surface-low text-foreground-muted border border-outline-variant",
  },
  registration: {
    label: "Registration",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  active: {
    label: "Active",
    cls: "bg-green-50 text-secondary border border-green-200",
  },
  completed: {
    label: "Completed",
    cls: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-red-50 text-tertiary border border-red-200",
  },
};

export default function TournamentsPage() {
  const { token } = useUser();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/tournaments", { token })
      .then((data) => {
        // console.log("tournaments", data);
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setTournaments(list);
        setError("");
      })
      .catch((err) => setError(err?.message || "Failed to load tournaments."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AppShell title="Tournaments" subtitle="Manage your cricket tournaments">
      <div className="max-w-4xl">
        {/* Header action */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-foreground-muted">
            {loading
              ? "Loading…"
              : `${tournaments.length} tournament${tournaments.length !== 1 ? "s" : ""}`}
          </p>
          <Link
            href="/create-tournament"
            className="flex items-center gap-2 cricket-gradient text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md"
          >
            <Icon name="add" className="text-base" />
            New Tournament
          </Link>
        </div>

        {/* Error state */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
            <Icon
              name="error_outline"
              className="text-tertiary text-xl shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-tertiary">
                Could not load tournaments
              </p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && tournaments.length === 0 && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-12 text-center">
            <div className="w-16 h-16 gold-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="emoji_events" className="text-3xl text-white" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              No tournaments yet
            </h3>
            <p className="text-foreground-muted text-sm mb-6 max-w-sm mx-auto">
              Create your first tournament — league, knockout, or combined.
              Fixtures generate automatically.
            </p>
            <Link
              href="/create-tournament"
              className="inline-flex items-center gap-2 cricket-gradient text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md"
            >
              <Icon name="add" className="text-base" /> Create Tournament
            </Link>
          </div>
        )}

        {/* Tournament list */}
        {!loading && !error && tournaments.length > 0 && (
          <div className="space-y-3">
            {tournaments.map((t) => {
              const badge = STATUS_BADGE[t.status] ?? STATUS_BADGE.draft;
              return (
                <div
                  key={t.code}
                  className="bg-surface rounded-2xl border border-outline-variant overflow-hidden hover:border-primary/40 transition-colors"
                >
                  <div className="h-1 cricket-gradient" />
                  <div className="p-5 flex items-start gap-4">
                    {/* Trophy icon */}
                    <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center shrink-0">
                      <Icon
                        name="emoji_events"
                        className="text-2xl text-white"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-display font-bold text-foreground truncate">
                          {t.title}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <Icon name="sports_cricket" className="text-sm" />
                          {FORMAT_LABELS[t.format]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="groups" className="text-sm" />
                          {t.team_count ?? 0} teams
                        </span>
                        <span className="font-mono">{t.code}</span>
                        {t.starts_at && (
                          <span className="flex items-center gap-1">
                            <Icon name="calendar_today" className="text-sm" />
                            {t.starts_at}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/tournaments/${t.code}`}
                        className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold text-foreground hover:bg-surface-low transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/tournaments/${t.code}/manage`}
                        className="px-3 py-1.5 cricket-gradient text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-all"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
