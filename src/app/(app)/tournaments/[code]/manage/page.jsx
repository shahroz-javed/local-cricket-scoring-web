"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Icon } from "@/components/ui/icon";
import { useUser } from "@/lib/user-context";
import { apiRequest } from "@/lib/api";

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  draft:        { label: "Draft",        cls: "bg-surface-low text-foreground-muted border border-outline-variant" },
  registration: { label: "Registration", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  active:       { label: "Active",       cls: "bg-green-50 text-secondary border border-green-200" },
  completed:    { label: "Completed",    cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  cancelled:    { label: "Cancelled",    cls: "bg-red-50 text-tertiary border border-red-200" },
};

const FEE_STATUS_OPTIONS = [
  { value: "unpaid",  label: "Unpaid",  cls: "bg-red-50 text-tertiary border-red-200" },
  { value: "partial", label: "Partial", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "paid",    label: "Paid",    cls: "bg-green-50 text-secondary border-green-200" },
];

const STAGE_LABELS = {
  group: "Group Stage", round_of_16: "Round of 16",
  quarter_final: "Quarter-Finals", semi_final: "Semi-Finals",
  final: "Final", third_place: "3rd Place",
};

// ── Small reusable helpers ─────────────────────────────────────────────────────

function Toast({ msg, ok, onClose }) {
  if (!msg) return null;
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm border ${
      ok ? "bg-green-50 border-green-200 text-secondary" : "bg-red-50 border-red-200 text-tertiary"
    }`}>
      <Icon name={ok ? "check_circle" : "error"} className="text-base shrink-0 mt-0.5" />
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="text-inherit opacity-50 hover:opacity-100 ml-1">
        <Icon name="close" className="text-sm" />
      </button>
    </div>
  );
}

function SectionHeader({ icon, title, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="font-bold text-foreground flex items-center gap-2">
        <Icon name={icon} className="text-primary" /> {title}
      </p>
      {right}
    </div>
  );
}

// ── Fee modal ─────────────────────────────────────────────────────────────────

function FeeModal({ entry, tournament, token, onClose, onSaved }) {
  const currency   = tournament.entry_fee_currency ?? "PKR";
  const perTeam    = tournament.entry_fee_amount ?? 0;
  const [status, setStatus]   = useState(entry.fee_status ?? "unpaid");
  const [amount, setAmount]   = useState(entry.fee_amount_paid ?? 0);
  const [note, setNote]       = useState(entry.fee_payment_note ?? "");
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      await apiRequest(`/api/tournaments/${tournament.code}/teams/${entry.team.id}/fee`, {
        method: "PATCH", token,
        body: { fee_status: status, fee_amount_paid: Number(amount), fee_payment_note: note || null },
      });
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed to update fee.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Icon name="payments" className="text-primary" /> Update Fee
          </p>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{entry.team?.name}</p>
            <p className="text-xs text-foreground-muted">Expected: {currency} {perTeam.toLocaleString()}</p>
          </div>

          {/* Status buttons */}
          <div>
            <p className="text-xs font-bold text-foreground-muted mb-2 uppercase tracking-wide">Payment Status</p>
            <div className="flex gap-2">
              {FEE_STATUS_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => {
                    setStatus(opt.value);
                    if (opt.value === "paid") setAmount(perTeam);
                    if (opt.value === "unpaid") setAmount(0);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    status === opt.value ? opt.cls + " ring-2 ring-primary/30" : "bg-surface-low text-foreground-muted border-outline-variant hover:border-primary/40"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">
              Amount Paid ({currency})
            </label>
            <input type="number" min={0} max={perTeam * 2} value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Note (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Paid via bank transfer"
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {err && <p className="text-xs text-tertiary flex items-center gap-1"><Icon name="error" className="text-sm" />{err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl cricket-gradient text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Override winner modal ─────────────────────────────────────────────────────

function OverrideModal({ fixture, tournament, token, onClose, onSaved }) {
  const teams   = fixture.match?.teams ?? [];
  const [winnerId, setWinnerId] = useState("");
  const [note, setNote]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  async function save() {
    if (!winnerId) { setErr("Select a winner."); return; }
    setSaving(true); setErr("");
    try {
      await apiRequest(`/api/tournaments/${tournament.code}/fixtures/${fixture.id}/override-winner`, {
        method: "POST", token,
        body: { winner_team_id: Number(winnerId), note: note || null },
      });
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed to override winner.");
    } finally { setSaving(false); }
  }

  const stageName = STAGE_LABELS[fixture.stage] ?? fixture.stage;
  const matchTitle = fixture.match?.title ?? `${stageName} #${fixture.fixture_number}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Icon name="gavel" className="text-primary" /> Override Winner
          </p>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-foreground-muted">{matchTitle}</p>

          {teams.length === 0 ? (
            <p className="text-xs text-foreground-muted">No teams assigned to this fixture yet.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground-muted uppercase tracking-wide">Declare winner</p>
              {teams.map(t => (
                <button key={t.id} onClick={() => setWinnerId(String(t.id))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                    winnerId === String(t.id)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-outline-variant hover:border-primary/40 text-foreground"
                  }`}>
                  <div className="w-7 h-7 cricket-gradient rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {t.name?.[0]}
                  </div>
                  {t.name}
                  {winnerId === String(t.id) && <Icon name="check_circle" className="ml-auto text-primary" />}
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Reason (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Walkover — opponent no-show"
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {err && <p className="text-xs text-tertiary flex items-center gap-1"><Icon name="error" className="text-sm" />{err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !winnerId || teams.length === 0}
            className="flex-1 py-2.5 rounded-xl cricket-gradient text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all">
            {saving ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule modal ────────────────────────────────────────────────────────────

function ScheduleModal({ fixture, tournament, token, onClose, onSaved }) {
  const [date,  setDate]  = useState(fixture.match?.date ?? "");
  const [venue, setVenue] = useState(fixture.match?.venue ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      await apiRequest(`/api/tournaments/${tournament.code}/fixtures/${fixture.id}/schedule`, {
        method: "POST", token,
        body: { date: date || null, venue: venue || null },
      });
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed to schedule fixture.");
    } finally { setSaving(false); }
  }

  const stageName  = STAGE_LABELS[fixture.stage] ?? fixture.stage;
  const matchTitle = fixture.match?.title ?? `${stageName} #${fixture.fixture_number}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Icon name="calendar_today" className="text-primary" /> Schedule Fixture
          </p>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-foreground-muted">{matchTitle}</p>

          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Venue</label>
            <input type="text" value={venue} onChange={e => setVenue(e.target.value)}
              placeholder={tournament.default_venue ?? "e.g. National Cricket Ground"}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {err && <p className="text-xs text-tertiary flex items-center gap-1"><Icon name="error" className="text-sm" />{err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl cricket-gradient text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ledger entry modal ────────────────────────────────────────────────────────

function LedgerEntryModal({ tournament, token, entry, onClose, onSaved }) {
  const isEdit    = !!entry;
  const currency  = tournament.entry_fee_currency ?? "PKR";
  const [form, setForm] = useState({
    type:       entry?.type       ?? "expense",
    label:      entry?.label      ?? "",
    amount:     entry?.amount     ?? "",
    currency:   entry?.currency   ?? currency,
    entry_date: entry?.entry_date ?? "",
    note:       entry?.note       ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.label.trim()) { setErr("Label is required."); return; }
    if (!form.amount || Number(form.amount) < 1) { setErr("Amount must be at least 1."); return; }
    setSaving(true); setErr("");
    try {
      const body = { ...form, amount: Number(form.amount) };
      if (!body.entry_date) delete body.entry_date;
      if (!body.note)       delete body.note;

      if (isEdit) {
        await apiRequest(`/api/tournaments/${tournament.code}/ledger/${entry.id}`, { method: "PATCH", token, body });
      } else {
        await apiRequest(`/api/tournaments/${tournament.code}/ledger`, { method: "POST", token, body });
      }
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed to save entry.");
    } finally { setSaving(false); }
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Icon name="receipt_long" className="text-primary" />
            {isEdit ? "Edit Entry" : "Add Entry"}
          </p>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground"><Icon name="close" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl border border-outline-variant overflow-hidden">
            {["income", "expense"].map(t => (
              <button key={t} onClick={() => set("type", t)}
                className={`flex-1 py-2 text-sm font-semibold transition-colors capitalize ${
                  form.type === t
                    ? t === "income"
                      ? "bg-green-50 text-secondary"
                      : "bg-red-50 text-tertiary"
                    : "bg-surface text-foreground-muted hover:bg-surface-low"
                }`}>
                {t === "income" ? "↑ Income" : "↓ Expense"}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Label</label>
            <input value={form.label} onChange={e => set("label", e.target.value)} maxLength={150}
              placeholder="e.g. Sponsorship from Pepsi"
              className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Amount</label>
              <input type="number" min={1} value={form.amount} onChange={e => set("amount", e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Currency</label>
              <input value={form.currency} onChange={e => set("currency", e.target.value)} maxLength={10}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Date (optional)</label>
            <input type="date" value={form.entry_date} onChange={e => set("entry_date", e.target.value)}
              className={inputCls} />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Note (optional)</label>
            <textarea value={form.note} onChange={e => set("note", e.target.value)} rows={2} maxLength={500}
              placeholder="Any additional detail…"
              className={inputCls + " resize-none"} />
          </div>

          {err && <p className="text-xs text-tertiary flex items-center gap-1"><Icon name="error" className="text-sm" />{err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl cricket-gradient text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Finance tab ───────────────────────────────────────────────────────────────

function FinanceTab({ tournament, token, showToast }) {
  const [ledger,    setLedger]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [editEntry, setEditEntry] = useState(null);   // null = closed, false = new, obj = edit
  const [deletingId, setDeletingId] = useState(null);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/tournaments/${tournament.code}/ledger`, { token });
      setLedger(data);
    } catch {
      setLedger(null);
    } finally { setLoading(false); }
  }, [tournament.code, token]);

  useEffect(() => { loadLedger(); }, [loadLedger]);

  async function deleteEntry(entry) {
    if (!confirm(`Delete "${entry.label}"?`)) return;
    setDeletingId(entry.id);
    try {
      await apiRequest(`/api/tournaments/${tournament.code}/ledger/${entry.id}`, { method: "DELETE", token });
      showToast("Entry deleted.");
      loadLedger();
    } catch (e) {
      showToast(e?.message || "Failed to delete.", false);
    } finally { setDeletingId(null); }
  }

  const currency = tournament.entry_fee_currency ?? ledger?.summary?.currency ?? "PKR";

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-foreground-muted text-sm py-8 justify-center">
        <Icon name="sync" className="animate-spin text-base" /> Loading…
      </div>
    );
  }

  const summary  = ledger?.summary ?? { total_income: 0, total_expense: 0, net: 0 };
  const entries  = ledger?.entries ?? [];
  const incomeRows  = entries.filter(e => e.type === "income");
  const expenseRows = entries.filter(e => e.type === "expense");
  const netCls   = summary.net >= 0 ? "text-secondary" : "text-tertiary";

  function fmt(n) { return `${currency} ${Number(n).toLocaleString()}`; }

  return (
    <div className="space-y-5">

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Income",  value: fmt(summary.total_income),  cls: "text-secondary" },
          { label: "Total Expense", value: fmt(summary.total_expense), cls: "text-tertiary"  },
          { label: "Net Balance",   value: fmt(summary.net),           cls: netCls            },
        ].map(s => (
          <div key={s.label} className="bg-surface rounded-xl border border-outline-variant p-4 text-center">
            <p className={`text-base font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-foreground-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Income section */}
      <LedgerSection
        title="Income" icon="trending_up" accentCls="text-secondary" bgCls="bg-green-50 border-green-200"
        rows={incomeRows} onEdit={setEditEntry} onDelete={deleteEntry} deletingId={deletingId}
      />

      {/* Expense section */}
      <LedgerSection
        title="Expenses" icon="trending_down" accentCls="text-tertiary" bgCls="bg-red-50 border-red-200"
        rows={expenseRows} onEdit={setEditEntry} onDelete={deleteEntry} deletingId={deletingId}
      />

      {/* Add entry button */}
      <button onClick={() => setEditEntry(false)}
        className="w-full py-3 border-2 border-dashed border-outline-variant rounded-2xl text-sm font-semibold text-foreground-muted hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
        <Icon name="add" className="text-base" /> Add Entry
      </button>

      {/* Modal */}
      {editEntry !== null && (
        <LedgerEntryModal
          tournament={tournament} token={token}
          entry={editEntry || null}
          onClose={() => setEditEntry(null)}
          onSaved={() => { setEditEntry(null); showToast(editEntry ? "Entry updated." : "Entry added."); loadLedger(); }}
        />
      )}
    </div>
  );
}

function LedgerSection({ title, icon, accentCls, bgCls, rows, onEdit, onDelete, deletingId }) {
  return (
    <div className="bg-surface rounded-2xl border border-outline-variant p-5">
      <div className="flex items-center justify-between mb-4">
        <p className={`font-bold text-foreground flex items-center gap-2`}>
          <Icon name={icon} className={accentCls} /> {title}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ml-1 ${bgCls}`}>
            {rows.length}
          </span>
        </p>
        <button onClick={() => onEdit(false)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
          <Icon name="add" className="text-xs" /> Add
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-foreground-muted text-center py-4">No entries yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 bg-surface-low rounded-xl">
              {/* Auto badge */}
              {e.is_auto && (
                <span className="text-[9px] font-bold bg-surface text-foreground-muted border border-outline-variant px-1.5 py-0.5 rounded-full shrink-0">
                  AUTO
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{e.label}</p>
                <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5">
                  {e.entry_date && <span>{e.entry_date}</span>}
                  {e.note && <span className="truncate">{e.note}</span>}
                </div>
              </div>
              <p className={`text-sm font-bold shrink-0 ${accentCls}`}>
                {e.currency} {Number(e.amount).toLocaleString()}
              </p>
              {!e.is_auto && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => onEdit(e)}
                    className="p-1.5 rounded-lg text-foreground-muted hover:text-primary hover:bg-surface transition-colors"
                    title="Edit">
                    <Icon name="edit" className="text-sm" />
                  </button>
                  <button onClick={() => onDelete(e)} disabled={deletingId === e.id}
                    className="p-1.5 rounded-lg text-foreground-muted hover:text-tertiary hover:bg-surface transition-colors disabled:opacity-40"
                    title="Delete">
                    {deletingId === e.id
                      ? <Icon name="sync" className="text-sm animate-spin" />
                      : <Icon name="delete" className="text-sm" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add guest team modal ──────────────────────────────────────────────────────

function AddGuestTeamModal({ tournament, token, onClose, onSaved }) {
  const [name,    setName]    = useState("");
  const [players, setPlayers] = useState(["", "", "", "", "", "", "", "", "", "", ""]);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  function setPlayer(i, v) {
    setPlayers(prev => { const next = [...prev]; next[i] = v; return next; });
  }
  function addRow()    { setPlayers(p => [...p, ""]); }
  function removeRow(i){ setPlayers(p => p.filter((_, idx) => idx !== i)); }

  async function save() {
    const validPlayers = players.map(p => p.trim()).filter(Boolean);
    if (!name.trim()) { setErr("Team name is required."); return; }
    if (validPlayers.length < 1) { setErr("Add at least one player."); return; }
    setSaving(true); setErr("");
    try {
      await apiRequest(`/api/tournaments/${tournament.code}/teams/guest`, {
        method: "POST", token,
        body: { name: name.trim(), players: validPlayers },
      });
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed to create guest team.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-xl w-full max-w-md max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant shrink-0">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Icon name="person_add" className="text-primary" /> Add Guest Team
          </p>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">Team Name</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={100}
              placeholder="e.g. Street Lions"
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide">
                Players ({players.map(p => p.trim()).filter(Boolean).length})
              </label>
              <button onClick={addRow} type="button"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                <Icon name="add" className="text-xs" /> Add row
              </button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {players.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-foreground-muted w-5 text-right shrink-0">{i + 1}.</span>
                  <input value={p} onChange={e => setPlayer(i, e.target.value)} maxLength={80}
                    placeholder={`Player ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {players.length > 1 && (
                    <button onClick={() => removeRow(i)} type="button"
                      className="text-foreground-muted hover:text-tertiary shrink-0">
                      <Icon name="close" className="text-sm" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {err && <p className="text-xs text-tertiary flex items-center gap-1"><Icon name="error" className="text-sm" />{err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-outline-variant shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl cricket-gradient text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all">
            {saving ? "Creating…" : "Create Guest Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit settings modal ───────────────────────────────────────────────────────

function EditSettingsModal({ tournament, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:         tournament.title ?? "",
    description:   tournament.description ?? "",
    default_venue: tournament.default_venue ?? "",
    starts_at:     tournament.starts_at ?? "",
    ends_at:       tournament.ends_at ?? "",
    max_teams:     tournament.max_teams ?? "",
    overs_limit:   tournament.overs_limit ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true); setErr("");
    const body = { ...form };
    // Convert empty strings to null for nullable fields
    ["description", "default_venue", "starts_at", "ends_at"].forEach(k => {
      if (!body[k]) body[k] = null;
    });
    if (!body.max_teams) delete body.max_teams;
    else body.max_teams = Number(body.max_teams);
    body.overs_limit = Number(body.overs_limit);
    try {
      await apiRequest(`/api/tournaments/${tournament.code}`, {
        method: "PATCH", token, body,
      });
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed to save settings.");
    } finally { setSaving(false); }
  }

  const Field = ({ label, children }) => (
    <div>
      <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-xl w-full max-w-md max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant shrink-0">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Icon name="edit" className="text-primary" /> Edit Settings
          </p>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <Field label="Title">
            <input value={form.title} onChange={e => set("title", e.target.value)}
              className={inputCls} maxLength={150} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={3} maxLength={2000}
              className={inputCls + " resize-none"} />
          </Field>
          <Field label="Default Venue">
            <input value={form.default_venue} onChange={e => set("default_venue", e.target.value)}
              className={inputCls} maxLength={150} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <input type="date" value={form.starts_at} onChange={e => set("starts_at", e.target.value)}
                className={inputCls} />
            </Field>
            <Field label="End Date">
              <input type="date" value={form.ends_at} onChange={e => set("ends_at", e.target.value)}
                className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max Teams">
              <input type="number" min={2} max={256} value={form.max_teams}
                onChange={e => set("max_teams", e.target.value)}
                placeholder="Unlimited" className={inputCls} />
            </Field>
            <Field label="Overs per Innings">
              <input type="number" min={1} max={50} value={form.overs_limit}
                onChange={e => set("overs_limit", e.target.value)}
                className={inputCls} />
            </Field>
          </div>
          {err && <p className="text-xs text-tertiary flex items-center gap-1"><Icon name="error" className="text-sm" />{err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-outline-variant shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !form.title.trim()}
            className="flex-1 py-2.5 rounded-xl cricket-gradient text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Withdraw modal ────────────────────────────────────────────────────────────

function WithdrawModal({ entry, tournament, token, onClose, onSaved }) {
  const [reason,  setReason]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      await apiRequest(`/api/tournaments/${tournament.code}/teams/${entry.team.id}/withdraw`, {
        method: "POST", token,
        body: { reason: reason || null },
      });
      onSaved();
    } catch (e) {
      setErr(e?.message || "Failed to withdraw team.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Icon name="person_off" className="text-tertiary" /> Withdraw Team
          </p>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-700 text-xs font-bold shrink-0">
              {entry.team?.name?.[0] ?? "T"}
            </div>
            <p className="text-sm font-semibold text-red-800">{entry.team?.name}</p>
          </div>

          <div className="text-xs text-foreground-muted space-y-1 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="font-bold text-amber-800 flex items-center gap-1">
              <Icon name="info" className="text-sm" /> What happens:
            </p>
            <ul className="space-y-0.5 list-disc list-inside text-amber-700">
              <li>All their upcoming fixtures become walkovers for opponents</li>
              <li>Matches already played stand — those results stay</li>
              <li>Team is removed from the points table</li>
              <li>You can add a replacement team later</li>
            </ul>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">
              Reason (optional)
            </label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Non-payment of fees, misbehaviour…"
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {err && <p className="text-xs text-tertiary flex items-center gap-1"><Icon name="error" className="text-sm" />{err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60 transition-all">
            {saving ? "Withdrawing…" : "Withdraw Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Replace team modal ─────────────────────────────────────────────────────────

function ReplaceModal({ entry, tournament, token, onClose, onSaved }) {
  const [teamCode, setTeamCode] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");

  async function save() {
    const val = teamCode.trim().toUpperCase();
    if (!val) { setErr("Enter a team code."); return; }
    setSaving(true); setErr("");
    try {
      const data = await apiRequest(`/api/tournaments/${tournament.code}/teams/${entry.team.id}/replace`, {
        method: "POST", token,
        body: { team_code: val },
      });
      onSaved(data.replacement?.name);
    } catch (e) {
      setErr(e?.message || "Failed to replace team.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Icon name="group_add" className="text-primary" /> Replace Withdrawn Team
          </p>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Icon name="swap_horiz" className="text-base text-foreground-muted" />
            Replacing <span className="font-semibold text-foreground line-through mx-1">{entry.team?.name}</span>
          </div>

          <div className="text-xs bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-800 space-y-0.5">
            <p className="font-bold flex items-center gap-1"><Icon name="info" className="text-sm" /> What happens:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
              <li>New team takes the withdrawn team's remaining fixtures</li>
              <li>Walkovers are reversed — matches become playable again</li>
              <li>New team starts with 0 points (prior matches not replayed)</li>
              <li>New team is placed in the same group</li>
            </ul>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wide block mb-1">
              Replacement Team Code
            </label>
            <input
              type="text"
              value={teamCode}
              onChange={e => setTeamCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()}
              placeholder="TEAM-XXXX"
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary uppercase"
            />
          </div>

          {err && <p className="text-xs text-tertiary flex items-center gap-1"><Icon name="error" className="text-sm" />{err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !teamCode.trim()}
            className="flex-1 py-2.5 rounded-xl cricket-gradient text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all">
            {saving ? "Replacing…" : "Replace Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TournamentManagePage() {
  const { code }      = useParams();
  const searchParams  = useSearchParams();
  const { token }     = useUser();

  // Core data
  const [tourn,    setTourn]    = useState(null);
  const [fixtures, setFixtures] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // Toast
  const [toast, setToast] = useState({ msg: "", ok: true });
  const toastTimer = useRef(null);

  function showToast(msg, ok = true) {
    clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast({ msg: "", ok: true }), 4000);
  }

  // Action state
  const [generating, setGenerating] = useState(false);
  const [teamCode,   setTeamCode]   = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [advancing,  setAdvancing]  = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerDeleting,  setBannerDeleting]  = useState(false);
  const bannerInputRef = useRef(null);

  // Modals
  const [feeEntry,        setFeeEntry]        = useState(null);
  const [scheduleFixture, setScheduleFixture] = useState(null);
  const [overrideFixture, setOverrideFixture] = useState(null);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showGuestForm,   setShowGuestForm]   = useState(false);
  const [withdrawEntry,   setWithdrawEntry]   = useState(null);
  const [replaceEntry,    setReplaceEntry]    = useState(null);

  // Top-level page tab
  const [pageTab,    setPageTab]    = useState("overview");
  // Active tab for fixtures section
  const [fixtureTab, setFixtureTab] = useState(null);

  const load = useCallback(async () => {
    if (!token || !code) return;
    try {
      const [tData, fData] = await Promise.all([
        apiRequest(`/api/tournaments/${code}`, { token }),
        apiRequest(`/api/tournaments/${code}/fixtures`, { token }).catch(() => ({ fixtures: {} })),
      ]);
      setTourn(tData);
      setFixtures(fData.fixtures ?? {});
      setError("");
      // Default fixture tab to first available stage
      setFixtureTab(prev => prev ?? Object.keys(fData.fixtures ?? {})[0] ?? null);
    } catch (err) {
      setError(err?.message || "Tournament not found.");
    } finally {
      setLoading(false);
    }
  }, [code, token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get("prize_warning") === "1") {
      showToast("Tournament created, but one or more prizes could not be saved. You can add them from the Prizes section.", false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function generateFixtures() {
    setGenerating(true);
    try {
      const data = await apiRequest(`/api/tournaments/${code}/generate-fixtures`, { method: "POST", token });
      showToast(`${data.fixture_count} fixtures generated successfully.`);
      load();
    } catch (err) {
      showToast(err?.message || "Failed to generate fixtures.", false);
    } finally { setGenerating(false); }
  }

  async function addTeam(e) {
    e.preventDefault();
    const val = teamCode.trim().toUpperCase();
    if (!val) return;
    setAddingTeam(true);
    try {
      const data = await apiRequest(`/api/tournaments/${code}/teams`, {
        method: "POST", token, body: { team_code: val },
      });
      showToast(`${data.team.name} added to tournament.`);
      setTeamCode("");
      load();
    } catch (err) {
      showToast(err?.message || "Failed to add team.", false);
    } finally { setAddingTeam(false); }
  }

  async function removeTeam(entry) {
    if (!confirm(`Remove ${entry.team?.name} from this tournament?`)) return;
    setRemovingId(entry.id);
    try {
      await apiRequest(`/api/tournaments/${code}/teams/${entry.team.id}`, { method: "DELETE", token });
      showToast(`${entry.team?.name} removed.`);
      load();
    } catch (err) {
      showToast(err?.message || "Failed to remove team.", false);
    } finally { setRemovingId(null); }
  }

  async function advanceToKnockout() {
    if (!confirm("Seed group-stage qualifiers into the knockout bracket? This cannot be undone.")) return;
    setAdvancing(true);
    try {
      const data = await apiRequest(`/api/tournaments/${code}/advance-to-knockout`, { method: "POST", token });
      showToast(`${data.teams_seeded} team slots filled in the knockout bracket.`);
      load();
    } catch (err) {
      showToast(err?.message || "Failed to advance to knockout.", false);
    } finally { setAdvancing(false); }
  }

  async function uploadBanner(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const form = new FormData();
      form.append("banner", file);
      await fetch(`/api/tournaments/${code}/banner`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }).then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.message || "Upload failed.");
        }
      });
      showToast("Banner uploaded.");
      load();
    } catch (err) {
      showToast(err?.message || "Failed to upload banner.", false);
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  async function deleteBanner() {
    if (!confirm("Remove this banner image?")) return;
    setBannerDeleting(true);
    try {
      await apiRequest(`/api/tournaments/${code}/banner`, { method: "DELETE", token });
      showToast("Banner removed.");
      load();
    } catch (err) {
      showToast(err?.message || "Failed to remove banner.", false);
    } finally { setBannerDeleting(false); }
  }

  // ── Loading / error screens ───────────────────────────────────────────────────

  if (loading) {
    return (
      <AppShell title="Manage Tournament">
        <div className="flex items-center gap-2 text-foreground-muted text-sm">
          <Icon name="sync" className="animate-spin text-base" /> Loading…
        </div>
      </AppShell>
    );
  }

  if (error || !tourn) {
    return (
      <AppShell title="Manage Tournament">
        <div className="text-tertiary text-sm flex items-center gap-2">
          <Icon name="error_outline" className="text-base" />
          {error || "Tournament not found."}
        </div>
      </AppShell>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────────

  const badge       = STATUS_BADGE[tourn.status] ?? STATUS_BADGE.draft;
  const teams       = tourn.tournamentTeams ?? [];
  const activeTeams = teams.filter(t => t.status !== "withdrawn");
  const canEdit     = !["completed", "cancelled"].includes(tourn.status);
  const canGenerate = !["active", "completed", "cancelled"].includes(tourn.status);
  const maxTeams    = tourn.max_teams ?? null;
  const atLimit     = maxTeams !== null && activeTeams.length >= maxTeams;
  const hasFee      = tourn.entry_fee_amount > 0;
  const currency    = tourn.entry_fee_currency ?? "PKR";
  const totalFee    = activeTeams.length * (tourn.entry_fee_amount ?? 0);
  const collected   = teams.reduce((s, t) => s + (t.fee_amount_paid ?? 0), 0);

  const fixtureStages  = Object.keys(fixtures);
  const hasFixtures    = fixtureStages.length > 0;
  const activeFixtures = fixtureTab ? (fixtures[fixtureTab] ?? []) : [];

  function feeStatusCls(status) {
    const opt = FEE_STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.cls : FEE_STATUS_OPTIONS[0].cls;
  }

  return (
    <AppShell title={tourn.title} subtitle={`Manage · ${tourn.code}`}>
      <div className="max-w-3xl space-y-5">

        {/* ── Toast ── */}
        {toast.msg && (
          <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast({ msg: "", ok: true })} />
        )}

        {/* ── Status bar ── */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted mb-1">Status</p>
            <span className={`inline-flex text-xs font-bold px-3 py-1 rounded-full border ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/tournaments/${code}`} target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
              <Icon name="open_in_new" className="text-base" /> Public Page
            </Link>
            {canEdit && (
              <button onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-foreground hover:bg-surface-low transition-colors">
                <Icon name="settings" className="text-base" /> Settings
              </button>
            )}
            {canGenerate && (
              <button onClick={generateFixtures} disabled={generating}
                className="flex items-center gap-1.5 px-4 py-2 cricket-gradient text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
                {generating
                  ? <><Icon name="sync" className="text-base animate-spin" /> Generating…</>
                  : <><Icon name="auto_fix_high" className="text-base" /> Generate Fixtures</>}
              </button>
            )}
            {tourn.format === "league_knockout" && tourn.status === "active" && (
              <button onClick={advanceToKnockout} disabled={advancing}
                className="flex items-center gap-1.5 px-4 py-2 border border-primary text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 transition-all disabled:opacity-60">
                {advancing
                  ? <><Icon name="sync" className="text-base animate-spin" /> Advancing…</>
                  : <><Icon name="arrow_forward" className="text-base" /> Advance to Knockout</>}
              </button>
            )}
          </div>
        </div>

        {/* ── Page tabs ── */}
        <div className="flex gap-1 border-b border-outline-variant pb-0">
          {[
            { key: "overview", icon: "dashboard",    label: "Overview"  },
            { key: "finance",  icon: "account_balance", label: "Finance" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setPageTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                pageTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}>
              <Icon name={tab.icon} className="text-sm" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Finance tab ── */}
        {pageTab === "finance" && (
          <FinanceTab tournament={tourn} token={token} showToast={showToast} />
        )}

        {/* ── Overview content ── */}
        {pageTab === "overview" && <>

        {/* ── Banner upload ── */}
        <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
          {/* Preview */}
          <div className="relative w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            {tourn.banner_url ? (
              <img
                src={tourn.banner_url}
                alt="Tournament banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-foreground-muted">
                <Icon name="image" className="text-3xl opacity-30" />
                <p className="text-xs opacity-50">No banner uploaded</p>
              </div>
            )}
            {/* Overlay actions on hover */}
            {tourn.banner_url && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-lg text-xs font-bold text-foreground hover:bg-white transition-colors">
                  <Icon name="upload" className="text-sm" />
                  {bannerUploading ? "Uploading…" : "Change"}
                </button>
                <button
                  onClick={deleteBanner}
                  disabled={bannerDeleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 rounded-lg text-xs font-bold text-white hover:bg-red-600 transition-colors">
                  <Icon name="delete" className="text-sm" />
                  {bannerDeleting ? "Removing…" : "Remove"}
                </button>
              </div>
            )}
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-outline-variant">
            <div className="flex items-center gap-2">
              <Icon name="image" className="text-sm text-foreground-muted" />
              <span className="text-xs font-semibold text-foreground-muted">Tournament Banner</span>
              <span className="text-[10px] text-outline">Recommended 1200×400px</span>
            </div>
            <div className="flex items-center gap-2">
              {tourn.banner_url && (
                <button
                  onClick={deleteBanner}
                  disabled={bannerDeleting}
                  className="text-xs font-semibold text-tertiary hover:underline disabled:opacity-50">
                  {bannerDeleting ? "Removing…" : "Remove"}
                </button>
              )}
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold text-foreground hover:bg-surface-low transition-colors disabled:opacity-50">
                <Icon name={bannerUploading ? "sync" : "upload"} className={`text-sm ${bannerUploading ? "animate-spin" : ""}`} />
                {bannerUploading ? "Uploading…" : (tourn.banner_url ? "Change Banner" : "Upload Banner")}
              </button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadBanner}
          />
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Format",     value: tourn.format?.replace(/_/g, "+") ?? "—" },
            { label: "Overs",      value: `${tourn.overs_limit ?? "—"} ov` },
            { label: "Match Type", value: tourn.match_type ?? "—" },
            { label: "Teams",      value: maxTeams ? `${activeTeams.length} / ${maxTeams}` : activeTeams.length },
          ].map(s => (
            <div key={s.label} className="bg-surface rounded-xl border border-outline-variant p-4 text-center">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Entry fee summary ── */}
        {hasFee && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-5">
            <p className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Icon name="payments" className="text-primary" /> Entry Fee Summary
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Expected",    value: `${currency} ${totalFee.toLocaleString()}`,                          cls: "text-foreground" },
                { label: "Collected",   value: `${currency} ${collected.toLocaleString()}`,                          cls: "text-secondary" },
                { label: "Outstanding", value: `${currency} ${Math.max(0, totalFee - collected).toLocaleString()}`,  cls: "text-tertiary" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-base font-bold ${s.cls}`}>{s.value}</p>
                  <p className="text-xs text-foreground-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Add team ── */}
        {canEdit && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-5">
            <SectionHeader icon="group_add" title="Add Registered Team"
              right={maxTeams && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  atLimit
                    ? "bg-red-50 text-tertiary border-red-200"
                    : activeTeams.length >= maxTeams * 0.8
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-surface-low text-foreground-muted border-outline-variant"
                }`}>
                  {activeTeams.length} / {maxTeams} teams
                </span>
              )}
            />
            {atLimit && (
              <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 text-tertiary rounded-xl text-sm flex items-start gap-2">
                <Icon name="block" className="text-base shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Team limit reached ({maxTeams} teams)</p>
                  <p className="text-xs mt-0.5 text-red-600">Increase the limit in Settings to add more.</p>
                </div>
              </div>
            )}
            <form onSubmit={addTeam} className="flex gap-2">
              <input value={teamCode} onChange={e => setTeamCode(e.target.value)}
                placeholder="TEAM-XXXXXX" disabled={atLimit}
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" disabled={addingTeam || !teamCode.trim() || atLimit}
                className="px-4 py-2.5 cricket-gradient text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all">
                {addingTeam ? "Adding…" : "Add"}
              </button>
            </form>
          </div>
        )}

        {/* ── Add guest team ── */}
        {canEdit && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-5">
            <SectionHeader icon="person_add" title="Add Guest Team"
              right={
                <button onClick={() => setShowGuestForm(true)} disabled={atLimit}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-xl text-xs font-semibold text-foreground hover:bg-surface-low transition-colors disabled:opacity-50">
                  <Icon name="add" className="text-xs" /> New Guest Team
                </button>
              }
            />
            <p className="text-xs text-foreground-muted -mt-2">
              Create a team on behalf of players who don't have accounts. Guest teams are only visible within this tournament.
            </p>
          </div>
        )}

        {/* ── Teams list ── */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5">
          <SectionHeader icon="groups"
            title={`Teams (${maxTeams ? `${activeTeams.length} / ${maxTeams}` : activeTeams.length})`}
          />

          {activeTeams.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="group_add" className="text-3xl text-foreground-muted mb-2" />
              <p className="text-sm text-foreground-muted">No teams added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTeams.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 bg-surface-low rounded-xl">
                  <div className="w-8 h-8 cricket-gradient rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {entry.team?.name?.[0] ?? "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{entry.team?.name ?? "Unknown"}</p>
                    <p className="text-xs text-foreground-muted font-mono">{entry.team?.code}</p>
                  </div>

                  {/* Badges */}
                  {entry.team?.is_guest && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                      Guest
                    </span>
                  )}
                  {entry.status && entry.status !== "confirmed" && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      entry.status === "invited"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-surface-low text-foreground-muted border-outline-variant"
                    }`}>
                      {entry.status}
                    </span>
                  )}
                  {entry.group && (
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                      {entry.group.name}
                    </span>
                  )}

                  {/* Fee badge — clickable */}
                  {hasFee && (
                    <button onClick={() => setFeeEntry(entry)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 hover:opacity-80 transition-opacity ${feeStatusCls(entry.fee_status ?? "unpaid")}`}
                      title="Click to update fee status">
                      {entry.fee_status ?? "unpaid"}
                    </button>
                  )}

                  {/* Remove (pre-fixtures) or Withdraw (active) */}
                  {canEdit && (
                    tourn.status === "active"
                      ? (
                        <button onClick={() => setWithdrawEntry(entry)}
                          className="text-foreground-muted hover:text-tertiary transition-colors shrink-0"
                          title="Withdraw team from tournament">
                          <Icon name="person_off" className="text-sm" />
                        </button>
                      ) : (
                        <button onClick={() => removeTeam(entry)}
                          disabled={removingId === entry.id}
                          className="text-foreground-muted hover:text-tertiary transition-colors disabled:opacity-40 shrink-0"
                          title="Remove team">
                          {removingId === entry.id
                            ? <Icon name="sync" className="text-sm animate-spin" />
                            : <Icon name="person_remove" className="text-sm" />}
                        </button>
                      )
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Withdrawn teams */}
          {teams.filter(t => t.status === "withdrawn").length > 0 && (
            <div className="mt-4 pt-4 border-t border-outline-variant">
              <p className="text-xs font-bold text-foreground-muted uppercase tracking-wide mb-2">
                Withdrawn ({teams.filter(t => t.status === "withdrawn").length})
              </p>
              <div className="space-y-1.5">
                {teams.filter(t => t.status === "withdrawn").map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 bg-surface-low rounded-xl">
                    <div className="w-7 h-7 bg-outline-variant rounded-lg flex items-center justify-center text-foreground-muted text-xs font-bold shrink-0 opacity-50">
                      {entry.team?.name?.[0] ?? "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground-muted truncate line-through">{entry.team?.name}</p>
                      {entry.withdrawal_reason && (
                        <p className="text-[10px] text-foreground-muted truncate">{entry.withdrawal_reason}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full shrink-0">
                      withdrawn
                    </span>
                    {tourn.status === "active" && (
                      <button
                        onClick={() => setReplaceEntry(entry)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary text-primary text-[10px] font-bold hover:bg-primary/5 transition-colors"
                        title="Replace with another team">
                        <Icon name="group_add" className="text-xs" /> Replace
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Fixtures management ── */}
        {hasFixtures && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-5">
            <SectionHeader icon="event_note" title="Fixtures" />

            {/* Stage tabs */}
            <div className="flex gap-1 flex-wrap mb-4">
              {fixtureStages.map(stage => (
                <button key={stage} onClick={() => setFixtureTab(stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    fixtureTab === stage
                      ? "cricket-gradient text-white"
                      : "bg-surface-low text-foreground-muted hover:text-foreground border border-outline-variant"
                  }`}>
                  {STAGE_LABELS[stage] ?? stage}
                </button>
              ))}
            </div>

            {/* Fixture rows */}
            <div className="space-y-2">
              {activeFixtures.map(f => {
                const teams   = f.match?.teams ?? [];
                const home    = teams[0];
                const away    = teams[1];
                const homeName = home?.name ?? f.home_placeholder ?? "TBD";
                const awayName = away?.name ?? f.away_placeholder ?? "TBD";
                const statusCls = {
                  completed: "text-secondary", live: "text-primary", upcoming: "text-foreground-muted"
                }[f.match?.status] ?? "text-foreground-muted";

                return (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 bg-surface-low rounded-xl">
                    {/* Match info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {homeName} <span className="text-foreground-muted font-normal">vs</span> {awayName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5 flex-wrap">
                        {f.match?.date && (
                          <span className="flex items-center gap-1">
                            <Icon name="calendar_today" className="text-xs" />
                            {f.match.date}
                          </span>
                        )}
                        {f.match?.venue && (
                          <span className="flex items-center gap-1 truncate">
                            <Icon name="location_on" className="text-xs" />
                            {f.match.venue}
                          </span>
                        )}
                        <span className={`font-semibold capitalize ${statusCls}`}>
                          {f.match?.status ?? "upcoming"}
                        </span>
                        {f.is_overridden && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            Override
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setScheduleFixture(f)}
                        className="p-2 rounded-lg border border-outline-variant text-foreground-muted hover:text-primary hover:border-primary/40 transition-colors"
                        title="Schedule — set date & venue">
                        <Icon name="edit_calendar" className="text-sm" />
                      </button>
                      <button onClick={() => setOverrideFixture(f)}
                        disabled={f.match?.status === "completed" && !f.is_overridden}
                        className="p-2 rounded-lg border border-outline-variant text-foreground-muted hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40"
                        title="Override winner (walkover)">
                        <Icon name="gavel" className="text-sm" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tournament info ── */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5">
          <SectionHeader icon="info" title="Tournament Info"
            right={canEdit && (
              <button onClick={() => setShowSettings(true)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                <Icon name="edit" className="text-xs" /> Edit
              </button>
            )}
          />
          <dl className="space-y-2 text-sm">
            {tourn.description && (
              <div>
                <dt className="text-foreground-muted text-xs mb-0.5">Description</dt>
                <dd className="text-foreground leading-relaxed">{tourn.description}</dd>
              </div>
            )}
            {(tourn.starts_at || tourn.ends_at) && (
              <div className="flex gap-8">
                {tourn.starts_at && <div><dt className="text-foreground-muted text-xs mb-0.5">Starts</dt><dd className="font-medium">{tourn.starts_at}</dd></div>}
                {tourn.ends_at   && <div><dt className="text-foreground-muted text-xs mb-0.5">Ends</dt>  <dd className="font-medium">{tourn.ends_at}</dd></div>}
              </div>
            )}
            {tourn.default_venue && (
              <div><dt className="text-foreground-muted text-xs mb-0.5">Venue</dt><dd className="font-medium">{tourn.default_venue}</dd></div>
            )}
            {hasFee && (
              <div>
                <dt className="text-foreground-muted text-xs mb-0.5">Entry Fee</dt>
                <dd className="font-medium">{currency} {tourn.entry_fee_amount?.toLocaleString()} per team
                  {tourn.entry_fee_notes && <span className="text-foreground-muted ml-1">— {tourn.entry_fee_notes}</span>}
                </dd>
              </div>
            )}
          </dl>
        </div>

        </> /* end overview tab */}

      </div>

      {/* ── Modals ── */}
      {feeEntry && (
        <FeeModal entry={feeEntry} tournament={tourn} token={token}
          onClose={() => setFeeEntry(null)}
          onSaved={() => { setFeeEntry(null); showToast("Fee status updated."); load(); }}
        />
      )}
      {scheduleFixture && (
        <ScheduleModal fixture={scheduleFixture} tournament={tourn} token={token}
          onClose={() => setScheduleFixture(null)}
          onSaved={() => { setScheduleFixture(null); showToast("Fixture scheduled."); load(); }}
        />
      )}
      {overrideFixture && (
        <OverrideModal fixture={overrideFixture} tournament={tourn} token={token}
          onClose={() => setOverrideFixture(null)}
          onSaved={() => { setOverrideFixture(null); showToast("Winner overridden."); load(); }}
        />
      )}
      {showSettings && (
        <EditSettingsModal tournament={tourn} token={token}
          onClose={() => setShowSettings(false)}
          onSaved={() => { setShowSettings(false); showToast("Settings saved."); load(); }}
        />
      )}
      {showGuestForm && (
        <AddGuestTeamModal tournament={tourn} token={token}
          onClose={() => setShowGuestForm(false)}
          onSaved={() => { setShowGuestForm(false); showToast("Guest team created."); load(); }}
        />
      )}
      {withdrawEntry && (
        <WithdrawModal entry={withdrawEntry} tournament={tourn} token={token}
          onClose={() => setWithdrawEntry(null)}
          onSaved={() => { setWithdrawEntry(null); showToast(`${withdrawEntry.team?.name} withdrawn. Walkovers applied.`); load(); }}
        />
      )}
      {replaceEntry && (
        <ReplaceModal entry={replaceEntry} tournament={tourn} token={token}
          onClose={() => setReplaceEntry(null)}
          onSaved={(newName) => { setReplaceEntry(null); showToast(`Team replaced with ${newName}.`); load(); }}
        />
      )}

    </AppShell>
  );
}
