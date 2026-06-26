"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Icon } from "@/components/ui/icon";
import { useUser } from "@/lib/user-context";
import { apiRequest } from "@/lib/api";

// ── Step indicators ────────────────────────────────────────────────────────────

const STEPS = ["Basics", "Rules", "Entry & Prizes", "Review"];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${
                  done
                    ? "cricket-gradient border-primary text-white"
                    : active
                      ? "border-primary bg-white text-primary"
                      : "border-outline-variant bg-surface-low text-foreground-muted"
                }`}
              >
                {done ? <Icon name="check" className="text-base" /> : i + 1}
              </div>
              <span
                className={`text-[10px] mt-1 font-semibold hidden sm:block
                ${active ? "text-primary" : done ? "text-secondary" : "text-foreground-muted"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 ${done ? "bg-primary" : "bg-outline-variant"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Shared field components ────────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-foreground-muted mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-foreground text-sm
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${className}`}
      {...props}
    />
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      rows={3}
      className={`w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-foreground text-sm
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none ${className}`}
      {...props}
    />
  );
}

// ── Step 1 — Basics ───────────────────────────────────────────────────────────

const FORMAT_OPTIONS = [
  {
    value: "league",
    icon: "table_rows",
    label: "League",
    desc: "Every team plays each other. Points table decides the winner.",
    color: "bg-primary",
  },
  {
    value: "knockout",
    icon: "account_tree",
    label: "Knockout",
    desc: "Single elimination. Lose and you're out.",
    color: "bg-tertiary",
  },
  {
    value: "league_knockout",
    icon: "emoji_events",
    label: "League + Knockout",
    desc: "Group stage then knockouts. Most real tournaments use this.",
    color: "gold-gradient",
  },
];

const MATCH_TYPES = ["T20", "T10", "ODI", "Custom"];

function Step1({ data, setData }) {
  return (
    <div className="space-y-6">
      <Field label="Tournament Name">
        <Input
          placeholder="e.g. Summer League 2026"
          value={data.title}
          onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
          maxLength={150}
        />
      </Field>

      <Field label="Format" hint="Choose how matches are organised.">
        <div className="grid gap-3">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setData((d) => ({ ...d, format: opt.value }))}
              className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all
                ${
                  data.format === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant bg-white hover:border-primary/40"
                }`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${opt.color} flex items-center justify-center shrink-0`}
              >
                <Icon name={opt.icon} className="text-xl text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{opt.label}</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {opt.desc}
                </p>
              </div>
              {data.format === opt.value && (
                <Icon
                  name="check_circle"
                  className="text-primary ml-auto text-xl shrink-0"
                />
              )}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Match Type">
          <select
            value={data.match_type}
            onChange={(e) =>
              setData((d) => ({ ...d, match_type: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {MATCH_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Overs per Match">
          <Input
            type="number"
            min={1}
            max={50}
            value={data.overs_limit}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                overs_limit: parseInt(e.target.value) || 20,
              }))
            }
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Date" hint="Optional">
          <Input
            type="date"
            value={data.starts_at}
            onChange={(e) =>
              setData((d) => ({ ...d, starts_at: e.target.value }))
            }
          />
        </Field>
        <Field label="End Date" hint="Optional">
          <Input
            type="date"
            value={data.ends_at}
            onChange={(e) =>
              setData((d) => ({ ...d, ends_at: e.target.value }))
            }
          />
        </Field>
      </div>

      <Field
        label="Team Limit"
        hint="Maximum number of teams allowed. Leave blank for unlimited."
      >
        <Input
          type="number"
          min={2}
          max={256}
          placeholder="e.g. 12, 16, 20 — leave blank for unlimited"
          value={data.max_teams ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setData((d) => ({
              ...d,
              max_teams: v === "" ? null : parseInt(v) || null,
            }));
          }}
        />
      </Field>

      <Field
        label="Default Venue"
        hint="Applied to all fixtures unless overridden."
      >
        <Input
          placeholder="e.g. National Cricket Ground"
          value={data.default_venue}
          onChange={(e) =>
            setData((d) => ({ ...d, default_venue: e.target.value }))
          }
          maxLength={150}
        />
      </Field>

      <Field label="Description" hint="Shown on the public tournament page.">
        <Textarea
          placeholder="Tell teams what this tournament is about…"
          value={data.description}
          onChange={(e) =>
            setData((d) => ({ ...d, description: e.target.value }))
          }
          maxLength={2000}
        />
      </Field>
    </div>
  );
}

// ── Step 2 — Rules ────────────────────────────────────────────────────────────

function PointsInput({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-7 h-7 rounded-full border border-outline-variant flex items-center justify-center text-foreground-muted hover:bg-surface-low"
        >
          <Icon name="remove" className="text-sm" />
        </button>
        <span className="w-6 text-center font-bold text-foreground text-sm">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(10, value + 1))}
          className="w-7 h-7 rounded-full border border-outline-variant flex items-center justify-center text-foreground-muted hover:bg-surface-low"
        >
          <Icon name="add" className="text-sm" />
        </button>
      </div>
    </div>
  );
}

const TIEBREAKERS = [
  { key: "nrr", label: "Net Run Rate", icon: "speed" },
  { key: "head_to_head", label: "Head-to-Head", icon: "compare_arrows" },
  { key: "boundary_count", label: "Boundary Count", icon: "sports_cricket" },
  { key: "lots", label: "Draw of Lots", icon: "casino" },
];

function Step2({ data, setData }) {
  const showLeagueOptions = data.format !== "knockout";
  const showKnockoutOptions = data.format !== "league";

  function toggleTiebreaker(key) {
    setData((d) => {
      const current = d.tiebreaker_rules || [];
      return {
        ...d,
        tiebreaker_rules: current.includes(key)
          ? current.filter((k) => k !== key)
          : [...current, key],
      };
    });
  }

  return (
    <div className="space-y-6">
      {showLeagueOptions && (
        <div className="bg-white border border-outline-variant rounded-2xl p-5">
          <p className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Icon name="leaderboard" className="text-primary" /> Points System
          </p>
          <PointsInput
            label="Win"
            value={data.points_win}
            onChange={(v) => setData((d) => ({ ...d, points_win: v }))}
          />
          <PointsInput
            label="Tie"
            value={data.points_tie}
            onChange={(v) => setData((d) => ({ ...d, points_tie: v }))}
          />
          <PointsInput
            label="No Result"
            value={data.points_no_result}
            onChange={(v) => setData((d) => ({ ...d, points_no_result: v }))}
          />
          <PointsInput
            label="Loss"
            value={data.points_loss}
            onChange={(v) => setData((d) => ({ ...d, points_loss: v }))}
          />
        </div>
      )}

      {showLeagueOptions && (
        <div className="bg-white border border-outline-variant rounded-2xl p-5">
          <p className="font-bold text-foreground mb-1 flex items-center gap-2">
            <Icon name="rule" className="text-primary" /> Tiebreakers
          </p>
          <p className="text-xs text-foreground-muted mb-4">
            Select which tiebreakers apply, in priority order (top = highest
            priority).
          </p>
          <div className="space-y-2">
            {TIEBREAKERS.map((tb) => {
              const active = (data.tiebreaker_rules || []).includes(tb.key);
              const rank = (data.tiebreaker_rules || []).indexOf(tb.key) + 1;
              return (
                <button
                  key={tb.key}
                  type="button"
                  onClick={() => toggleTiebreaker(tb.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left
                    ${active ? "border-primary bg-primary/5" : "border-outline-variant bg-surface-low hover:border-primary/30"}`}
                >
                  <Icon
                    name={tb.icon}
                    className={`text-lg ${active ? "text-primary" : "text-foreground-muted"}`}
                  />
                  <span
                    className={`flex-1 text-sm font-medium ${active ? "text-foreground" : "text-foreground-muted"}`}
                  >
                    {tb.label}
                  </span>
                  {active && (
                    <span className="text-xs font-bold text-white bg-primary rounded-full w-5 h-5 flex items-center justify-center">
                      {rank}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {data.format === "league_knockout" && (
        <Field
          label="Teams qualifying per group"
          hint="How many teams from each group advance to the knockout stage."
        >
          <Input
            type="number"
            min={1}
            max={8}
            value={data.teams_qualify_per_group}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                teams_qualify_per_group: parseInt(e.target.value) || 2,
              }))
            }
          />
        </Field>
      )}

      {showKnockoutOptions && (
        <div className="bg-white border border-outline-variant rounded-2xl p-5 space-y-4">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Icon name="account_tree" className="text-primary" /> Knockout
            Options
          </p>
          <Toggle
            label="Super Over in knockouts"
            hint="If a knockout match is tied, a super over decides the winner."
            value={data.super_over_in_knockout}
            onChange={(v) =>
              setData((d) => ({ ...d, super_over_in_knockout: v }))
            }
          />
          <Toggle
            label="Third-place playoff"
            hint="The two semi-final losers play for 3rd place."
            value={data.third_place_playoff}
            onChange={(v) => setData((d) => ({ ...d, third_place_playoff: v }))}
          />
        </div>
      )}
    </div>
  );
}

function Toggle({ label, hint, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-foreground-muted mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${value ? "bg-primary" : "bg-outline-variant"}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

// ── Step 3 — Entry & Prizes ───────────────────────────────────────────────────

function Step3({ data, setData }) {
  const [hasFee, setHasFee] = useState(data.entry_fee_amount > 0);
  const [prizes, setPrizes] = useState(data.prizes || []);

  function updatePrizes(updated) {
    setPrizes(updated);
    setData((d) => ({ ...d, prizes: updated }));
  }

  function addPrize() {
    updatePrizes([
      ...prizes,
      {
        position: prizes.length + 1,
        label: "",
        prize_type: "cash",
        cash_amount: "",
        description: "",
      },
    ]);
  }

  function removePrize(i) {
    updatePrizes(prizes.filter((_, idx) => idx !== i));
  }

  function updatePrize(i, field, value) {
    updatePrizes(
      prizes.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Entry fee */}
      <div className="bg-white border border-outline-variant rounded-2xl p-5 space-y-4">
        <Toggle
          label="This tournament has an entry fee"
          hint="Track who has paid — fee is collected in cash by the organiser."
          value={hasFee}
          onChange={(v) => {
            setHasFee(v);
            if (!v) setData((d) => ({ ...d, entry_fee_amount: 0 }));
          }}
        />

        {hasFee && (
          <div className="space-y-4 pt-2 border-t border-outline-variant">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount per team">
                <Input
                  type="number"
                  min={0}
                  placeholder="5000"
                  value={data.entry_fee_amount || ""}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      entry_fee_amount: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </Field>
              <Field label="Currency">
                <Input
                  placeholder="PKR"
                  value={data.entry_fee_currency}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      entry_fee_currency: e.target.value,
                    }))
                  }
                  maxLength={10}
                />
              </Field>
            </div>
            <Field
              label="Fee notes"
              hint="Shown to team captains — who to pay, how, etc."
            >
              <Input
                placeholder="e.g. Pay to Ali Khan before first match"
                value={data.entry_fee_notes}
                onChange={(e) =>
                  setData((d) => ({ ...d, entry_fee_notes: e.target.value }))
                }
                maxLength={255}
              />
            </Field>
            <Field label="Fee deadline" hint="Optional reminder date">
              <Input
                type="date"
                value={data.entry_fee_deadline}
                onChange={(e) =>
                  setData((d) => ({ ...d, entry_fee_deadline: e.target.value }))
                }
              />
            </Field>
          </div>
        )}
      </div>

      {/* Prize structure */}
      <div className="bg-white border border-outline-variant rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground flex items-center gap-2">
              <Icon name="workspace_premium" className="text-amber-500" /> Prize
              Structure
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">
              Shown publicly on the tournament page.
            </p>
          </div>
          <button
            type="button"
            onClick={addPrize}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Icon name="add" className="text-sm" /> Add Prize
          </button>
        </div>

        {prizes.length === 0 && (
          <p className="text-xs text-foreground-muted text-center py-4">
            No prizes added yet. Click "Add Prize" to start.
          </p>
        )}

        {prizes.map((prize, i) => (
          <div
            key={i}
            className="border border-outline-variant rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground-muted uppercase tracking-wide">
                Prize {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removePrize(i)}
                className="text-tertiary hover:bg-tertiary/10 p-1 rounded-lg transition-colors"
              >
                <Icon name="delete" className="text-base" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Label">
                <Input
                  placeholder="Winner / Best Batsman"
                  value={prize.label}
                  onChange={(e) => updatePrize(i, "label", e.target.value)}
                  maxLength={100}
                />
              </Field>
              <Field label="Type">
                <select
                  value={prize.prize_type}
                  onChange={(e) => updatePrize(i, "prize_type", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="cash">Cash</option>
                  <option value="trophy">Trophy</option>
                  <option value="medal">Medal</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
            {prize.prize_type === "cash" && (
              <Field label="Cash Amount">
                <Input
                  type="number"
                  min={0}
                  placeholder="50000"
                  value={prize.cash_amount}
                  onChange={(e) =>
                    updatePrize(i, "cash_amount", e.target.value)
                  }
                />
              </Field>
            )}
            <Field label="Description" hint="Optional — shown on public page">
              <Input
                placeholder="Gold trophy + PKR 50,000"
                value={prize.description}
                onChange={(e) => updatePrize(i, "description", e.target.value)}
                maxLength={255}
              />
            </Field>
          </div>
        ))}

        <Field
          label="Prize pool summary"
          hint="Free text shown publicly if no structured prizes above, or as extra context."
        >
          <Input
            placeholder="e.g. Winner: PKR 50,000 | Runner-up: PKR 20,000"
            value={data.prize_pool_note}
            onChange={(e) =>
              setData((d) => ({ ...d, prize_pool_note: e.target.value }))
            }
            maxLength={1000}
          />
        </Field>
      </div>
    </div>
  );
}

// ── Step 4 — Review ───────────────────────────────────────────────────────────

const FORMAT_LABELS = {
  league: "League (Round-Robin)",
  knockout: "Knockout",
  league_knockout: "League + Knockout",
};

function ReviewRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2 border-b border-outline-variant last:border-0 text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span className="font-medium text-foreground text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function Step4({ data }) {
  const prizes = data.prizes || [];
  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Icon name="info" className="text-amber-600 text-xl shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          The tournament will be saved as a <strong>draft</strong>. You can add
          teams and generate fixtures from the manage panel before going live.
        </p>
      </div>

      <div className="bg-white border border-outline-variant rounded-2xl p-5">
        <p className="font-bold text-foreground mb-3">Tournament Details</p>
        <ReviewRow label="Name" value={data.title} />
        <ReviewRow label="Format" value={FORMAT_LABELS[data.format]} />
        <ReviewRow
          label="Team Limit"
          value={data.max_teams ? `${data.max_teams} teams max` : "Unlimited"}
        />
        <ReviewRow label="Match Type" value={data.match_type} />
        <ReviewRow label="Overs" value={data.overs_limit + " overs"} />
        <ReviewRow label="Venue" value={data.default_venue} />
        <ReviewRow label="Starts" value={data.starts_at} />
        <ReviewRow label="Ends" value={data.ends_at} />
        <ReviewRow label="Description" value={data.description} />
      </div>

      <div className="bg-white border border-outline-variant rounded-2xl p-5">
        <p className="font-bold text-foreground mb-3">Rules</p>
        {data.format !== "knockout" && (
          <>
            <ReviewRow label="Points — Win" value={data.points_win} />
            <ReviewRow label="Points — Tie" value={data.points_tie} />
            <ReviewRow
              label="Points — No Result"
              value={data.points_no_result}
            />
            <ReviewRow label="Points — Loss" value={data.points_loss} />
            <ReviewRow
              label="Tiebreakers"
              value={(data.tiebreaker_rules || []).join(" → ")}
            />
          </>
        )}
        {data.format !== "league" && (
          <>
            <ReviewRow
              label="Super Over"
              value={data.super_over_in_knockout ? "Yes" : "No"}
            />
            <ReviewRow
              label="Third-place playoff"
              value={data.third_place_playoff ? "Yes" : "No"}
            />
          </>
        )}
        {data.format === "league_knockout" && (
          <ReviewRow
            label="Teams qualify per group"
            value={data.teams_qualify_per_group}
          />
        )}
      </div>

      {data.entry_fee_amount > 0 && (
        <div className="bg-white border border-outline-variant rounded-2xl p-5">
          <p className="font-bold text-foreground mb-3">Entry Fee</p>
          <ReviewRow
            label="Amount"
            value={`${data.entry_fee_currency} ${data.entry_fee_amount.toLocaleString()} per team`}
          />
          <ReviewRow label="Notes" value={data.entry_fee_notes} />
          <ReviewRow label="Deadline" value={data.entry_fee_deadline} />
        </div>
      )}

      {prizes.length > 0 && (
        <div className="bg-white border border-outline-variant rounded-2xl p-5">
          <p className="font-bold text-foreground mb-3">Prizes</p>
          {prizes.map((p, i) => (
            <ReviewRow
              key={i}
              label={p.label || `Prize ${i + 1}`}
              value={
                p.prize_type === "cash" && p.cash_amount
                  ? `Cash — ${data.entry_fee_currency} ${Number(p.cash_amount).toLocaleString()}`
                  : p.prize_type
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wizard root ────────────────────────────────────────────────────────────────

const DEFAULT_DATA = {
  title: "",
  format: "league_knockout",
  match_type: "T20",
  overs_limit: 20,
  default_venue: "",
  description: "",
  starts_at: "",
  ends_at: "",
  points_win: 2,
  points_tie: 1,
  points_no_result: 1,
  points_loss: 0,
  tiebreaker_rules: ["nrr", "head_to_head", "boundary_count", "lots"],
  super_over_in_knockout: true,
  third_place_playoff: false,
  teams_qualify_per_group: 2,
  max_teams: null,
  entry_fee_amount: 0,
  entry_fee_currency: "PKR",
  entry_fee_notes: "",
  entry_fee_deadline: "",
  prize_pool_note: "",
  prizes: [],
};

export default function CreateTournamentPage() {
  const { token } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(DEFAULT_DATA);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function validate() {
    if (step === 0) {
      if (!data.title.trim()) return "Tournament name is required.";
      if (!data.format) return "Please select a format.";
      if (data.overs_limit < 1) return "Overs must be at least 1.";
    }
    return null;
  }

  function next() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => s + 1);
  }

  function back() {
    setError("");
    setStep((s) => s - 1);
  }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      // Build tournament payload
      const payload = {
        title: data.title.trim(),
        format: data.format,
        match_type: data.match_type,
        overs_limit: data.overs_limit,
        default_venue: data.default_venue || undefined,
        description: data.description || undefined,
        starts_at: data.starts_at || undefined,
        ends_at: data.ends_at || undefined,
        points_win: data.points_win,
        points_tie: data.points_tie,
        points_no_result: data.points_no_result,
        points_loss: data.points_loss,
        tiebreaker_rules: data.tiebreaker_rules,
        super_over_in_knockout: data.super_over_in_knockout,
        third_place_playoff: data.third_place_playoff,
        teams_qualify_per_group: data.teams_qualify_per_group,
        max_teams: data.max_teams || undefined,
        entry_fee_amount: data.entry_fee_amount || 0,
        entry_fee_currency: data.entry_fee_currency || "PKR",
        entry_fee_notes: data.entry_fee_notes || undefined,
        entry_fee_deadline: data.entry_fee_deadline || undefined,
        prize_pool_note: data.prize_pool_note || undefined,
      };

      const raw = await apiRequest("/api/tournaments", {
        method: "POST",
        token,
        body: payload,
      });

      // Unwrap the same way as the list fix
      const tournament = raw?.data ?? raw;

      // Create prizes separately; collect failures and surface them on the manage page.
      const prizes = (data.prizes || []).filter((p) => p.label);
      let prizesFailed = false;
      for (const [i, prize] of prizes.entries()) {
        try {
          await apiRequest(`/api/tournaments/${tournament.code}/prizes`, {
            method: "POST",
            token,
            body: {
              position: prize.position || i + 1,
              label: prize.label,
              prize_type: prize.prize_type,
              cash_amount: prize.cash_amount
                ? parseInt(prize.cash_amount)
                : undefined,
              currency: data.entry_fee_currency,
              description: prize.description || undefined,
              sort_order: i,
            },
          });
        } catch {
          prizesFailed = true;
        }
      }

      const dest = `/tournaments/${tournament.code}/manage${prizesFailed ? "?prize_warning=1" : ""}`;
      router.push(dest);
    } catch (err) {
      setError(err?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    <Step1 key={0} data={data} setData={setData} />,
    <Step2 key={1} data={data} setData={setData} />,
    <Step3 key={2} data={data} setData={setData} />,
    <Step4 key={3} data={data} />,
  ];

  return (
    <AppShell
      title="Create Tournament"
      subtitle="Set up your tournament in a few steps"
    >
      <div className="max-w-2xl">
        <StepBar current={step} />

        <div className="bg-surface rounded-2xl border border-outline-variant p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-6">
            {STEPS[step]}
          </h2>
          {steps[step]}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <Icon name="error" className="text-base shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="flex items-center gap-2 px-5 py-3 border border-outline-variant rounded-xl text-sm font-semibold text-foreground hover:bg-surface-low transition-colors"
            >
              <Icon name="arrow_back" className="text-base" /> Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 cricket-gradient text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md"
            >
              Continue <Icon name="arrow_forward" className="text-base" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 cricket-gradient text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Icon name="sync" className="text-base animate-spin" />{" "}
                  Creating…
                </>
              ) : (
                <>
                  <Icon name="check" className="text-base" /> Create Tournament
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
