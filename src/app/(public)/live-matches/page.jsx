"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { PublicShell } from "@/components/layout/public-shell";
import { Icon } from "@/components/ui/icon";

const POLL_MS = 15000;

function rr(runs, overs, balls) {
  const o = (overs ?? 0) + (balls ?? 0) / 6;
  return o > 0 ? (runs / o).toFixed(2) : "0.00";
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-24">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-10" />
        <span className="absolute h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/40" />
        <Icon name="sports_cricket" className="text-xl text-primary" />
      </div>
      <p className="text-sm text-foreground-muted">Loading live matches…</p>
    </div>
  );
}

function LiveMatchCard({ match }) {
  const { home, away, innings, status, code, overs_limit, venue } = match;
  const isBreak = status === "innings_break";

  return (
    <Link href={`/matches/${code}`} className="block">
      <article className="overflow-hidden rounded-2xl border-2 border-tertiary/20 bg-surface shadow-sm hover:shadow-md hover:border-tertiary/40 transition-all">
        {/* Live bar */}
        <div className="cricket-gradient flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            {isBreak ? (
              <span className="text-xs font-bold text-white/80">INNINGS BREAK</span>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-white live-dot" />
                <span className="text-xs font-bold text-white">LIVE</span>
              </>
            )}
            {innings && (
              <span className="text-xs text-white/60">
                · {innings.innings_number === 2 ? "2nd" : "1st"} innings
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] text-white/50">{code}</span>
        </div>

        <div className="p-4">
          {/* Teams + scores */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Home */}
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground truncate">{home?.name ?? "Home"}</p>
              {innings?.batting_team === home?.name ? (
                <p className="font-display text-2xl font-bold text-foreground leading-none mt-0.5">
                  {innings.total_runs}/{innings.total_wickets}
                  <span className="text-base text-foreground-muted font-normal ml-1">*</span>
                </p>
              ) : innings ? (
                <p className="text-sm text-foreground-muted mt-0.5">Yet to bat</p>
              ) : null}
            </div>

            {/* VS */}
            <div className="text-center px-1">
              <span className="font-display text-sm font-bold text-foreground-muted">VS</span>
            </div>

            {/* Away */}
            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-foreground truncate">{away?.name ?? "Away"}</p>
              {innings?.batting_team === away?.name ? (
                <p className="font-display text-2xl font-bold text-foreground leading-none mt-0.5">
                  <span className="text-base text-foreground-muted font-normal mr-1">*</span>
                  {innings.total_runs}/{innings.total_wickets}
                </p>
              ) : innings ? (
                <p className="text-sm text-foreground-muted mt-0.5">Yet to bat</p>
              ) : null}
            </div>
          </div>

          {/* Overs + RR */}
          {innings && (
            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-xs text-foreground-muted">
              <span>
                <strong className="text-foreground">{innings.total_overs}.{innings.total_balls}</strong> / {overs_limit} overs
              </span>
              <span>
                RR <strong className="text-foreground">{rr(innings.total_runs, innings.total_overs, innings.total_balls)}</strong>
              </span>
              {venue && (
                <span className="hidden sm:inline truncate max-w-[120px]">
                  <Icon name="location_on" className="" />
                  {venue}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

export default function LiveMatchesPage() {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollRef = useRef(null);

  const fetch = useCallback(async () => {
    try {
      const data = await apiRequest("/api/matches/live");
      setMatches(data.matches ?? []);
      setLastUpdate(new Date());
    } catch {
      // keep existing data on error
    }
  }, []);

  useEffect(() => {
    fetch().finally(() => setLoading(false));
    pollRef.current = setInterval(fetch, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetch]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-6 pb-16">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Live Matches</h1>
            <p className="text-sm text-foreground-muted mt-0.5">All matches happening right now across CricketApp</p>
          </div>
          {lastUpdate && (
            <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary live-dot" />
              Updated {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && matches?.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant bg-surface py-16 text-center">
          <Icon name="sports_cricket" className="text-5xl text-outline" />
          <div>
            <p className="text-base font-bold text-foreground">No live matches right now</p>
            <p className="text-sm text-foreground-muted mt-1">Check back soon — matches appear here the moment they start.</p>
          </div>
          <Link href="/login" className="cricket-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white mt-1">
            Start a Match
          </Link>
        </div>
      )}

      {!loading && matches?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m) => (
            <LiveMatchCard key={m.code} match={m} />
          ))}
        </div>
      )}
      </div>
    </PublicShell>
  );
}
