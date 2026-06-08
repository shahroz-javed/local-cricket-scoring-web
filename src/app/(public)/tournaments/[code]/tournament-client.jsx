"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { PublicShell } from "@/components/layout/public-shell";
import { Icon } from "@/components/ui/icon";

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMAT_LABEL = {
  league:          "League",
  knockout:        "Knockout",
  league_knockout: "League + Knockout",
};

const STATUS_BADGE = {
  draft:        { label: "Draft",        cls: "bg-surface-low text-foreground-muted border-outline-variant" },
  registration: { label: "Registration", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  active:       { label: "Active",       cls: "bg-green-50 text-secondary border-green-200" },
  completed:    { label: "Completed",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  cancelled:    { label: "Cancelled",    cls: "bg-red-50 text-tertiary border-red-200" },
};

const STAGE_LABEL = {
  group:         "Group Stage",
  round_of_16:   "Round of 16",
  quarter_final: "Quarter Finals",
  semi_final:    "Semi Finals",
  final:         "Final",
  third_place:   "Third Place Play-off",
};

const PRIZE_ICON = { 1: "🥇", 2: "🥈", 3: "🥉" };
const PRIZE_TYPE_ICON = { cash: "💰", trophy: "🏆", medal: "🏅", other: "🎁" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAmount(amount, currency = "PKR") {
  if (!amount) return null;
  return `${currency} ${Number(amount).toLocaleString()}`;
}

function nrrColor(nrr) {
  if (!nrr || nrr === "+0.000" || nrr === "0.000") return "text-foreground-muted";
  return nrr.startsWith("+") ? "text-secondary" : "text-tertiary";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBar({ active, tabs, onChange }) {
  return (
    <div className="flex gap-1 bg-surface-low rounded-xl p-1 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            active === t.id
              ? "bg-white text-primary shadow-sm"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          <Icon name={t.icon} className="text-base" />
          {t.label}
        </button>
      ))}
    </div>
  );
}

function WinnerCard({ tournament }) {
  if (tournament.status !== "completed" || !tournament.winner) return null;
  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 text-center">
      <div className="text-4xl mb-3">🏆</div>
      <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Champions</p>
      <h2 className="font-display text-2xl font-bold text-foreground mb-1">{tournament.winner.name}</h2>
      {tournament.runner_up && (
        <p className="text-sm text-foreground-muted mt-2">
          <span className="mr-1">🥈</span>
          <span className="font-semibold text-foreground">{tournament.runner_up.name}</span>
          <span className="ml-1">— Runners-up</span>
        </p>
      )}
      {tournament.third_place && (
        <p className="text-sm text-foreground-muted mt-1">
          <span className="mr-1">🥉</span>
          <span className="font-semibold text-foreground">{tournament.third_place.name}</span>
          <span className="ml-1">— Third Place</span>
        </p>
      )}
    </div>
  );
}

function PrizeTable({ prizes, prizePoolNote }) {
  const hasPrizes = prizes && prizes.length > 0;
  if (!hasPrizes && !prizePoolNote) return null;

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant p-5">
      <p className="font-bold text-foreground mb-4 flex items-center gap-2">
        <Icon name="emoji_events" className="text-amber-500" /> Prizes
      </p>
      {hasPrizes ? (
        <div className="space-y-2">
          {prizes.map((prize, i) => (
            <div key={prize.id ?? i} className="flex items-center gap-3 px-4 py-3 bg-surface-low rounded-xl">
              <span className="text-xl w-7 text-center">
                {PRIZE_ICON[prize.position] ?? PRIZE_TYPE_ICON[prize.prize_type] ?? "🏅"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{prize.label}</p>
                {prize.description && (
                  <p className="text-xs text-foreground-muted">{prize.description}</p>
                )}
                {prize.winner_team_id && prize.winner_team && (
                  <p className="text-xs text-secondary font-semibold mt-0.5">Won by {prize.winner_team.name}</p>
                )}
              </div>
              {prize.prize_type === "cash" && prize.cash_amount > 0 && (
                <span className="text-sm font-bold text-foreground shrink-0">
                  {fmtAmount(prize.cash_amount, prize.currency)}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-foreground-muted">{prizePoolNote}</p>
      )}
    </div>
  );
}

function QuickStats({ tournament, fixtures }) {
  const allFixtures = fixtures ? Object.values(fixtures.fixtures ?? {}).flat() : [];
  const total     = allFixtures.length;
  const played    = allFixtures.filter(f => f.match?.status === "completed").length;
  const live      = allFixtures.filter(f => f.match?.status === "active").length;
  const remaining = total - played - live;

  const next = allFixtures
    .filter(f => f.match?.status === "upcoming" && f.match?.date)
    .sort((a, b) => new Date(a.match.date) - new Date(b.match.date))[0];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Teams",     value: tournament.team_count ?? "—", icon: "groups" },
        { label: "Played",    value: played,                       icon: "check_circle" },
        { label: "Live Now",  value: live,                         icon: "sports_cricket" },
        { label: "Remaining", value: remaining,                    icon: "schedule" },
      ].map(s => (
        <div key={s.label} className="bg-surface rounded-xl border border-outline-variant p-4 text-center">
          <Icon name={s.icon} className="text-foreground-muted text-lg mb-1" />
          <p className="text-xl font-bold text-foreground">{s.value}</p>
          <p className="text-xs text-foreground-muted">{s.label}</p>
        </div>
      ))}
      {next && (
        <div className="col-span-2 sm:col-span-4 bg-surface rounded-xl border border-outline-variant p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted mb-2">Next Fixture</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground text-sm">{next.match?.title ?? "TBD vs TBD"}</p>
              {next.match?.venue && <p className="text-xs text-foreground-muted">{next.match.venue}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-foreground">{fmtDate(next.match?.date)}</p>
              <p className="text-xs text-foreground-muted capitalize">{STAGE_LABEL[next.stage] ?? next.stage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ tournament, fixtures }) {
  return (
    <div className="space-y-5">
      <WinnerCard tournament={tournament} />
      {tournament.description && (
        <div className="bg-surface rounded-2xl border border-outline-variant p-5">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{tournament.description}</p>
        </div>
      )}
      <PrizeTable prizes={tournament.prizes} prizePoolNote={tournament.prize_pool_note} />
      {(tournament.starts_at || tournament.ends_at || tournament.default_venue) && (
        <div className="bg-surface rounded-2xl border border-outline-variant p-5">
          <p className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Icon name="info" className="text-primary" /> Tournament Info
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {tournament.format && (
              <div><dt className="text-foreground-muted text-xs mb-0.5">Format</dt><dd className="font-semibold text-foreground">{FORMAT_LABEL[tournament.format]}</dd></div>
            )}
            {tournament.match_type && (
              <div><dt className="text-foreground-muted text-xs mb-0.5">Match Type</dt><dd className="font-semibold text-foreground">{tournament.match_type} ({tournament.overs_limit} overs)</dd></div>
            )}
            {tournament.starts_at && (
              <div><dt className="text-foreground-muted text-xs mb-0.5">Starts</dt><dd className="font-semibold text-foreground">{fmtDate(tournament.starts_at)}</dd></div>
            )}
            {tournament.ends_at && (
              <div><dt className="text-foreground-muted text-xs mb-0.5">Ends</dt><dd className="font-semibold text-foreground">{fmtDate(tournament.ends_at)}</dd></div>
            )}
            {tournament.default_venue && (
              <div className="sm:col-span-2"><dt className="text-foreground-muted text-xs mb-0.5">Venue</dt><dd className="font-semibold text-foreground">{tournament.default_venue}</dd></div>
            )}
          </dl>
        </div>
      )}
      <QuickStats tournament={tournament} fixtures={fixtures} />
    </div>
  );
}

// ─── Standings Tab ────────────────────────────────────────────────────────────

function StandingsTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-foreground-muted text-center py-8">No standings yet — matches in progress.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="text-foreground-muted text-xs uppercase tracking-wide border-b border-outline-variant">
            <th className="text-left py-2 px-3 font-semibold w-6">#</th>
            <th className="text-left py-2 px-3 font-semibold">Team</th>
            <th className="text-center py-2 px-2 font-semibold">P</th>
            <th className="text-center py-2 px-2 font-semibold">W</th>
            <th className="text-center py-2 px-2 font-semibold">L</th>
            <th className="text-center py-2 px-2 font-semibold">T</th>
            <th className="text-center py-2 px-2 font-semibold">NR</th>
            <th className="text-center py-2 px-2 font-semibold">Pts</th>
            <th className="text-right py-2 px-3 font-semibold">NRR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, idx) => (
            <tr key={s.team?.id ?? idx}
              className={`border-b border-outline-variant/50 transition-colors ${idx < 2 ? "hover:bg-green-50/50" : "hover:bg-surface-low"}`}>
              <td className="py-3 px-3">
                <span className={`text-xs font-bold w-5 h-5 rounded-full inline-flex items-center justify-center ${
                  idx === 0 ? "bg-amber-400 text-white" :
                  idx === 1 ? "bg-gray-300 text-foreground" :
                  idx === 2 ? "bg-amber-700/60 text-white" : "text-foreground-muted"
                }`}>
                  {s.position}
                </span>
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 cricket-gradient rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {s.team?.name?.[0] ?? "T"}
                  </div>
                  <div>
                    {s.team?.is_guest
                      ? <span className="font-semibold text-foreground">{s.team?.name}</span>
                      : <Link href={`/teams/${s.team?.code}`} className="font-semibold text-foreground hover:text-primary hover:underline">{s.team?.name}</Link>
                    }
                    {s.team?.is_guest && (
                      <span className="ml-1.5 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">Unregistered</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="text-center py-3 px-2 text-foreground">{s.played}</td>
              <td className="text-center py-3 px-2 font-semibold text-secondary">{s.won}</td>
              <td className="text-center py-3 px-2 text-tertiary">{s.lost}</td>
              <td className="text-center py-3 px-2 text-foreground-muted">{s.tied}</td>
              <td className="text-center py-3 px-2 text-foreground-muted">{s.no_result}</td>
              <td className="text-center py-3 px-2 font-bold text-foreground">{s.points}</td>
              <td className={`text-right py-3 px-3 font-mono text-xs font-semibold ${nrrColor(s.nrr)}`}>{s.nrr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StandingsTab({ standings }) {
  const [activeGroup, setActiveGroup] = useState(0);

  if (!standings) {
    return <p className="text-sm text-foreground-muted text-center py-8">Loading standings…</p>;
  }

  if (standings.standings) {
    return (
      <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
        <StandingsTable rows={standings.standings} />
      </div>
    );
  }

  if (standings.groups) {
    const groups = standings.groups;
    return (
      <div className="space-y-4">
        {groups.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {groups.map((g, i) => (
              <button key={g.id} onClick={() => setActiveGroup(i)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeGroup === i ? "cricket-gradient text-white shadow" : "bg-surface border border-outline-variant text-foreground-muted hover:text-foreground"
                }`}>
                {g.name}
              </button>
            ))}
          </div>
        )}
        <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
          <div className="px-5 pt-4 pb-1 border-b border-outline-variant">
            <p className="font-bold text-foreground text-sm">{groups[activeGroup]?.name}</p>
          </div>
          <StandingsTable rows={groups[activeGroup]?.standings ?? []} />
        </div>
      </div>
    );
  }

  return <p className="text-sm text-foreground-muted text-center py-8">Standings not available for this format.</p>;
}

// ─── Fixtures Tab ─────────────────────────────────────────────────────────────

function FixtureCard({ fixture }) {
  const match = fixture.match;
  const isLive   = match?.status === "active";
  const isDone   = match?.status === "completed";
  const teams    = match?.teams ?? [];
  const home     = teams[0];
  const away     = teams[1];
  const homeName = home?.name ?? fixture.home_placeholder ?? "TBD";
  const awayName = away?.name ?? fixture.away_placeholder ?? "TBD";

  return (
    <div className={`bg-surface rounded-xl border transition-colors ${isLive ? "border-secondary/50 shadow-sm" : "border-outline-variant"}`}>
      <div className={`h-1 rounded-t-xl ${isLive ? "cricket-gradient" : isDone ? "bg-surface-low" : "bg-outline-variant"}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-foreground-muted">
            {STAGE_LABEL[fixture.stage] ?? fixture.stage}
            {fixture.group ? ` · ${fixture.group.name}` : ""}
          </span>
          <div className="flex items-center gap-1.5">
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-secondary bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
                </span>
                Live
              </span>
            )}
            {isDone && (
              <span className="text-[10px] font-bold text-foreground-muted bg-surface-low border border-outline-variant px-2 py-0.5 rounded-full">
                Result
              </span>
            )}
            {!isLive && !isDone && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Upcoming
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {home?.is_guest ? (
              <p className="font-semibold text-foreground text-sm truncate">{homeName}</p>
            ) : home?.code ? (
              <Link href={`/teams/${home.code}`} className="font-semibold text-foreground text-sm truncate hover:text-primary hover:underline block">{homeName}</Link>
            ) : (
              <p className="font-semibold text-foreground-muted text-sm truncate italic">{homeName}</p>
            )}
          </div>
          <span className="text-xs font-bold text-foreground-muted px-2">vs</span>
          <div className="flex-1 min-w-0 text-right">
            {away?.is_guest ? (
              <p className="font-semibold text-foreground text-sm truncate">{awayName}</p>
            ) : away?.code ? (
              <Link href={`/teams/${away.code}`} className="font-semibold text-foreground text-sm truncate hover:text-primary hover:underline block">{awayName}</Link>
            ) : (
              <p className="font-semibold text-foreground-muted text-sm truncate italic">{awayName}</p>
            )}
          </div>
        </div>

        {(match?.date || match?.venue || fixture.is_overridden) && (
          <div className="mt-2 pt-2 border-t border-outline-variant/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-foreground-muted">
              {match?.date && <span className="flex items-center gap-1"><Icon name="calendar_today" className="text-sm" />{fmtDate(match.date)}</span>}
              {match?.venue && <span className="flex items-center gap-1"><Icon name="location_on" className="text-sm" />{match.venue}</span>}
              {fixture.is_overridden && <span className="text-amber-600 font-semibold">Walkover</span>}
            </div>
            {match?.code && (isDone || isLive) && (
              <Link href={`/matches/${match.code}`}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                {isLive ? "Watch" : "Scorecard"} <Icon name="chevron_right" className="text-sm" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FixturesTab({ fixtures }) {
  const [activeStage, setActiveStage] = useState("all");

  if (!fixtures) {
    return <p className="text-sm text-foreground-muted text-center py-8">Loading fixtures…</p>;
  }

  const stageMap = fixtures.fixtures ?? {};
  const stages   = Object.keys(stageMap);

  if (stages.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="sports_cricket" className="text-4xl text-foreground-muted mb-3" />
        <p className="font-semibold text-foreground">No fixtures yet</p>
        <p className="text-sm text-foreground-muted mt-1">Fixtures will appear once the organiser generates them.</p>
      </div>
    );
  }

  const liveFirst = (a, b) => {
    const order = { active: 0, upcoming: 1, completed: 2 };
    return (order[a.match?.status] ?? 1) - (order[b.match?.status] ?? 1);
  };

  const displayStages = activeStage === "all" ? stages : stages.filter(s => s === activeStage);
  const stageFilters = ["all", ...stages];

  return (
    <div className="space-y-4">
      {stages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {stageFilters.map(s => (
            <button key={s} onClick={() => setActiveStage(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeStage === s ? "cricket-gradient text-white" : "bg-surface border border-outline-variant text-foreground-muted hover:text-foreground"
              }`}>
              {s === "all" ? "All Stages" : STAGE_LABEL[s] ?? s}
            </button>
          ))}
        </div>
      )}

      {displayStages.map(stage => {
        const fixturesInStage = [...(stageMap[stage] ?? [])].sort(liveFirst);
        if (fixturesInStage.length === 0) return null;
        return (
          <div key={stage}>
            <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted mb-2 px-1">
              {STAGE_LABEL[stage] ?? stage}
            </p>
            <div className="space-y-2">
              {fixturesInStage.map(f => <FixtureCard key={f.id} fixture={f} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ stats }) {
  const [view, setView] = useState("batting");

  if (!stats) {
    return <p className="text-sm text-foreground-muted text-center py-8">Loading stats…</p>;
  }

  const batsmen = stats.top_run_scorers ?? [];
  const bowlers = stats.top_wicket_takers ?? [];

  if (batsmen.length === 0 && bowlers.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="bar_chart" className="text-4xl text-foreground-muted mb-3" />
        <p className="font-semibold text-foreground">No stats yet</p>
        <p className="text-sm text-foreground-muted mt-1">Stats appear once matches are completed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setView("batting")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${view === "batting" ? "cricket-gradient text-white" : "bg-surface border border-outline-variant text-foreground-muted"}`}>
          <Icon name="sports_cricket" className="text-base mr-1" />
          Batting
        </button>
        <button onClick={() => setView("bowling")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${view === "bowling" ? "cricket-gradient text-white" : "bg-surface border border-outline-variant text-foreground-muted"}`}>
          <Icon name="sports_cricket" className="text-base mr-1" />
          Bowling
        </button>
      </div>

      {view === "batting" && (
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant">
              <p className="font-bold text-foreground text-sm">Top Run Scorers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="text-foreground-muted text-xs uppercase tracking-wide border-b border-outline-variant">
                    <th className="text-left py-2 px-4 font-semibold">Player</th>
                    <th className="text-center py-2 px-3 font-semibold">Runs</th>
                    <th className="text-center py-2 px-3 font-semibold">Balls</th>
                    <th className="text-center py-2 px-3 font-semibold">4s</th>
                    <th className="text-center py-2 px-3 font-semibold">6s</th>
                    <th className="text-right py-2 px-4 font-semibold">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {batsmen.map((b, i) => (
                    <tr key={i} className="border-b border-outline-variant/50 hover:bg-surface-low">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground-muted w-4">{i + 1}</span>
                          <span className="font-semibold text-foreground">{b.player ?? "—"}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3 font-bold text-foreground">{b.runs}</td>
                      <td className="text-center py-3 px-3 text-foreground-muted">{b.balls}</td>
                      <td className="text-center py-3 px-3 text-foreground-muted">{b.fours}</td>
                      <td className="text-center py-3 px-3 text-foreground-muted">{b.sixes}</td>
                      <td className="text-right py-3 px-4 font-mono text-xs text-foreground">{b.strike_rate}</td>
                    </tr>
                  ))}
                  {batsmen.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-6 text-foreground-muted text-sm">No batting data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Sixes Table */}
            <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
              <div className="px-5 py-3 border-b border-outline-variant">
                <p className="font-bold text-foreground text-sm">Most Sixes</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[300px]">
                  <thead>
                    <tr className="text-foreground-muted text-xs uppercase tracking-wide border-b border-outline-variant">
                      <th className="text-left py-2 px-4 font-semibold">Player</th>
                      <th className="text-right py-2 px-4 font-semibold">Sixes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.most_sixes ?? []).map((b, i) => (
                      <tr key={i} className="border-b border-outline-variant/50 hover:bg-surface-low">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground-muted w-4">{i + 1}</span>
                            <span className="font-semibold text-foreground">{b.player ?? "—"}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-bold text-foreground">{b.sixes}</td>
                      </tr>
                    ))}
                    {(stats.most_sixes ?? []).length === 0 && (
                      <tr><td colSpan={2} className="text-center py-6 text-foreground-muted text-sm">No sixes hit yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Best Strike Rate Table */}
            <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
              <div className="px-5 py-3 border-b border-outline-variant">
                <p className="font-bold text-foreground text-sm">Best Strike Rate <span className="text-xs font-normal text-foreground-muted">(min 10 balls)</span></p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[300px]">
                  <thead>
                    <tr className="text-foreground-muted text-xs uppercase tracking-wide border-b border-outline-variant">
                      <th className="text-left py-2 px-4 font-semibold">Player</th>
                      <th className="text-center py-2 px-3 font-semibold">Runs</th>
                      <th className="text-center py-2 px-3 font-semibold">Balls</th>
                      <th className="text-right py-2 px-4 font-semibold">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.best_strike_rate ?? []).map((b, i) => (
                      <tr key={i} className="border-b border-outline-variant/50 hover:bg-surface-low">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground-muted w-4">{i + 1}</span>
                            <span className="font-semibold text-foreground">{b.player ?? "—"}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-3 text-foreground-muted">{b.runs}</td>
                        <td className="text-center py-3 px-3 text-foreground-muted">{b.balls}</td>
                        <td className="text-right py-3 px-4 font-mono text-xs font-bold text-foreground">{b.strike_rate}</td>
                      </tr>
                    ))}
                    {(stats.best_strike_rate ?? []).length === 0 && (
                      <tr><td colSpan={4} className="text-center py-6 text-foreground-muted text-sm">No batting data yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "bowling" && (
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant">
              <p className="font-bold text-foreground text-sm">Top Wicket Takers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="text-foreground-muted text-xs uppercase tracking-wide border-b border-outline-variant">
                    <th className="text-left py-2 px-4 font-semibold">Player</th>
                    <th className="text-center py-2 px-3 font-semibold">Wkts</th>
                    <th className="text-center py-2 px-3 font-semibold">Runs</th>
                    <th className="text-right py-2 px-4 font-semibold">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {bowlers.map((b, i) => (
                    <tr key={i} className="border-b border-outline-variant/50 hover:bg-surface-low">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground-muted w-4">{i + 1}</span>
                          <span className="font-semibold text-foreground">{b.player ?? "—"}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3 font-bold text-foreground">{b.wickets}</td>
                      <td className="text-center py-3 px-3 text-foreground-muted">{b.runs}</td>
                      <td className="text-right py-3 px-4 font-mono text-xs text-foreground">{b.economy}</td>
                    </tr>
                  ))}
                  {bowlers.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-6 text-foreground-muted text-sm">No bowling data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best Economy Table */}
          <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant">
              <p className="font-bold text-foreground text-sm">Best Economy <span className="text-xs font-normal text-foreground-muted">(min 3 overs)</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="text-foreground-muted text-xs uppercase tracking-wide border-b border-outline-variant">
                    <th className="text-left py-2 px-4 font-semibold">Player</th>
                    <th className="text-center py-2 px-3 font-semibold">Overs</th>
                    <th className="text-center py-2 px-3 font-semibold">Runs</th>
                    <th className="text-right py-2 px-4 font-semibold">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.best_economy ?? []).map((b, i) => (
                    <tr key={i} className="border-b border-outline-variant/50 hover:bg-surface-low">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground-muted w-4">{i + 1}</span>
                          <span className="font-semibold text-foreground">{b.player ?? "—"}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3 text-foreground-muted">{b.overs}</td>
                      <td className="text-center py-3 px-3 text-foreground-muted">{b.runs}</td>
                      <td className="text-right py-3 px-4 font-mono text-xs font-bold text-foreground">{b.economy}</td>
                    </tr>
                  ))}
                  {(stats.best_economy ?? []).length === 0 && (
                    <tr><td colSpan={4} className="text-center py-6 text-foreground-muted text-sm">No bowling data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QR Code Modal ───────────────────────────────────────────────────────────

function QRModal({ url, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 220,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      });
    });
  }, [url]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <p className="font-bold text-gray-900 text-base">Tournament QR Code</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="close" className="" />
          </button>
        </div>
        <canvas ref={canvasRef} className="rounded-xl" />
        <p className="text-[10px] text-gray-400 text-center break-all font-mono">{url}</p>
        <button
          onClick={() => { navigator.clipboard?.writeText(url); }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors py-2.5 text-sm font-semibold text-gray-700"
        >
          <Icon name="content_copy" className="" />
          Copy link
        </button>
      </div>
    </div>
  );
}

// ─── Share Tournament Card Canvas Generator ───────────────────────────────────

function shareTournamentCard(tournament, fixtures) {
  const canvas = document.createElement("canvas");
  const DPR = window.devicePixelRatio || 1;
  const W = 800, H = 420;
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width  = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#004ac6");
  grad.addColorStop(1, "#0d2b5c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative circles
  ctx.beginPath();
  ctx.arc(W + 50, -50, 300, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-50, H + 50, 250, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.fill();

  // Branding
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font      = "bold 14px system-ui, sans-serif";
  ctx.fillText("CricketApp  ·  Tournament", 36, 40);

  // Tournament Title
  ctx.fillStyle = "#ffffff";
  ctx.font      = "bold 36px system-ui, sans-serif";
  let title = tournament.title || "Tournament";
  if (title.length > 30) {
    title = title.substring(0, 27) + "...";
  }
  ctx.fillText(title, 36, 95);

  // Format and Match Type
  const formatLabel = {
    league: "League (Round-Robin)",
    knockout: "Knockout",
    league_knockout: "League + Knockout"
  }[tournament.format] ?? "Tournament";

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font      = "500 16px system-ui, sans-serif";
  ctx.fillText(`${formatLabel}  ·  ${tournament.overs_limit} Overs (${tournament.match_type})`, 36, 130);

  // Status & Date info
  const dateStr = [
    tournament.starts_at ? new Date(tournament.starts_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "",
    tournament.ends_at ? new Date(tournament.ends_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : ""
  ].filter(Boolean).join(" - ");

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font      = "14px system-ui, sans-serif";
  ctx.fillText(`${dateStr || "Upcoming"}  ·  ${tournament.team_count ?? 0} Teams`, 36, 158);

  // Center Winner / Runner-up info (if completed)
  if (tournament.status === "completed" && tournament.winner) {
    ctx.fillStyle = "rgba(252, 211, 77, 0.1)";
    ctx.strokeStyle = "rgba(252, 211, 77, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(36, 185, W - 72, 140, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.font      = "bold 13px system-ui, sans-serif";
    ctx.fillText("🏆  CHAMPIONS", 56, 215);

    ctx.fillStyle = "#ffffff";
    ctx.font      = "bold 28px system-ui, sans-serif";
    ctx.fillText(tournament.winner.name, 56, 255);

    if (tournament.runner_up) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font      = "15px system-ui, sans-serif";
      ctx.fillText(`Runner-up: ${tournament.runner_up.name}`, 56, 295);
    }
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(36, 185, W - 72, 140, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font      = "bold 13px system-ui, sans-serif";
    ctx.fillText("TOURNAMENT STATUS", 56, 215);

    const allFixtures = fixtures ? Object.values(fixtures.fixtures ?? {}).flat() : [];
    const total = allFixtures.length;
    const played = allFixtures.filter(f => f.match?.status === "completed").length;

    ctx.fillStyle = "#ffffff";
    ctx.font      = "bold 32px system-ui, sans-serif";
    ctx.fillText(`${played} / ${total}`, 56, 260);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font      = "14px system-ui, sans-serif";
    ctx.fillText("Matches Completed", 56, 285);

    if (tournament.default_venue) {
      ctx.fillStyle = "#ffffff";
      ctx.font      = "500 16px system-ui, sans-serif";
      ctx.fillText(tournament.default_venue, W - 320, 240);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font      = "13px system-ui, sans-serif";
      ctx.fillText("Default Venue", W - 320, 262);
    }
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font      = "12px monospace";
  ctx.fillText(`Code: ${tournament.code}`, 36, H - 30);

  ctx.textAlign = "right";
  ctx.fillText("cricketapp.live", W - 36, H - 30);
  ctx.textAlign = "left";

  canvas.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${tournament.code}-share.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, "image/png");
}

// ─── Share Modal Component ───────────────────────────────────────────────────

function ShareModal({ tournament, fixtures, onClose }) {
  const [showQR, setShowQR] = useState(false);
  const [copying, setCopying] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";

  function copyLink() {
    setCopying(true);
    navigator.clipboard?.writeText(url);
    setTimeout(() => setCopying(false), 2000);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900 text-base">Share Tournament</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Icon name="close" className="" />
            </button>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={copyLink}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-100 text-left"
            >
              <div className="flex items-center gap-2">
                <Icon name={copying ? "check" : "content_copy"} className={copying ? "text-green-600 animate-pulse" : ""} />
                <span>{copying ? "Link Copied!" : "Copy Link"}</span>
              </div>
              <Icon name="chevron_right" className="text-gray-400" />
            </button>

            <button
              onClick={() => setShowQR(true)}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-100 text-left"
            >
              <div className="flex items-center gap-2">
                <Icon name="qr_code" className="" />
                <span>Show QR Code</span>
              </div>
              <Icon name="chevron_right" className="text-gray-400" />
            </button>

            <button
              onClick={() => {
                shareTournamentCard(tournament, fixtures);
              }}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-100 text-left"
            >
              <div className="flex items-center gap-2">
                <Icon name="download" className="" />
                <span>Download Share Card</span>
              </div>
              <Icon name="chevron_right" className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {showQR && (
        <QRModal url={url} onClose={() => setShowQR(false)} />
      )}
    </>
  );
}

// ─── Main Hub Component ───────────────────────────────────────────────────────

export function TournamentHub({ code, initialData }) {
  const [tournament, setTournament] = useState(initialData?.tournament ?? null);
  const [standings,  setStandings]  = useState(initialData?.standings  ?? null);
  const [fixtures,   setFixtures]   = useState(initialData?.fixtures   ?? null);
  const [stats,      setStats]      = useState(initialData?.stats      ?? null);
  const [loading,    setLoading]    = useState(!initialData);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [showShare,  setShowShare]  = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s, f, st] = await Promise.allSettled([
        apiRequest(`/api/tournaments/${code}`),
        apiRequest(`/api/tournaments/${code}/standings`),
        apiRequest(`/api/tournaments/${code}/fixtures`),
        apiRequest(`/api/tournaments/${code}/stats`),
      ]);
      if (t.status === "fulfilled")  setTournament(t.value);
      else setError("Tournament not found.");
      if (s.status === "fulfilled")  setStandings(s.value);
      if (f.status === "fulfilled")  setFixtures(f.value);
      if (st.status === "fulfilled") setStats(st.value);
    } catch {
      setError("Failed to load tournament.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (!initialData) fetchAll();
  }, [fetchAll, initialData]);

  if (loading) {
    return (
      <PublicShell>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Icon name="sports_cricket" className="text-5xl text-foreground-muted mb-4 animate-pulse" />
          <p className="text-foreground-muted">Loading tournament…</p>
        </div>
      </PublicShell>
    );
  }

  if (error || !tournament) {
    return (
      <PublicShell>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Icon name="error_outline" className="text-5xl text-tertiary mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Tournament Not Found</h1>
          <p className="text-foreground-muted mb-6">{error ?? "This tournament does not exist or has been removed."}</p>
          <Link href="/tournaments/live" className="cricket-gradient text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2">
            <Icon name="arrow_back" className="text-base" /> Browse Tournaments
          </Link>
        </div>
      </PublicShell>
    );
  }

  const badge   = STATUS_BADGE[tournament.status] ?? STATUS_BADGE.draft;
  const showStandings = tournament.format !== "knockout";
  const showBracket   = tournament.format !== "league";

  const tabs = [
    { id: "overview",  label: "Overview",  icon: "info" },
    ...(showStandings ? [{ id: "standings", label: "Standings", icon: "table_rows" }] : []),
    { id: "fixtures",  label: "Fixtures",  icon: "event" },
    ...(showBracket   ? [{ id: "bracket",   label: "Bracket",   icon: "account_tree" }] : []),
    { id: "stats",     label: "Stats",     icon: "bar_chart" },
  ];

  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto px-4 pb-12">

        {/* ── Banner ── */}
        {tournament.banner_url ? (
          <div className="relative h-48 sm:h-64 -mx-4 mb-0 overflow-hidden">
            <img src={tournament.banner_url} alt={tournament.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-36 -mx-4 cricket-gradient flex items-center justify-center mb-0 relative overflow-hidden">
            <Icon name="emoji_events" className="text-white/20 text-[10rem] absolute -right-8 -top-4" />
            <div className="relative z-10 text-center px-8">
              <Icon name="emoji_events" className="text-white/80 text-5xl mb-2" />
            </div>
          </div>
        )}

        {/* ── Tournament header ── */}
        <div className="bg-surface border-b border-outline-variant px-5 py-5 -mx-4 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-display text-2xl font-bold text-foreground">{tournament.title}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
                <span className="flex items-center gap-1">
                  <Icon name="sports_cricket" className="text-sm" />
                  {FORMAT_LABEL[tournament.format]}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="timer" className="text-sm" />
                  {tournament.overs_limit} overs · {tournament.match_type}
                </span>
                {tournament.organiser && (
                  <span className="flex items-center gap-1">
                    <Icon name="person" className="text-sm" />
                    Org: {tournament.organiser.name}
                  </span>
                )}
                <span className="font-mono">{tournament.code}</span>
              </div>
            </div>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant rounded-xl text-xs font-semibold text-foreground-muted hover:bg-surface-low transition-colors shrink-0"
            >
              <Icon name="share" className="text-base" /> Share
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mb-5">
          <TabBar active={activeTab} tabs={tabs} onChange={setActiveTab} />
        </div>

        {/* ── Tab content ── */}
        {activeTab === "overview"  && <OverviewTab  tournament={tournament} fixtures={fixtures} />}
        {activeTab === "standings" && <StandingsTab standings={standings} />}
        {activeTab === "fixtures"  && <FixturesTab  fixtures={fixtures} />}
        {activeTab === "bracket"   && (
          <div className="text-center py-16 bg-surface rounded-2xl border border-outline-variant">
            <Icon name="account_tree" className="text-5xl text-foreground-muted mb-3" />
            <p className="font-semibold text-foreground mb-1">Bracket Visualization</p>
            <p className="text-sm text-foreground-muted">Coming in P8 — SVG knockout bracket.</p>
          </div>
        )}
        {activeTab === "stats"     && <StatsTab     stats={stats} />}

      </div>

      {showShare && (
        <ShareModal
          tournament={tournament}
          fixtures={fixtures}
          onClose={() => setShowShare(false)}
        />
      )}
    </PublicShell>
  );
}
