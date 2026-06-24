"use client";

import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Icon } from "@/components/ui/icon";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Result Badge ─────────────────────────────────────────────────────────────

function ResultBadge({ result }) {
  const map = {
    won:          "bg-emerald-100 text-emerald-700",
    lost:         "bg-red-100 text-red-700",
    tie:          "bg-amber-100 text-amber-700",
    abandoned:    "bg-gray-100 text-gray-500",
    live:         "bg-blue-100 text-blue-700",
    innings_break:"bg-blue-100 text-blue-700",
    upcoming:     "bg-gray-100 text-gray-400",
  };
  const label = {
    won: "Won", lost: "Lost", tie: "Tie",
    abandoned: "Abandoned", live: "Live",
    innings_break: "Live", upcoming: "Upcoming",
  };
  const cls = map[result] ?? "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {label[result] ?? result}
    </span>
  );
}

// ─── Win/Loss Record ──────────────────────────────────────────────────────────

function RecordCard({ record }) {
  const { played, won, lost, tied, win_pct } = record;
  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Team Record</span>
      </div>
      <div className="grid grid-cols-4 divide-x divide-gray-100">
        {[
          { label: "Played", value: played },
          { label: "Won",    value: won,    color: "text-emerald-600" },
          { label: "Lost",   value: lost,   color: "text-red-500" },
          { label: "Win %",  value: `${win_pct}%`, color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="py-4 text-center">
            <p className={`text-2xl font-black tabular-nums ${color ?? "text-gray-900"}`}>{value}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {played > 0 && (
        <div className="px-4 pb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${win_pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Top Performers ───────────────────────────────────────────────────────────

function TopPerformers({ topScorer, topWicketTaker }) {
  if (!topScorer && !topWicketTaker) return null;
  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">All-Time Leaders</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="px-4 py-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Scorer</p>
          {topScorer ? (
            <Link
              href={topScorer.team_member_id ? `/players/${topScorer.team_member_id}` : "#"}
              className="group"
            >
              <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {topScorer.name}
              </p>
              <p className="text-2xl font-black text-blue-600 tabular-nums mt-0.5">{topScorer.runs}</p>
              <p className="text-[10px] text-gray-400">career runs</p>
            </Link>
          ) : <p className="text-xs text-gray-300">No data</p>}
        </div>
        <div className="px-4 py-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Wickets</p>
          {topWicketTaker ? (
            <Link
              href={topWicketTaker.team_member_id ? `/players/${topWicketTaker.team_member_id}` : "#"}
              className="group"
            >
              <p className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                {topWicketTaker.name}
              </p>
              <p className="text-2xl font-black text-purple-600 tabular-nums mt-0.5">{topWicketTaker.wickets}</p>
              <p className="text-[10px] text-gray-400">career wickets</p>
            </Link>
          ) : <p className="text-xs text-gray-300">No data</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Recent Matches ───────────────────────────────────────────────────────────

function RecentMatches({ matches }) {
  if (!matches?.length) return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Recent Matches</span>
      </div>
      <p className="px-4 py-8 text-center text-sm text-gray-400">No matches played yet.</p>
    </div>
  );

  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Recent Matches</span>
        <span className="text-[10px] text-gray-400">Last {matches.length}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {matches.map((m) => (
          <Link
            key={m.match_code}
            href={`/matches/${m.match_code}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="shrink-0 w-16 text-center space-y-1">
              <p className="text-[10px] text-gray-400 leading-tight">{fmtDate(m.date)}</p>
              <ResultBadge result={m.result} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">vs {m.opponent}</p>
              <div className="mt-1 space-y-0.5">
                {m.scores?.map((s, i) => (
                  <p key={i} className="text-[10px] text-gray-500 tabular-nums">
                    <span className="font-medium text-gray-700">{s.team}</span>
                    {" "}{s.runs}/{s.wickets} ({s.overs} ov)
                  </p>
                ))}
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-200 text-base shrink-0">chevron_right</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Tournament History ───────────────────────────────────────────────────────

const FORMAT_LABELS = {
  league:           "League",
  knockout:         "Knockout",
  league_knockout:  "League + KO",
};

const BADGE_CONFIG = {
  champion:    { icon: "emoji_events", label: "Champions",   cls: "bg-amber-100 text-amber-700 border-amber-300" },
  runner_up:   { icon: "military_tech", label: "Runners-up", cls: "bg-gray-100 text-gray-600 border-gray-300" },
  third_place: { icon: "workspace_premium", label: "3rd Place", cls: "bg-orange-100 text-orange-700 border-orange-300" },
};

const STATUS_CONFIG = {
  registration: { label: "Registration", cls: "bg-blue-100 text-blue-700" },
  active:       { label: "Active",       cls: "bg-green-100 text-green-700" },
  completed:    { label: "Completed",    cls: "bg-gray-100 text-gray-500" },
  cancelled:    { label: "Cancelled",    cls: "bg-red-100 text-red-500" },
};

function TournamentHistory({ tournaments }) {
  if (!tournaments?.length) return null;

  return (
    <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
            emoji_events
          </span>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tournament History</span>
        </div>
        <span className="text-[10px] text-gray-400">{tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="divide-y divide-gray-100">
        {tournaments.map((t) => {
          const badge  = t.badge ? BADGE_CONFIG[t.badge] : null;
          const status = STATUS_CONFIG[t.status] ?? { label: t.status, cls: "bg-gray-100 text-gray-500" };
          const nrr    = t.standing?.nrr != null
            ? (t.standing.nrr >= 0 ? "+" : "") + Number(t.standing.nrr).toFixed(3)
            : null;

          return (
            <Link key={t.code} href={`/tournaments/${t.code}`}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">

              {/* Icon column */}
              <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ${
                badge ? badge.cls : "bg-gray-50 border-gray-200 text-gray-400"
              }`}>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {badge ? badge.icon : "sports_cricket"}
                </span>
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-gray-400">
                        {FORMAT_LABELS[t.format] ?? t.format}
                      </span>
                      {t.starts_at && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(t.starts_at).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {badge ? (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    ) : (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    )}
                    {t.entry_status === "withdrawn" && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">
                        Withdrawn
                      </span>
                    )}
                  </div>
                </div>

                {/* Standing row */}
                {t.standing && (
                  <div className="flex items-center gap-3 mt-1.5">
                    {t.standing.position && (
                      <span className="text-[10px] font-bold text-gray-500">
                        #{t.standing.position} in group
                      </span>
                    )}
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] text-gray-500 tabular-nums">
                      {t.standing.played}M · {t.standing.won}W · {t.standing.lost}L · {t.standing.points}pts
                    </span>
                    {nrr && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className={`text-[10px] font-semibold tabular-nums ${
                          t.standing.nrr >= 0 ? "text-emerald-600" : "text-red-500"
                        }`}>
                          NRR {nrr}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <span className="material-symbols-outlined text-gray-200 text-base shrink-0 mt-1">chevron_right</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Client Component ─────────────────────────────────────────────────────────

export default function TeamProfileClient({ data }) {
  const { team, record, top_scorer, top_wicket_taker, recent_matches, tournaments } = data;

  return (
    <PublicShell>
      <div className="max-w-2xl mx-auto space-y-3 px-0 sm:px-4 pb-10">

        <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-gray-200 overflow-hidden">
          <div className="cricket-gradient px-5 py-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black text-white truncate">{team.name}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm text-white/70">
                    <span className="font-mono">{team.code}</span>
                  </span>
                  <span className="text-white/40">·</span>
                  <span className="text-sm text-white/70">{team.members} members</span>
                  {team.captain && (
                    <>
                      <span className="text-white/40">·</span>
                      <span className="text-sm text-white/70">Capt: {team.captain}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <RecordCard record={record} />
        <TopPerformers topScorer={top_scorer} topWicketTaker={top_wicket_taker} />
        <RecentMatches matches={recent_matches} />
        <TournamentHistory tournaments={tournaments ?? []} />

      </div>
    </PublicShell>
  );
}
