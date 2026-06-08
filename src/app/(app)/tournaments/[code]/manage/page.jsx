"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Icon } from "@/components/ui/icon";
import { useUser } from "@/lib/user-context";
import { apiRequest } from "@/lib/api";

export default function TournamentManagePage() {
  const { code }          = useParams();
  const { token }         = useUser();
  const router            = useRouter();
  const [tourn, setTourn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [generating, setGenerating] = useState(false);
  const [teamCode, setTeamCode]     = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [teamMsg, setTeamMsg]       = useState("");

  async function load() {
    try {
      const res = await apiRequest(`/api/tournaments/${code}`, { token });
      if (!res.ok) { setError("Tournament not found."); return; }
      setTourn(await res.json());
    } catch { setError("Failed to load tournament."); }
    finally   { setLoading(false); }
  }

  useEffect(() => { load(); }, [code, token]);

  async function generateFixtures() {
    setGenerating(true);
    try {
      const res = await apiRequest(`/api/tournaments/${code}/generate-fixtures`, { method: "POST", token });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Failed to generate fixtures."); return; }
      alert(`${data.fixture_count} fixtures generated!`);
      load();
    } catch { alert("Something went wrong."); }
    finally  { setGenerating(false); }
  }

  async function addTeam(e) {
    e.preventDefault();
    if (!teamCode.trim()) return;
    setAddingTeam(true);
    setTeamMsg("");
    try {
      const res  = await apiRequest(`/api/tournaments/${code}/teams`, {
        method: "POST", token, body: { team_code: teamCode.trim().toUpperCase() },
      });
      const data = await res.json();
      if (!res.ok) { setTeamMsg(data.message || "Failed to add team."); return; }
      setTeamMsg(`✓ ${data.team.name} added.`);
      setTeamCode("");
      load();
    } catch { setTeamMsg("Something went wrong."); }
    finally  { setAddingTeam(false); }
  }

  if (loading) return <AppShell title="Manage Tournament"><div className="text-foreground-muted text-sm">Loading…</div></AppShell>;
  if (error)   return <AppShell title="Manage Tournament"><div className="text-tertiary text-sm">{error}</div></AppShell>;

  const teams = tourn.tournamentTeams ?? [];

  return (
    <AppShell title={tourn.title} subtitle={`Manage · ${tourn.code}`}>
      <div className="max-w-3xl space-y-6">

        {/* Status + quick actions */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted mb-1">Status</p>
            <p className="font-bold text-foreground capitalize">{tourn.status}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/tournaments/${code}`} target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
              <Icon name="open_in_new" className="text-base" /> Public Page
            </Link>
            {tourn.status !== "active" && tourn.status !== "completed" && (
              <button onClick={generateFixtures} disabled={generating}
                className="flex items-center gap-1.5 px-4 py-2 cricket-gradient text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
                {generating
                  ? <><Icon name="sync" className="text-base animate-spin" /> Generating…</>
                  : <><Icon name="auto_fix_high" className="text-base" /> Generate Fixtures</>}
              </button>
            )}
          </div>
        </div>

        {/* Add team */}
        {tourn.status !== "active" && tourn.status !== "completed" && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-5">
            <p className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Icon name="group_add" className="text-primary" /> Add Team
            </p>
            <form onSubmit={addTeam} className="flex gap-2">
              <input
                value={teamCode}
                onChange={e => setTeamCode(e.target.value)}
                placeholder="TEAM-XXXX"
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" disabled={addingTeam}
                className="px-4 py-2.5 cricket-gradient text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                {addingTeam ? "Adding…" : "Add"}
              </button>
            </form>
            {teamMsg && (
              <p className={`text-xs mt-2 ${teamMsg.startsWith("✓") ? "text-secondary" : "text-tertiary"}`}>{teamMsg}</p>
            )}
          </div>
        )}

        {/* Teams list */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5">
          <p className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Icon name="groups" className="text-primary" /> Teams ({teams.filter(t => t.status !== "withdrawn").length})
          </p>
          {teams.length === 0 ? (
            <p className="text-sm text-foreground-muted text-center py-6">No teams added yet.</p>
          ) : (
            <div className="space-y-2">
              {teams.filter(t => t.status !== "withdrawn").map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 bg-surface-low rounded-xl">
                  <div className="w-8 h-8 cricket-gradient rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {entry.team?.name?.[0] ?? "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{entry.team?.name}</p>
                    <p className="text-xs text-foreground-muted font-mono">{entry.team?.code}</p>
                  </div>
                  {entry.team?.is_guest && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Guest</span>
                  )}
                  {tourn.entry_fee_amount > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                      ${entry.fee_status === "paid"    ? "bg-green-50 text-secondary border-green-200"
                      : entry.fee_status === "partial" ? "bg-amber-50 text-amber-700 border-amber-200"
                      :                                  "bg-red-50 text-tertiary border-red-200"}`}>
                      {entry.fee_status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Format",    value: tourn.format?.replace("_", "+") },
            { label: "Overs",     value: tourn.overs_limit + " ov" },
            { label: "Match Type",value: tourn.match_type },
            { label: "Teams",     value: teams.filter(t => t.status !== "withdrawn").length },
          ].map(s => (
            <div key={s.label} className="bg-surface rounded-xl border border-outline-variant p-4 text-center">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
