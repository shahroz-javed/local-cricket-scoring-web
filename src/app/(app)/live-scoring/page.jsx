"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { apiRequest } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { getEcho } from "@/lib/echo";
import { Icon } from "@/components/ui/icon";

// â"€â"€â"€ Constants â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const SCORER_TTL    = 180;  // seconds (3 min inactivity)

// â"€â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function uuid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function oversDisplay(totalOvers, totalBalls) {
  return `${totalOvers}.${totalBalls}`;
}

function runRate(runs, overs, balls) {
  const o = overs + balls / 6;
  return o > 0 ? (runs / o).toFixed(2) : "0.00";
}

function inningsRuns(inn) {
  if (!inn) return null;
  const direct = Number(inn.total_runs);
  if (Number.isFinite(direct)) return direct;
  const raw = String(inn.total ?? "");
  const parsed = parseInt(raw.split("/")[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchFormatLabel(match) {
  if (match?.match_type === "single_wicket") return "Single Wicket";
  if (match?.match_type === "T20") return "T20";
  if (match?.match_type === "ODI") return "ODI";
  if (match?.match_type === "T10") return "T10";
  if (match?.match_type === "Custom" && match?.overs_limit) return `Custom - ${match.overs_limit} overs`;
  if (match?.overs_limit) return `${match.overs_limit} overs`;
  return "Match Format";
}

function ballChipStyle(delivery) {
  if (!delivery) return "border-dashed border border-outline-variant text-foreground-muted";
  if (delivery.is_wicket) return "bg-tertiary text-white";
  if (delivery.runs_bat === 4) return "bg-primary text-white";
  if (delivery.runs_bat === 6) return "bg-indigo-900 text-white";
  if (delivery.extras_type === "wide") return "bg-amber-100 text-amber-700 border border-amber-300";
  if (delivery.extras_type === "no_ball") return "bg-orange-100 text-orange-700 border border-orange-400";
  return "border border-outline-variant text-foreground";
}

function ballLabel(delivery) {
  if (!delivery) return "?";
  const er = delivery.extras_runs ?? 0;
  const rb = delivery.runs_bat ?? 0;
  if (delivery.is_wicket) return rb > 0 ? `${rb}W` : "W";
  if (delivery.extras_type === "wide")    return er > 0 ? `${er}Wd` : "Wd";
  if (delivery.extras_type === "no_ball") return rb > 0 ? `${rb}Nb` : er > 0 ? `${er}Nb` : "Nb";
  if (delivery.extras_type === "bye")     return er > 0 ? `${er}B`  : "B";
  if (delivery.extras_type === "leg_bye") return er > 0 ? `${er}Lb` : "Lb";
  if (rb === 0) return "·";
  return String(rb);
}

// â"€â"€â"€ Sub-components â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function PageSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-10" />
        <span className="absolute h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/40" />
        <Icon name="sports_cricket" className="text-xl text-primary" />
      </div>
      <p className="text-sm text-foreground-muted">Loading live state...</p>
    </div>
  );
}

function ScorerLockPanel({ match, user, token, onStateRefresh }) {
  const [now, setNow]           = useState(() => Date.now());
  const [loading, setLoading]   = useState(false);

  const activeId    = match.active_scorer_user_id;
  const lastActive  = match.scorer_last_active_at;
  const isMe        = activeId === user?.id;
  const activeName  = match.active_scorer?.name ?? "Unknown";

  // Count-up from last_active_at
  useEffect(() => {
    if (!lastActive) return;
    const update = () => setNow(Date.now());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastActive]);

  const elapsed = lastActive ? Math.max(0, Math.floor((now - new Date(lastActive).getTime()) / 1000)) : 0;
  const remaining = Math.max(0, SCORER_TTL - elapsed);
  const pct       = Math.max(0, (remaining / SCORER_TTL) * 100);
  const expired   = remaining === 0;
  const statusLabel = !activeId
    ? "No scorer has the lock"
    : isMe
      ? "You currently control scoring"
      : `${activeName} currently controls scoring`;
  const takeoverHint = !activeId
    ? "Take control before entering deliveries."
    : isMe
      ? "Use Keep Lock if you step away briefly."
      : expired
        ? "The lock has expired. You can now take control."
        : "If the scorer is away, use Force Takeover. Otherwise wait for the lock to expire.";

  async function take(force = false) {
    setLoading(true);
    try {
      const endpoint = force
        ? `/api/matches/${match.code}/scorer/force`
        : `/api/matches/${match.code}/scorer/take`;
      await apiRequest(endpoint, { method: "POST", token });
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to take control.");
    } finally {
      setLoading(false);
    }
  }

  async function release() {
    setLoading(true);
    try {
      await apiRequest(`/api/matches/${match.code}/scorer/release`, { method: "POST", token });
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to release control.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    // Re-take control to bump scorer_last_active_at without releasing
    setLoading(true);
    try {
      await apiRequest(`/api/matches/${match.code}/scorer/take`, { method: "POST", token });
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to refresh timer.");
    } finally {
      setLoading(false);
    }
  }

  const urgency = pct < 25 ? "text-tertiary" : pct < 50 ? "text-amber-500" : "text-secondary";

  return (
    <div className={`rounded-2xl border p-4 md:p-5 transition-colors ${
      activeId && !isMe ? "border-amber-300 bg-amber-50/40" : "border-outline-variant bg-surface"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base font-bold text-foreground">Scorer Lock</h3>
        {/* Real-time scorer identity badge */}
        {activeId && (
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold
            ${isMe ? "bg-secondary/10 text-secondary" : "bg-amber-100 text-amber-700"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isMe ? "bg-secondary animate-pulse" : "bg-amber-500"}`} />
            {isMe ? "Your lock" : activeName}
          </span>
        )}
      </div>

      <div className={`mb-3 rounded-xl border px-3 py-2 text-xs font-semibold ${
        activeId && !isMe ? "border-amber-200 bg-amber-50 text-amber-800" : "border-outline-variant bg-surface-container text-foreground-muted"
      }`}>
        {statusLabel}
      </div>

      {activeId ? (
        <div className="space-y-3">
          {!expired ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Auto-releases in</span>
                <span className={`font-bold tabular-nums ${urgency}`}>{remaining}s</span>
              </div>
              <div className="w-full bg-surface-container-low rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${pct < 25 ? "bg-tertiary" : pct < 50 ? "bg-amber-400" : "bg-secondary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 font-semibold border border-amber-200">
              Scorer timed out - control is free to take
            </p>
          )}

          {isMe ? (
            <div className="flex gap-2">
              {/* Still Here - resets the 3-min clock without recording a delivery */}
              <button
                onClick={refresh}
                disabled={loading}
                title="Drinks break or interruption? Tap to reset your 3-minute timer."
                className="flex-1 rounded-xl bg-secondary/10 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Icon name="timer" className="text-base" />
                Keep Lock
              </button>
              <button
                onClick={release}
                disabled={loading}
                className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container-low disabled:opacity-50"
              >
                Release
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {!expired && (
                <p className="text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">{activeName}</span> is scoring. Deliveries are locked until they release or time out.
                </p>
              )}
              <p className="text-xs text-foreground-muted">{takeoverHint}</p>
              {expired && (
                <button
                  onClick={() => take(false)}
                  disabled={loading}
                  className="w-full rounded-xl cricket-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Take Control
                </button>
              )}
              <button
                onClick={() => take(true)}
                disabled={loading}
                title="Use only if the active scorer is unavailable and you need to continue the match."
                className="w-full rounded-xl border border-tertiary py-2.5 text-sm font-semibold text-tertiary hover:bg-red-50 disabled:opacity-50"
              >
                Force Takeover
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-foreground-muted">No active scorer. Take control before entering deliveries.</p>
          <button
            onClick={() => take(false)}
            disabled={loading}
            className="w-full rounded-xl cricket-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Take Scorer Control
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerSelector({ label, players, value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-foreground-muted">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled}
        className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary disabled:opacity-50"
      >
        <option value="">Choose player</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>{p.display_name}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Wagon Wheel shared geometry ─────────────────────────────────────────────
// Batter sits at bottom-center (CY + BATTER_Y_OFFSET). Angle 0° = straight up.
// All three wagon wheel components (Picker, match display, career) share these.

function degToRad(d) { return (d * Math.PI) / 180; }

function polarToXY(cx, cy, rx, ry, angleDeg) {
  const rad = degToRad(angleDeg - 90);
  return [cx + rx * Math.cos(rad), cy + ry * Math.sin(rad)];
}

// Annular sector path — ring between innerR and outerR, not a pie slice from center
function annularSectorPath(cx, cy, rx, ry, innerFrac, startDeg, endDeg) {
  const oRx = rx, oRy = ry;
  const iRx = rx * innerFrac, iRy = ry * innerFrac;
  const s = startDeg, e = endDeg;
  const [ox1, oy1] = polarToXY(cx, cy, oRx, oRy, s);
  const [ox2, oy2] = polarToXY(cx, cy, oRx, oRy, e);
  const [ix1, iy1] = polarToXY(cx, cy, iRx, iRy, s);
  const [ix2, iy2] = polarToXY(cx, cy, iRx, iRy, e);
  const span = ((e - s) % 360 + 360) % 360;
  const large = span > 180 ? 1 : 0;
  return [
    `M ${ox1} ${oy1}`,
    `A ${oRx} ${oRy} 0 ${large} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${iRx} ${iRy} 0 ${large} 0 ${ix1} ${iy1}`,
    "Z",
  ].join(" ");
}

function angleFromCenter(cx, cy, px, py) {
  let deg = Math.atan2(py - cy, px - cx) * (180 / Math.PI) + 90;
  if (deg < 0) deg += 360;
  return deg;
}

// 9 balanced sectors clockwise from top. Leg side = left of screen (right-handed batter).
const SECTOR_ANGLES = [
  { id: "long_on",    start: 0,   end: 45  },
  { id: "mid_wicket", start: 45,  end: 90  },
  { id: "square_leg", start: 90,  end: 135 },
  { id: "fine_leg",   start: 135, end: 180 },
  { id: "third_man",  start: 180, end: 225 },
  { id: "point",      start: 225, end: 270 },
  { id: "cover",      start: 270, end: 315 },
  { id: "mid_off",    start: 315, end: 337 },
  { id: "long_off",   start: 337, end: 360 },
];

function hitZone(cx, cy, px, py) {
  const angle = angleFromCenter(cx, cy, px, py);
  for (const s of SECTOR_ANGLES) {
    if (angle >= s.start && angle < s.end) return s.id;
  }
  return "long_off";
}

// Zone color groups: leg-side blue, off-side teal, straight amber, covers green
const ZONE_META = {
  fine_leg:   { label: "Fine Leg",   color: "#3b82f6" },
  square_leg: { label: "Square Leg", color: "#2563eb" },
  mid_wicket: { label: "Mid Wicket", color: "#16a34a" },
  long_on:    { label: "Long On",    color: "#d97706" },
  long_off:   { label: "Long Off",   color: "#b45309" },
  mid_off:    { label: "Mid Off",    color: "#059669" },
  cover:      { label: "Cover",      color: "#10b981" },
  point:      { label: "Point",      color: "#0891b2" },
  third_man:  { label: "Third Man",  color: "#0e7490" },
};

// Returns normalised (x, y) centroid for storage — 0=off/top, 1=leg/bottom
function zoneCentroid(zoneId) {
  const map = {
    fine_leg:   [0.75, 0.92],
    third_man:  [0.25, 0.92],
    square_leg: [0.88, 0.65],
    point:      [0.12, 0.65],
    mid_wicket: [0.82, 0.38],
    cover:      [0.18, 0.38],
    long_on:    [0.65, 0.08],
    long_off:   [0.35, 0.08],
    mid_off:    [0.22, 0.25],
  };
  return map[zoneId] ?? [0.5, 0.5];
}

// Returns SVG [x, y] for the centroid of a zone at ~75% radius (mid-annulus)
function zoneSVGCenter(cx, cy, rx, ry, zoneId) {
  const s = SECTOR_ANGLES.find((z) => z.id === zoneId);
  if (!s) return [cx, cy];
  const midAngle = (s.start + s.end) / 2;
  const r = 0.75; // 75% of radius = middle of annulus
  return polarToXY(cx, cy, rx * r, ry * r, midAngle);
}

// Shared cricket field SVG base (no interaction, pure rendering)
function CricketFieldBase({ cx, cy, rx, ry }) {
  return (
    <>
      {/* Outfield */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#15803d" stroke="#14532d" strokeWidth="2" />
      {/* Infield (lighter green) */}
      <ellipse cx={cx} cy={cy} rx={rx * 0.52} ry={ry * 0.52} fill="#16a34a" />
      {/* 30-yard circle */}
      <ellipse cx={cx} cy={cy} rx={rx * 0.52} ry={ry * 0.52} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="5 4" />
      {/* Pitch */}
      <rect x={cx - 9} y={cy - 52} width={18} height={104} rx="3"
            fill="rgba(255,218,90,0.22)" stroke="rgba(255,218,90,0.5)" strokeWidth="1" />
      {/* Bowling crease */}
      <line x1={cx - 13} y1={cy - 40} x2={cx + 13} y2={cy - 40} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      {/* Batting crease */}
      <line x1={cx - 13} y1={cy + 40} x2={cx + 13} y2={cy + 40} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      {/* Stumps at bowling end */}
      {[-3, 0, 3].map((dx) => (
        <line key={dx} x1={cx + dx} y1={cy - 40} x2={cx + dx} y2={cy - 52}
              stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
      ))}
      {/* Stumps at batting end */}
      {[-3, 0, 3].map((dx) => (
        <line key={dx} x1={cx + dx} y1={cy + 40} x2={cx + dx} y2={cy + 52}
              stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
      ))}
      {/* Compass labels */}
      <text x={cx} y={12} textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="8" fontWeight="600">STRAIGHT</text>
      <text x={cx} y={ry * 2 - 4} textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="8" fontWeight="600">FINE / 3RD MAN</text>
      <text x={7} y={cy + 4} textAnchor="start" fill="rgba(255,255,255,0.38)" fontSize="8" fontWeight="600">LEG</text>
      <text x={rx * 2 - 7} y={cy + 4} textAnchor="end" fill="rgba(255,255,255,0.38)" fontSize="8" fontWeight="600">OFF</text>
    </>
  );
}

// Batter icon at bottom of pitch — stick figure with bat
function BatterIcon({ cx, cy }) {
  const bx = cx, by = cy + 48; // below batting crease
  return (
    <g style={{ pointerEvents: "none" }}>
      {/* Body */}
      <line x1={bx} y1={by + 5} x2={bx} y2={by + 16} stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* Head */}
      <circle cx={bx} cy={by + 2} r="3.5" fill="white" />
      {/* Arms — one up holding bat */}
      <line x1={bx} y1={by + 8} x2={bx - 5} y2={by + 13} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={bx} y1={by + 8} x2={bx + 7} y2={by + 5} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      {/* Bat */}
      <line x1={bx + 7} y1={by + 5} x2={bx + 13} y2={by - 2} stroke="rgba(255,218,90,0.9)" strokeWidth="3" strokeLinecap="round" />
      {/* Legs */}
      <line x1={bx} y1={by + 16} x2={bx - 4} y2={by + 24} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={bx} y1={by + 16} x2={bx + 4} y2={by + 24} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      {/* Label */}
      <text x={bx} y={by + 31} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="6.5" fontWeight="600">BATTER</text>
    </g>
  );
}

// CSS keyframe injected once for the sector pulse animation
const WW_PULSE_CSS = `
@keyframes ww-sector-pulse {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.04); }
  100% { transform: scale(1); }
}
.ww-sector-active {
  animation: ww-sector-pulse 0.22s ease-out;
  transform-origin: center;
  transform-box: fill-box;
}
`;

function WagonWheelPicker({ runs, onConfirm, onSkip }) {
  const [selected, setSelected] = useState(null);
  const [pulseKey, setPulseKey] = useState(0); // increment to re-trigger animation
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef(null);

  const CX = 150, CY = 160, RX = 138, RY = 148;
  const BATTER_CY = CY + 40; // actual batter strike position inside pitch

  function getZoneFromEvent(e) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 300;
    const py = ((e.clientY - rect.top) / rect.height) * 340;
    const dx = (px - CX) / RX;
    const dy = (py - CY) / RY;
    if (dx * dx + dy * dy > 1) return null;
    return hitZone(CX, CY, px, py);
  }

  function selectZone(z) {
    if (z && z !== selected) {
      setSelected(z);
      setPulseKey((k) => k + 1);
    }
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    selectZone(getZoneFromEvent(e));
  }

  function onPointerMove(e) {
    if (!dragging) return;
    selectZone(getZoneFromEvent(e));
  }

  function onPointerUp(_e) { setDragging(false); }

  const runsColor = runs >= 6 ? "#4f46e5" : runs >= 4 ? "#16a34a" : "#0ea5e9";
  const runsLabel = runs === 1 ? "1 run" : `${runs} runs`;

  // Spoke endpoint: centroid of selected zone at 82% radius
  const spokeTip = selected ? zoneSVGCenter(CX, CY, RX * 0.82, RY * 0.82, selected) : null;

  return (
    <>
      <style>{WW_PULSE_CSS}</style>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-surface shadow-2xl overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Where did it go?</p>
              <p className="text-xl font-display font-bold text-foreground mt-0.5">
                <span style={{ color: runsColor }}>{runsLabel}</span>
              </p>
            </div>
            {selected ? (
              <span
                key={selected}
                className="rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all"
                style={{ background: ZONE_META[selected].color }}
              >
                {ZONE_META[selected].label}
              </span>
            ) : (
              <span className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-foreground-muted bg-surface-container border border-outline-variant">
                Tap field
              </span>
            )}
          </div>

          {/* SVG Field */}
          <div className="px-4 pb-2 touch-none select-none">
            <svg
              ref={svgRef}
              viewBox="0 0 300 340"
              className="w-full"
              style={{ touchAction: "none", cursor: "crosshair" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* Base field */}
              <CricketFieldBase cx={CX} cy={CY} rx={RX} ry={RY} />

              {/* Annular zone sectors — outer ring only */}
              {SECTOR_ANGLES.map((s) => {
                const isSelected = selected === s.id;
                const color = ZONE_META[s.id].color;
                return (
                  <path
                    key={s.id}
                    className={isSelected ? `ww-sector-active` : ""}
                    // new key on pulseKey forces React to remount → restarts animation
                    {...(isSelected ? { key: `${s.id}-${pulseKey}` } : { key: s.id })}
                    d={annularSectorPath(CX, CY, RX, RY, 0.52, s.start, s.end)}
                    fill={color}
                    fillOpacity={isSelected ? 0.82 : 0.18}
                    stroke={color}
                    strokeOpacity={isSelected ? 0.9 : 0.35}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    style={{ transition: "fill-opacity 0.12s, stroke-opacity 0.12s" }}
                  />
                );
              })}

              {/* Zone labels in each sector */}
              {SECTOR_ANGLES.map((s) => {
                const [lx, ly] = zoneSVGCenter(CX, CY, RX, RY, s.id);
                const isSelected = selected === s.id;
                return (
                  <text
                    key={`lbl-${s.id}`}
                    x={lx} y={ly + 3}
                    textAnchor="middle"
                    fill={isSelected ? "white" : "rgba(255,255,255,0.55)"}
                    fontSize="7.5"
                    fontWeight={isSelected ? "700" : "500"}
                    style={{ pointerEvents: "none", transition: "fill 0.12s" }}
                  >
                    {ZONE_META[s.id].label}
                  </text>
                );
              })}

              {/* Spoke line from batter to selected zone */}
              {selected && spokeTip && (
                <line
                  x1={CX} y1={BATTER_CY}
                  x2={spokeTip[0]} y2={spokeTip[1]}
                  stroke={ZONE_META[selected].color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeOpacity="0.9"
                  style={{ pointerEvents: "none" }}
                />
              )}

              {/* Batter icon */}
              <BatterIcon cx={CX} cy={CY} />

              {/* Tap hint when nothing selected */}
              {!selected && (
                <text x={CX} y={CY + 5} textAnchor="middle"
                      fill="rgba(255,255,255,0.45)" fontSize="9.5" fontWeight="500"
                      style={{ pointerEvents: "none" }}>
                  Tap or drag to pick a zone
                </text>
              )}
            </svg>
          </div>

          {/* Always-visible action buttons */}
          <div className="flex gap-2.5 px-5 pb-5 pt-1 shrink-0">
            <button
              onClick={onSkip}
              className="flex-1 rounded-xl border border-outline-variant bg-surface-container py-3 text-sm font-semibold text-foreground-muted hover:bg-surface-container-high transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => onConfirm(selected)}
              className="rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-95"
              style={{
                flex: 2,
                background: selected
                  ? `linear-gradient(135deg, ${ZONE_META[selected].color}, ${ZONE_META[selected].color}cc)`
                  : "#6b7280",
                boxShadow: selected ? `0 4px 14px ${ZONE_META[selected].color}55` : "none",
              }}
            >
              {selected ? `✓  ${ZONE_META[selected].label}` : "Confirm without zone"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function WicketModal({ batsmenPlayers, fielders, isFreeDelivery, singleWicketMode, onConfirm, onCancel }) {
  const [type, setType]             = useState("bowled");
  const [dismissed, setDismissed]   = useState(null);
  const [fielder, setFielder]       = useState(null);
  const [runsTaken, setRunsTaken]   = useState(0);

  const allowedWicketTypes = isFreeDelivery
    ? ["run_out"]
    : ["bowled", "caught", "lbw", "run_out", "stumped", "hit_wicket", "retired_hurt", "obstructing_field"];

  const effectiveType = isFreeDelivery ? "run_out" : type;
  const needsFielder = ["caught", "run_out", "stumped", "obstructing_field"].includes(effectiveType);
  const needsRunsTaken = effectiveType === "run_out";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl space-y-4">
        <h3 className="font-display text-lg font-bold text-tertiary">Wicket Details</h3>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground-muted">Wicket Type</label>
          <select
            value={effectiveType}
            onChange={(e) => {
              const nextType = e.target.value;
              setType(nextType);
              if (nextType !== "run_out") {
                setRunsTaken(0);
              }
            }}
            disabled={isFreeDelivery}
            className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary"
          >
            {allowedWicketTypes.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        {isFreeDelivery && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
            Free delivery active. Only run out is allowed.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground-muted">Dismissed Player</label>
          <select
            value={dismissed ?? ""}
            onChange={(e) => setDismissed(e.target.value ? Number(e.target.value) : null)}
            className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary"
          >
            <option value="">Choose batter</option>
            {batsmenPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>
          <p className="text-[10px] text-foreground-muted">
            {singleWicketMode
              ? "Single wicket mode: this is the only batter in the innings."
              : "Only the striker or non-striker can be dismissed."}
          </p>
        </div>

        {needsFielder && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground-muted">
              Fielder {type === "caught" ? "(catcher)" : type === "stumped" ? "(keeper)" : "(optional)"}
            </label>
            <select
              value={fielder ?? ""}
              onChange={(e) => setFielder(e.target.value ? Number(e.target.value) : null)}
              className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary"
            >
              <option value="">None</option>
              {fielders.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
          </div>
        )}

        {needsRunsTaken && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground-muted">Runs Taken</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRunsTaken((r) => Math.max(0, r - 1))}
                className="h-10 w-10 rounded-xl border border-outline-variant font-bold text-xl hover:bg-surface-container"
              >
                -
              </button>
              <span className="flex-1 text-center font-display text-3xl font-bold text-foreground tabular-nums">
                {runsTaken}
              </span>
              <button
                onClick={() => setRunsTaken((r) => Math.min(6, r + 1))}
                className="h-10 w-10 rounded-xl border border-outline-variant font-bold text-xl hover:bg-surface-container"
              >
                +
              </button>
            </div>
            <p className="text-[10px] text-foreground-muted">Record how many runs were taken before the run out.</p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ type: effectiveType, dismissed, fielder, runsTaken: needsRunsTaken ? runsTaken : 0 })}
            disabled={!dismissed}
            className="flex-1 rounded-xl bg-tertiary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Confirm Wicket
          </button>
        </div>
      </div>
    </div>
  );
}

function ExtraRunsModal({ label, showFreeDeliveryToggle, freeDeliveryChecked, onToggleFreeDelivery, onConfirm, onCancel }) {
  const [runs, setRuns] = useState(1);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-xs rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl space-y-4">
        <h3 className="font-display text-base font-bold text-foreground">{label}</h3>
        <p className="text-xs text-foreground-muted">How many extra runs were scored?</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRuns((r) => Math.max(0, r - 1))}
            className="h-10 w-10 rounded-xl border border-outline-variant font-bold text-xl hover:bg-surface-container"
          >-</button>
          <span className="flex-1 text-center font-display text-3xl font-bold text-foreground">{runs}</span>
          <button
            onClick={() => setRuns((r) => Math.min(20, r + 1))}
            className="h-10 w-10 rounded-xl border border-outline-variant font-bold text-xl hover:bg-surface-container"
          >+</button>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container">Cancel</button>
          <button onClick={() => onConfirm(runs)} className="flex-1 rounded-xl cricket-gradient py-2.5 text-sm font-semibold text-white">Confirm</button>
        </div>
        {showFreeDeliveryToggle && (
          <label className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-xs font-semibold text-foreground">
            <input
              type="checkbox"
              checked={freeDeliveryChecked}
              onChange={(e) => onToggleFreeDelivery(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            Mark next delivery as free
          </label>
        )}
      </div>
    </div>
  );
}

function CompleteInningsModal({ inningsNum, isSuperOver, target, onConfirm, onCancel }) {
  let title, body;
  if (isSuperOver) {
    const leg = inningsNum % 2 === 1 ? "1st" : "2nd";
    title = `Complete Super Over (${leg} leg)?`;
    body  = inningsNum % 2 === 1
      ? `This ends the first team's super over.${target !== null ? ` Target for the second team: ${target}.` : ""}`
      : "This ends the super over. The result will be determined by the scores.";
  } else if (inningsNum === 1) {
    title = "Complete 1st Innings?";
    body  = `This will end the 1st innings and start the innings break.${target !== null ? ` Target for 2nd innings: ${target}.` : ""}`;
  } else {
    title = "Complete 2nd Innings?";
    body  = "This will end the match and finalise the result.";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl space-y-4">
        <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-foreground-muted">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-tertiary py-2.5 text-sm font-semibold text-white">Complete Innings</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pause / Resume Panel ─────────────────────────────────────────────────────

const PAUSE_REASONS = [
  { value: "rain",             label: "Rain" },
  { value: "bad_light",        label: "Bad Light" },
  { value: "drinks",           label: "Drinks Break" },
  { value: "injury",           label: "Injury" },
  { value: "pitch_inspection", label: "Pitch Inspection" },
  { value: "other",            label: "Other" },
];

function PauseMatchPanel({ match, user, token, onStateRefresh }) {
  const isPaused   = match.status === "paused";
  const canAct     = match.active_scorer_user_id === user?.id
    || (match.match_teams ?? []).some((mt) => mt.team?.captain_user_id === user?.id)
    || match.created_by === user?.id;

  const [showForm, setShowForm] = useState(false);
  const [reason,   setReason]   = useState("rain");
  const [note,     setNote]     = useState("");
  const [busy,     setBusy]     = useState(false);

  if (!canAct) return null;

  async function pause() {
    setBusy(true);
    try {
      await apiRequest(`/api/matches/${match.code}/pause`, {
        method: "POST", token, body: { reason, note: note || null },
      });
      setShowForm(false);
      setNote("");
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Could not pause match.");
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    setBusy(true);
    try {
      await apiRequest(`/api/matches/${match.code}/resume`, { method: "POST", token });
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Could not resume match.");
    } finally {
      setBusy(false);
    }
  }

  if (isPaused) {
    const label = PAUSE_REASONS.find((r) => r.value === match.pause_reason)?.label ?? match.pause_reason ?? "Break";
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="pause_circle" className="text-2xl text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-amber-800">Match Paused — {label}</p>
            {match.pause_note && <p className="text-xs text-amber-600 mt-0.5 truncate">{match.pause_note}</p>}
          </div>
        </div>
        <button
          onClick={resume}
          disabled={busy}
          className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {busy ? "Resuming…" : "▶ Resume Play"}
        </button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-xl border border-outline-variant bg-surface py-2.5 text-sm font-semibold text-foreground-muted hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="pause_circle" className="text-base" />
        Pause Match
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-bold text-foreground">Pause Match</p>
        <button onClick={() => setShowForm(false)} className="text-foreground-muted hover:text-foreground">
          <Icon name="close" className="text-base" />
        </button>
      </div>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
      >
        {PAUSE_REASONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (e.g. heavy rain started)"
        maxLength={255}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
      />
      <div className="flex gap-2">
        <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-xs font-semibold hover:bg-surface-container">
          Cancel
        </button>
        <button onClick={pause} disabled={busy} className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
          {busy ? "Pausing…" : "Confirm Pause"}
        </button>
      </div>
    </div>
  );
}

// ─── Manual Commentary Panel ──────────────────────────────────────────────────

function ManualCommentaryPanel({ match, user, token, onStateRefresh }) {
  const canAct = match.active_scorer_user_id === user?.id
    || (match.match_teams ?? []).some((mt) => mt.team?.captain_user_id === user?.id)
    || match.created_by === user?.id;

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!canAct) return null;

  async function submit() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    try {
      await apiRequest(`/api/matches/${match.code}/commentary`, {
        method: "POST", token, body: { body },
      });
      setText("");
      toast.success("Commentary added.");
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Could not add commentary.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-4 space-y-2">
      <p className="font-display text-sm font-bold text-foreground">Add Commentary</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="e.g. Rain has stopped, covers coming off…"
        rows={2}
        maxLength={500}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary"
      />
      <button
        onClick={submit}
        disabled={busy || !text.trim()}
        className="w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-primary/90"
      >
        {busy ? "Posting…" : "Post Commentary"}
      </button>
    </div>
  );
}

// ─── DLS Panel ────────────────────────────────────────────────────────────────

function DlsPanel({ match, scorecard, user, token, onStateRefresh }) {
  const canAct = match.active_scorer_user_id === user?.id
    || (match.match_teams ?? []).some((mt) => mt.team?.captain_user_id === user?.id)
    || match.created_by === user?.id;

  const dlsApplied  = Boolean(match.dls_applied);
  const innings1    = (match.innings ?? []).find((i) => i.innings_number === 1);
  const innings2    = (match.innings ?? []).find((i) => i.innings_number === 2);
  const isInn1Live  = ["live", "paused"].includes(match.status) && innings1?.status === "in_progress" && !innings2;
  const isInn2Phase = match.status === "innings_break"
    || (["live", "paused"].includes(match.status) && innings2);
  const inn1Score   = innings1?.total_runs ?? 0;
  const oversLimit  = match.overs_limit ?? 20;

  const [showForm,  setShowForm]  = useState(false);
  const [formMode,  setFormMode]  = useState("apply"); // "interrupt" | "apply"
  const [overs,     setOvers]     = useState("");
  const [busy,      setBusy]      = useState(false);

  if (!canAct) return null;
  // Only show during an active match (not upcoming/completed/abandoned)
  if (!["live", "paused", "innings_break"].includes(match.status)) return null;

  async function interruptInnings1() {
    const n = parseInt(overs, 10);
    if (!n || n < 1 || n > oversLimit) return toast.error(`Enter overs between 1 and ${oversLimit}.`);
    setBusy(true);
    try {
      await apiRequest(`/api/matches/${match.code}/dls/interrupt-innings1`, {
        method: "POST", token, body: { overs_to_play: n },
      });
      toast.success(`Innings 1 capped at ${n} overs.`);
      setShowForm(false); setOvers("");
      await onStateRefresh();
    } catch (e) { toast.error(e?.data?.message ?? "Failed."); }
    finally { setBusy(false); }
  }

  async function applyDls() {
    const n = parseInt(overs, 10);
    if (!n || n < 1 || n > oversLimit) return toast.error(`Enter overs between 1 and ${oversLimit}.`);
    setBusy(true);
    try {
      const res = await apiRequest(`/api/matches/${match.code}/dls/apply`, {
        method: "POST", token, body: { team2_overs: n },
      });
      toast.success(`DLS applied — target ${res.target} in ${n} overs.`);
      setShowForm(false); setOvers("");
      await onStateRefresh();
    } catch (e) { toast.error(e?.data?.message ?? "Failed."); }
    finally { setBusy(false); }
  }

  async function removeDls() {
    setBusy(true);
    try {
      await apiRequest(`/api/matches/${match.code}/dls`, { method: "DELETE", token });
      toast.success("DLS removed.");
      await onStateRefresh();
    } catch (e) { toast.error(e?.data?.message ?? "Failed."); }
    finally { setBusy(false); }
  }

  // DLS is active — show the live dashboard (works for both innings_break and innings 2 live)
  if (dlsApplied && isInn2Phase) {
    const target   = match.dls_target;
    const par      = match.dls_par;
    const inn2Runs = innings2?.total_runs ?? 0;
    const need     = Math.max(0, target - inn2Runs);
    // During innings break par hasn't been calculated yet (team 2 hasn't batted) — show "—"
    const isBreak  = match.status === "innings_break";
    const abovePar = !isBreak && par != null && inn2Runs > par;
    const belowPar = !isBreak && par != null && inn2Runs <= par;

    return (
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="water_drop" className="text-blue-600 text-xl" />
            <p className="font-bold text-sm text-blue-800">
              {isBreak ? `DLS — Target ${target}` : "DLS Active"}
            </p>
          </div>
          <span className="text-[10px] font-bold text-blue-500 bg-blue-100 rounded-full px-2 py-0.5">
            R1 {match.dls_team1_resources}% · R2 {match.dls_team2_resources}%
          </span>
        </div>
        <p className="text-xs text-blue-600">
          Team 1 scored {inn1Score}.{" "}
          {isBreak
            ? `Team 2 needs ${target} to win.`
            : `Team 2 needs ${need} more to win.`}
        </p>
        {!isBreak && par != null && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white border border-blue-200 p-2">
              <p className="text-xs font-bold text-blue-800">{target}</p>
              <p className="text-[10px] text-blue-500">Target</p>
            </div>
            <div className={`rounded-xl border p-2 ${abovePar ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className={`text-xs font-bold ${abovePar ? "text-green-700" : "text-red-700"}`}>{par}</p>
              <p className={`text-[10px] ${abovePar ? "text-green-500" : "text-red-500"}`}>
                {abovePar ? "Above Par ↑" : "Below Par ↓"}
              </p>
            </div>
            <div className="rounded-xl bg-white border border-blue-200 p-2">
              <p className="text-xs font-bold text-blue-800">{need}</p>
              <p className="text-[10px] text-blue-500">To Win</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => { setFormMode("apply"); setShowForm(true); }}
            className="flex-1 rounded-xl border border-blue-300 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            Update Overs
          </button>
          <button onClick={removeDls} disabled={busy} className="flex-1 rounded-xl border border-red-200 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
            {busy ? "…" : "Remove DLS"}
          </button>
        </div>
        {showForm && (
          <div className="space-y-2 pt-1 border-t border-blue-200">
            <p className="text-xs text-blue-700 font-semibold">New team 2 overs allotted:</p>
            <input type="number" min={1} max={oversLimit} value={overs} onChange={(e) => setOvers(e.target.value)}
              placeholder={`1–${oversLimit}`}
              className="w-full rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-outline-variant py-2 text-xs font-semibold">Cancel</button>
              <button onClick={applyDls} disabled={busy || !overs} className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Applying…" : "Update"}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal state — show collapsed button with dropdown
  if (!showForm) {
    return (
      <button
        onClick={() => {
          setFormMode(isInn1Live ? "interrupt" : "apply");
          setShowForm(true);
        }}
        className="w-full rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="water_drop" className="text-base" />
        {isInn1Live ? "Rain — Reduce Innings 1 Overs" : "Apply DLS (Rain/Bad Light)"}
      </button>
    );
  }

  // Expanded form
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="water_drop" className="text-blue-600 text-lg" />
          <p className="font-display text-sm font-bold text-blue-800">
            {formMode === "interrupt" ? "Reduce Innings 1 Overs" : "Apply DLS"}
          </p>
        </div>
        <button onClick={() => setShowForm(false)} className="text-foreground-muted hover:text-foreground">
          <Icon name="close" className="text-base" />
        </button>
      </div>
      {formMode === "interrupt" ? (
        <p className="text-xs text-blue-600">
          How many overs will innings 1 face in total? (Already bowled: {innings1?.total_overs ?? 0})
        </p>
      ) : (
        <p className="text-xs text-blue-600">
          How many overs will team 2 have? (Original: {oversLimit})
        </p>
      )}
      <input
        type="number" min={1} max={oversLimit} value={overs}
        onChange={(e) => setOvers(e.target.value)}
        placeholder={`1–${oversLimit}`}
        className="w-full rounded-xl border border-outline-variant bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
      {formMode === "apply" && overs && !isNaN(parseInt(overs)) && (
        <p className="text-[11px] text-blue-500 bg-blue-100 rounded-lg px-3 py-1.5">
          Team 1 scored {inn1Score}. DLS will calculate the revised target based on resources.
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-xs font-semibold hover:bg-surface-container">Cancel</button>
        <button
          onClick={formMode === "interrupt" ? interruptInnings1 : applyDls}
          disabled={busy || !overs}
          className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Working…" : formMode === "interrupt" ? "Set Overs" : "Apply DLS"}
        </button>
      </div>
    </div>
  );
}

function SuperOverPauseModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState("rain");
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl space-y-4">
        <h3 className="font-display text-lg font-bold text-foreground">Pause Super Over?</h3>
        <p className="text-sm text-foreground-muted">
          Save why the super over had to stop so the scorecard and live view can explain it clearly.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground-muted">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="rain">Rain</option>
            <option value="lighting">Lighting</option>
            <option value="player_availability">Player availability</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground-muted">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Optional detail for scorers and spectators"
            className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container">
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ reason, note: note.trim() || null })}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Pause Super Over
          </button>
        </div>
      </div>
    </div>
  );
}

function SuperOverResolveModal({ teams, onConfirm, onCancel }) {
  const [resolution, setResolution] = useState("tie");
  const [winnerTeamId, setWinnerTeamId] = useState(teams[0]?.id ?? null);
  const [note, setNote] = useState("");
  const needsWinner = resolution === "winner";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl space-y-4">
        <h3 className="font-display text-lg font-bold text-foreground">Resolve Super Over</h3>
        <p className="text-sm text-foreground-muted">
          Use this when the super over cannot continue and the league needs a final rule-based decision.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground-muted">Outcome</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="tie">Tie / Draw</option>
            <option value="winner">Declare Winner</option>
          </select>
        </div>
        {needsWinner && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground-muted">Winning Team</label>
            <select
              value={winnerTeamId ?? ""}
              onChange={(e) => setWinnerTeamId(Number(e.target.value))}
              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-foreground"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground-muted">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Optional rule note"
            className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container">
            Cancel
          </button>
          <button
            onClick={() => onConfirm({
              resolution,
              winner_team_id: needsWinner ? winnerTeamId : null,
              note: note.trim() || null,
            })}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
}

function UndoConfirmModal({ delivery, onConfirm, onCancel, busy }) {
  const title = delivery
    ? delivery.commentary ?? `Over ${delivery.over}.${delivery.ball_number}`
    : "the last ball";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-tertiary">Undo Last Ball?</h3>
          <p className="text-xs text-foreground-muted mt-1">
            This will remove <span className="font-semibold text-foreground">{title}</span> from the scorebook.
          </p>
          <p className="text-[10px] text-amber-600 mt-1 font-semibold">
            Use correction instead if the ball details are wrong but the delivery should stay in the innings.
          </p>
        </div>

        {delivery && (
          <div className="rounded-xl border border-outline-variant bg-surface-container p-3 text-xs text-foreground-muted space-y-1">
            <p><span className="font-semibold text-foreground">Runs:</span> {delivery.runs_bat ?? 0}</p>
            <p><span className="font-semibold text-foreground">Extras:</span> {delivery.extras_type ?? "none"} {delivery.extras_runs ? `+${delivery.extras_runs}` : ""}</p>
            <p><span className="font-semibold text-foreground">Wicket:</span> {delivery.is_wicket ? "Yes" : "No"}</p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {busy ? "Undoing..." : "Undo Ball"}
          </button>
        </div>
      </div>
    </div>
  );
}

// â"€â"€â"€ Man of the Match Modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function MotmModal({ players, token, matchCode, onDone }) {
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      await apiRequest(`/api/matches/${matchCode}/motm`, {
        method: "POST",
        token,
        body: { match_player_id: selected },
      });
      toast.success("Man of the match announced!");
    } catch (e) {
      toast.error(e?.data?.message ?? "Could not save MOTM.");
    } finally {
      setSaving(false);
      onDone();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface shadow-2xl overflow-hidden">
        <div className="cricket-gradient px-5 py-4">
          <div className="flex items-center gap-3">
            <Icon name="emoji_events" className="text-3xl text-white" />
            <div>
              <h3 className="font-display text-lg font-bold text-white">Man of the Match</h3>
              <p className="text-xs text-white/70">Select the standout performer</p>
            </div>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/30">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                selected === p.id ? "bg-primary/10" : "hover:bg-surface-container"
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                selected === p.id ? "bg-primary text-white" : "bg-surface-container text-foreground-muted"
              }`}>
                {selected === p.id
                  ? <Icon name="star" className="text-base" />
                  : p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                <p className="text-xs text-foreground-muted truncate">{p.team}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3 p-4 border-t border-outline-variant">
          <button
            onClick={onDone}
            className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="flex-1 rounded-xl cricket-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Announce"}
          </button>
        </div>
      </div>
    </div>
  );
}

// â"€â"€â"€ Recent Overs Scroller (scoring page) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function ScoringRecentOvers({ state, scorecard }) {
  const { innings, current_over, bowler } = state;
  if (!innings) return null;

  const scInnings      = scorecard?.innings?.find((i) => i.innings_number === innings.innings_number);
  const completedOvers = (scInnings?.overs_log ?? []).filter((o) => o.is_completed);
  const last2          = completedOvers.slice(-2);

  if (last2.length === 0 && !current_over) return null;

  function chipStyle(d) {
    if (!d) return "border border-dashed border-outline-variant text-foreground-muted/30";
    if (d.is_wicket)              return "bg-tertiary text-white";
    if (d.runs_bat === 6)         return "bg-indigo-900 text-white";
    if (d.runs_bat === 4)         return "bg-primary text-white";
    if ((d.extras_type ?? d.extras) === "wide")    return "bg-amber-100 text-amber-700 border border-amber-300";
    if ((d.extras_type ?? d.extras) === "no_ball") return "bg-orange-100 text-orange-700 border border-orange-300";
    return "border border-outline-variant text-foreground";
  }

  function chip(d, i) {
    const er = d?.extras_runs ?? 0;
    const rb = d?.runs_bat ?? 0;
    const ex = d?.extras_type ?? d?.extras;
    let label = "";
    if (d) {
      if (d.is_wicket)        label = "W";
      else if (ex === "wide")    label = er > 0 ? `${er}Wd` : "Wd";
      else if (ex === "no_ball") label = rb > 0 ? `${rb}Nb` : er > 0 ? `${er}Nb` : "Nb";
      else if (ex === "bye")     label = er > 0 ? `${er}B` : "B";
      else if (ex === "leg_bye") label = er > 0 ? `${er}Lb` : "Lb";
      else if (rb === 0)         label = "·";
      else                       label = String(rb);
    }
    return (
      <span key={i} className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none ${chipStyle(d)}`}>
        {label}
      </span>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-container-low/50">
        <span className="text-xs font-bold text-foreground-muted uppercase tracking-wide">Recent Overs</span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-px min-w-fit">
          {last2.map((ov) => {
            const slots = [...(ov.balls ?? [])];
            while (slots.length < 6) slots.push(null);
            return (
              <div key={ov.over_number} className="flex flex-col gap-1.5 px-3 py-3 border-r border-outline-variant min-w-fit">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[10px] font-semibold text-foreground">
                    {ov.runs}R{ov.wickets > 0 ? ` ${ov.wickets}W` : ""}
                  </span>
                </div>
                <div className="flex gap-1">{slots.map((b, i) => chip(b, i))}</div>
                <p className="text-[10px] text-foreground-muted truncate max-w-[160px]">{ov.bowler}</p>
              </div>
            );
          })}
          {current_over && (() => {
            const balls = (current_over.deliveries ?? [])
              .filter((d) => !d.is_undone)
              .sort((a, b) => a.raw_ball_number - b.raw_ball_number);
            const slots = [...balls];
            while (slots.length < 6) slots.push(null);
            const overRuns = balls.reduce((s, d) => s + (d.runs_bat ?? 0) + (d.extras_runs ?? 0), 0);
            const overWkts = balls.filter((d) => d.is_wicket).length;
            return (
              <div className="flex flex-col gap-1.5 px-3 py-3 bg-primary/5 min-w-fit">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Live
                  </span>
                  <span className="text-[10px] font-semibold text-foreground">
                    {overRuns}R{overWkts > 0 ? ` ${overWkts}W` : ""}
                  </span>
                </div>
                <div className="flex gap-1">{slots.map((b, i) => chip(b, i))}</div>
                <p className="text-[10px] text-foreground-muted truncate max-w-[160px]">{bowler?.player?.display_name ?? ""}</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// â"€â"€â"€ Current Over Ball Row â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function CurrentOverBallRow({ currentOver }) {
  const balls = (currentOver?.deliveries ?? [])
    .filter((d) => !d.is_undone)
    .sort((a, b) => a.raw_ball_number - b.raw_ball_number);

  if (!currentOver) return null;

  const legalCount = balls.filter((b) => b.is_legal_ball).length;
  const emptySlots = Math.max(0, 6 - balls.length);

  function chipColor(d) {
    if (!d)                       return "bg-white/10 text-white/20";
    if (d.is_wicket)              return "bg-red-500 text-white";
    if (d.runs_bat === 6)         return "bg-purple-500 text-white";
    if (d.runs_bat === 4)         return "bg-green-500 text-white";
    const ex = d.extras_type ?? d.extras;
    if (ex === "wide")            return "bg-amber-400 text-white";
    if (ex === "no_ball")         return "bg-orange-500 text-white";
    if (d.runs_bat === 0)         return "bg-white/15 text-white/60";
    return "bg-white/25 text-white";
  }

  function chipLabel(d) {
    if (!d) return "";
    const ex = d.extras_type ?? d.extras;
    const er = d.extras_runs ?? 0;
    const rb = d.runs_bat ?? 0;
    if (d.is_wicket) return rb > 0 ? `${rb}W` : "W";
    if (ex === "wide")    return er > 1 ? `${er}Wd` : "Wd";
    if (ex === "no_ball") return rb > 0 ? `${rb}Nb` : "Nb";
    if (ex === "bye")     return er > 0 ? `${er}B` : "B";
    if (ex === "leg_bye") return er > 0 ? `${er}Lb` : "Lb";
    return rb === 0 ? "·" : String(rb);
  }

  let legalSeq = 0;
  const ballsWithSeq = balls.map((b) => {
    if (b.is_legal_ball) legalSeq++;
    return { ...b, seq: b.is_legal_ball ? legalSeq : null };
  });

  return (
    <div className="border-t border-white/10 px-4 py-2.5">
      <div className="flex items-center gap-2">
        {ballsWithSeq.map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 shrink-0">
            <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${chipColor(b)}`}>
              {chipLabel(b)}
            </span>
            <span className="text-[9px] font-medium text-white/40 leading-none">
              {b.seq !== null ? b.seq : "†"}
            </span>
          </div>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`e-${i}`} className="flex flex-col items-center gap-0.5 shrink-0">
            <span className="h-8 w-8 rounded-full bg-white/10" />
            <span className="text-[9px] text-white/30 leading-none">{legalCount + i + 1}</span>
          </div>
        ))}
        <span className="h-2 w-2 rounded-full bg-blue-300 animate-pulse shrink-0 ml-1" />
      </div>
    </div>
  );
}

// â"€â"€â"€ Main Scoring Panel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function ScoringPanel({ state, scorecard, user, token, onStateRefresh, onProposeCorrection }) {
  const router = useRouter();
  const { match, innings, current_over, batsmen, bowler } = state;

  const isActiveScorer = match.active_scorer_user_id === user?.id;

  // match.players is a flat array of all MatchPlayers for this match
  const allPlayers = match.players ?? [];

  const battingRosterPlayers = allPlayers
    .filter((p) => p.team_id === innings?.batting_team_id && !p.is_substitute);
  const battingPlayers = allPlayers
    .filter((p) => p.team_id === innings?.batting_team_id && p.status !== "out" && !p.is_substitute);

  const ineligibleBowlerIds = state.ineligible_bowler_ids ?? [];
  const bowlingPlayers = allPlayers
    .filter((p) => p.team_id === innings?.bowling_team_id && !p.is_substitute && !ineligibleBowlerIds.includes(p.id));

  // Player selectors
  const [strikerId,    setStrikerId]    = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const [bowlerId,     setBowlerId]     = useState(null);

  // Sync selectors from server state on every update â€" server is source of truth
  useEffect(() => {
    const nextStriker = state.last_striker_id ?? null;
    const nextNonStriker = state.last_non_striker_id ?? null;
    const nextBowler = state.last_bowler_id ?? null;

    queueMicrotask(() => {
      setStrikerId(nextStriker);
      setNonStrikerId(nextNonStriker);
      setBowlerId(nextBowler);
    });
  }, [state.last_striker_id, state.last_non_striker_id, state.last_bowler_id]);

  // Clear bowler selection if they become ineligible (over ended, limit reached)
  useEffect(() => {
    if (bowlerId && ineligibleBowlerIds.includes(bowlerId)) {
      queueMicrotask(() => setBowlerId(null));
    }
  }, [ineligibleBowlerIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const singleWicketMode = match.match_type === "single_wicket" || (!match.match_type && battingRosterPlayers.length === 1);
  const soleBattingPlayer = singleWicketMode ? battingRosterPlayers[0] ?? null : null;
  const soleBowler = bowlingPlayers.length === 1 ? bowlingPlayers[0] ?? null : null;

  const [submitting,    setSubmitting]    = useState(false);
  const [undoing,       setUndoing]       = useState(false);
  const [completing,    setCompleting]    = useState(false);
  const [modal,         setModal]         = useState(null);
  const [superOverModal, setSuperOverModal] = useState(null);
  const [pendingExtras, setPendingExtras] = useState(null);
  const [markNextDeliveryFree, setMarkNextDeliveryFree] = useState(false);
  const [undoTarget,    setUndoTarget]    = useState(null);
  const [wagonWheelPayload, setWagonWheelPayload] = useState(null); // pending delivery awaiting zone pick
  const [trackWagonWheel, setTrackWagonWheel] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("ww_track");
    return saved === null ? true : saved === "true";
  });

  function toggleWagonWheel() {
    setTrackWagonWheel((prev) => {
      const next = !prev;
      localStorage.setItem("ww_track", String(next));
      return next;
    });
  }
  const actionRefs = useRef({ handleRuns: null, handleExtra: null, handleWicket: null, handleUndo: null });
  const isSuperOver = Boolean(innings?.is_super_over);

  const canScore = isActiveScorer && innings?.status === "in_progress";

  // If scorer loses control while picker is open, dismiss it so delivery isn't stuck pending
  useEffect(() => {
    if (!canScore && wagonWheelPayload) setWagonWheelPayload(null);
  }, [canScore]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedPlayers = {
    striker: battingPlayers.find((p) => p.id === strikerId) ?? null,
    nonStriker: battingPlayers.find((p) => p.id === nonStrikerId) ?? null,
    bowler: bowlingPlayers.find((p) => p.id === bowlerId) ?? null,
  };
  const selectionError = (() => {
    if (!canScore) return "";
    if (!strikerId || !bowlerId) return "";
    if (!singleWicketMode && !nonStrikerId) return "";
    if (!singleWicketMode && strikerId === nonStrikerId) return "Striker and non-striker cannot be the same player.";
    if (singleWicketMode && nonStrikerId && strikerId !== nonStrikerId) return "Single wicket mode uses the same batter at both ends.";
    if (strikerId === bowlerId || (!singleWicketMode && nonStrikerId === bowlerId)) return "A bowler cannot also be one of the batting players.";
    if (!selectedPlayers.striker || (!singleWicketMode && !selectedPlayers.nonStriker)) return "Select valid batting players for this innings.";
    if (!selectedPlayers.bowler) return "Select a valid bowler from the bowling side.";
    return "";
  })();
  const canSubmitDelivery = canScore && !selectionError && !submitting;

  useEffect(() => {
    if (!canScore) return;

    if (soleBattingPlayer?.id) {
      queueMicrotask(() => {
        setStrikerId((current) => current ?? soleBattingPlayer.id);
        setNonStrikerId((current) => current ?? soleBattingPlayer.id);
      });
    }

    if (soleBowler?.id) {
      queueMicrotask(() => {
        setBowlerId((current) => current ?? soleBowler.id);
      });
    }
  }, [canScore, soleBattingPlayer?.id, soleBowler?.id]);

  const superOverTeams = (match.match_teams ?? []).map((mt) => ({
    id: mt.team_id ?? mt.team?.id,
    name: mt.team?.name ?? mt.team_name ?? mt.name ?? "Team",
  })).filter((t) => t.id);

  async function submit(payload) {
    if (!canScore) return;
    const resolvedNonStrikerId = singleWicketMode ? strikerId : nonStrikerId;
    if (!strikerId || !resolvedNonStrikerId || !bowlerId) {
      toast.warning(singleWicketMode ? "Select batter and bowler first." : "Select striker, non-striker, and bowler first.");
      return;
    }
    if (selectionError) {
      toast.error(selectionError);
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest(`/api/innings/${innings.id}/delivery`, {
        method: "POST",
        token,
        body: {
          striker_player_id:     strikerId,
          non_striker_player_id: resolvedNonStrikerId,
          bowler_player_id:      bowlerId,
          client_action_id:      uuid(),
          ...payload,
        },
      });

      // Auto-swap striker/non-striker
      const delivery   = res.delivery;
      const freshOver  = res.over;
      const isLegal    = delivery?.is_legal_ball;
      const runsScored = (delivery?.runs_bat ?? 0) + (delivery?.extras_runs ?? 0);
      const isOdd      = runsScored % 2 === 1;
      const overJustEnded = isLegal && freshOver?.is_completed;

      // Swap when: odd runs on a legal ball, OR the over just completed (batters cross ends)
      if ((isOdd && isLegal) || overJustEnded) {
        setStrikerId(nonStrikerId);
        setNonStrikerId(strikerId);
      }

      await onStateRefresh();

      if (singleWicketMode && delivery?.is_wicket) {
        setModal("complete");
        return;
      }

      // If overs are now exhausted, prompt to complete innings
      // Super overs are limited to 1 over regardless of match.overs_limit
      const freshInnings = res.innings;
      const inningsLimit = freshInnings?.is_super_over ? 1 : (match.overs_limit ?? 20);
      if (freshInnings && freshInnings.total_overs >= inningsLimit) {
        toast.info(
          `All ${inningsLimit} over${inningsLimit !== 1 ? "s" : ""} bowled — complete the innings to continue.`,
          { duration: 8000, id: "overs-complete" }
        );
        setModal("complete");
      }
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to record delivery.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRuns(runs) {
    if (!canSubmitDelivery) return;
    const payload = { runs_bat: runs, extras_type: "none", extras_runs: 0 };
    if (runs > 0 && trackWagonWheel) {
      setWagonWheelPayload(payload);
    } else {
      submit(payload);
    }
  }

  function handleWagonWheelConfirm(zone) {
    if (!wagonWheelPayload) return;
    const payload = { ...wagonWheelPayload };
    if (zone) {
      const [x, y] = zoneCentroid(zone);
      payload.shot_zone = { x, y, zone };
    }
    setWagonWheelPayload(null);
    submit(payload);
  }

  function handleWagonWheelSkip() {
    if (!wagonWheelPayload) return;
    const payload = { ...wagonWheelPayload };
    setWagonWheelPayload(null);
    submit(payload);
  }

  function handleExtra(type) {
    // Wide / No-ball: need extra runs count first (default 1)
    if (type === "wide" || type === "no_ball" || type === "bye" || type === "leg_bye") {
      if (!canSubmitDelivery) return;
      setPendingExtras({ type, runs_bat: 0 });
      if (type === "no_ball") setMarkNextDeliveryFree(false);
      setModal(`${type}_runs`);
    }
  }

  function handleExtraConfirm(runs) {
    const { type, runs_bat } = pendingExtras;
    submit({
      runs_bat,
      extras_type: type,
      extras_runs: runs,
      mark_next_delivery_free: type === "no_ball" ? markNextDeliveryFree : false,
    });
    setModal(null);
    setPendingExtras(null);
    setMarkNextDeliveryFree(false);
  }

  function handleWicket() {
    if (!canSubmitDelivery) return;
    setModal("wicket");
  }

  function handleWicketConfirm({ type, dismissed, fielder, runsTaken }) {
    setModal(null);
    const runs = type === "run_out" ? runsTaken : 0;
    const payload = {
      runs_bat:            runs,
      extras_type:         "none",
      extras_runs:         0,
      is_wicket:           true,
      wicket_type:         type,
      dismissed_player_id: dismissed,
      fielder_player_id:   fielder,
    };
    // Show wagon wheel for run-outs where batters actually ran (only if tracking enabled)
    if (runs > 0 && trackWagonWheel) {
      setWagonWheelPayload(payload);
    } else {
      submit(payload);
    }
  }

  function handleRetiredHurt() {
    if (!canSubmitDelivery) return;
    setModal("wicket_rh");
    // Treat as wicket with type retired_hurt
    submit({
      runs_bat:    0,
      extras_type: "none",
      extras_runs: 0,
      is_wicket:   true,
      wicket_type: "retired_hurt",
      dismissed_player_id: strikerId,
    });
  }

  function promptUndo() {
    setUndoTarget(overDeliveries[overDeliveries.length - 1] ?? null);
  }

  async function handleUndo() {
    if (!innings) return;
    setUndoing(true);
    try {
      await apiRequest(`/api/innings/${innings.id}/delivery/last`, { method: "DELETE", token });
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to undo.");
    } finally {
      setUndoing(false);
      setUndoTarget(null);
    }
  }

  async function handleCompleteInnings() {
    setCompleting(true);
    try {
      const res = await apiRequest(`/api/innings/${innings.id}/complete`, { method: "POST", token });
      setModal(null);
      await onStateRefresh();
      if (res?.result?.winner) {
        router.push(`/matches/${match.code}`);
      }
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to complete innings.");
    } finally {
      setCompleting(false);
    }
  }

  async function handlePauseSuperOver(payload) {
    setSuperOverModal(null);
    setSubmitting(true);
    try {
      await apiRequest(`/api/matches/${match.code}/super-over/interrupt`, {
        method: "POST",
        token,
        body: payload,
      });
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to pause super over.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolveSuperOver(payload) {
    setSuperOverModal(null);
    setSubmitting(true);
    try {
      const res = await apiRequest(`/api/matches/${match.code}/super-over/resolve`, {
        method: "POST",
        token,
        body: payload,
      });
      await onStateRefresh();
      if (res?.match?.status === "completed") {
        router.push(`/matches/${match.code}`);
      }
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to resolve super over.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (!canScore || submitting || undoing || completing) return;

      const target = event.target;
      const tagName = target?.tagName;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) return;

      const key = event.key.toLowerCase();

      if (["0", "1", "2", "3", "4", "6"].includes(key)) {
        event.preventDefault();
        actionRefs.current.handleRuns?.(Number(key));
        return;
      }

      if (key === "w" && event.shiftKey) {
        event.preventDefault();
        actionRefs.current.handleExtra?.("wide");
        return;
      }

      if (key === "w") {
        event.preventDefault();
        actionRefs.current.handleWicket?.();
        return;
      }

      if (key === "n") {
        event.preventDefault();
        actionRefs.current.handleExtra?.("no_ball");
        return;
      }

      if (key === "b") {
        event.preventDefault();
        actionRefs.current.handleExtra?.("bye");
        return;
      }

      if (key === "l") {
        event.preventDefault();
        actionRefs.current.handleExtra?.("leg_bye");
        return;
      }

      if (key === "u") {
        event.preventDefault();
        actionRefs.current.handleUndo?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canScore, submitting, undoing, completing]);

  useEffect(() => {
    actionRefs.current = {
      handleRuns,
      handleExtra,
      handleWicket,
      handleUndo: promptUndo,
    };
  });

  // Current over deliveries (non-undone)
  const overDeliveries = (current_over?.deliveries ?? [])
    .filter((d) => !d.is_undone)
    .sort((a, b) => a.raw_ball_number - b.raw_ball_number);

  // Batsmen stats from state.batsmen
  const strikerStat    = batsmen?.find((b) => b.match_player_id === strikerId);
  const nonStrikerStat = batsmen?.find((b) => b.match_player_id === nonStrikerId);

  // Innings 1 target for innings 2 display
  const innings1Runs = inningsRuns(scorecard?.innings?.find((i) => i.innings_number === 1));
  const target       = innings1Runs !== null ? innings1Runs + 1 : null;

  const extraModals = {
    wide_runs:    { label: "Wide - Extra Runs?" },
    no_ball_runs: { label: "No Ball - Extra Runs?" },
    bye_runs:     { label: "Byes - How Many?" },
    leg_bye_runs: { label: "Leg Byes - How Many?" },
  };

  const showExtraModal = modal && extraModals[modal];
  const strikerName = battingPlayers.find((p) => p.id === strikerId)?.display_name ?? "Not selected";
  const nonStrikerName = battingPlayers.find((p) => p.id === nonStrikerId)?.display_name ?? "Not selected";
  const bowlerName = bowlingPlayers.find((p) => p.id === bowlerId)?.display_name ?? "Not selected";
  const setupCards = [
    { label: singleWicketMode ? "Batter" : "Striker", value: strikerName, accent: "text-primary", chip: strikerId ? "Selected" : "Required" },
    { label: singleWicketMode ? "Same Batter" : "Non-striker", value: nonStrikerName, accent: "text-secondary", chip: nonStrikerId ? "Selected" : "Required" },
    { label: "Bowler", value: bowlerName, accent: "text-tertiary", chip: bowlerId ? "Selected" : "Required" },
  ];

  return (
    <>
      {/* Wagon Wheel Zone Picker */}
      {wagonWheelPayload && (
        <WagonWheelPicker
          runs={wagonWheelPayload.runs_bat}
          onConfirm={handleWagonWheelConfirm}
          onSkip={handleWagonWheelSkip}
        />
      )}

      {/* Wicket modal */}
      {modal === "wicket" && (
        <WicketModal
          batsmenPlayers={battingPlayers.filter((p) => p.id === strikerId || p.id === nonStrikerId)}
          fielders={bowlingPlayers}
          isFreeDelivery={Boolean(innings?.next_delivery_is_free)}
          singleWicketMode={singleWicketMode}
          onConfirm={handleWicketConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Extra runs modal */}
      {showExtraModal && (
        <ExtraRunsModal
          label={extraModals[modal].label}
          showFreeDeliveryToggle={modal === "no_ball_runs"}
          freeDeliveryChecked={markNextDeliveryFree}
          onToggleFreeDelivery={setMarkNextDeliveryFree}
          onConfirm={handleExtraConfirm}
          onCancel={() => { setModal(null); setPendingExtras(null); setMarkNextDeliveryFree(false); }}
        />
      )}

      {undoTarget && (
        <UndoConfirmModal
          delivery={undoTarget}
          busy={undoing}
          onConfirm={handleUndo}
          onCancel={() => setUndoTarget(null)}
        />
      )}

      {/* Complete innings modal */}
      {modal === "complete" && (
        <CompleteInningsModal
          inningsNum={innings?.innings_number ?? 1}
          isSuperOver={isSuperOver}
          target={target}
          onConfirm={handleCompleteInnings}
          onCancel={() => setModal(null)}
        />
      )}

      {superOverModal === "pause" && (
        <SuperOverPauseModal
          onConfirm={handlePauseSuperOver}
          onCancel={() => setSuperOverModal(null)}
        />
      )}

      {superOverModal === "resolve" && (
        <SuperOverResolveModal
          teams={superOverTeams}
          onConfirm={handleResolveSuperOver}
          onCancel={() => setSuperOverModal(null)}
        />
      )}


      {/* Scorecard hero */}
      <div className="cricket-gradient rounded-2xl p-5 md:p-6 text-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/70">
              {innings?.is_super_over ? "Super Over" : `${innings?.innings_number === 2 ? "2nd" : "1st"} Innings`}
              {innings?.batting_team_id && ` · ${match.match_teams?.find((mt) => mt.team_id === innings.batting_team_id)?.team?.name ?? ""}`}
            </p>
            <p className="font-display text-4xl md:text-5xl font-bold leading-none mt-1">
              {innings?.total_runs ?? 0}/{innings?.total_wickets ?? 0}
            </p>
            <p className="text-white/70 text-xs mt-1">
              {oversDisplay(innings?.total_overs ?? 0, innings?.total_balls ?? 0)} overs
              {" · "}RR {runRate(innings?.total_runs ?? 0, innings?.total_overs ?? 0, innings?.total_balls ?? 0)}
            </p>
          </div>
          {innings?.innings_number === 2 && target !== null && (
            <div className="text-right">
              <p className="text-xs text-white/70">Target</p>
              <p className="font-display text-3xl font-bold">{target}</p>
              <p className="text-xs text-white/60">
                Need {Math.max(0, target - (innings?.total_runs ?? 0))} off{" "}
                {Math.max(0, (match.overs_limit ?? 20) * 6 - (innings?.total_overs ?? 0) * 6 - (innings?.total_balls ?? 0))} balls
              </p>
            </div>
          )}
        </div>

        {/* Batsmen + bowler stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              role: "Striker *",
              name: battingPlayers.find((p) => p.id === strikerId)?.display_name ?? "-",
              stat: strikerStat ? `${strikerStat.runs} (${strikerStat.balls})` : "0 (0)",
            },
            {
              role: "Non-Striker",
              name: battingPlayers.find((p) => p.id === nonStrikerId)?.display_name ?? "-",
              stat: nonStrikerStat ? `${nonStrikerStat.runs} (${nonStrikerStat.balls})` : "0 (0)",
            },
            {
              role: "Bowler",
              name: bowlingPlayers.find((p) => p.id === bowlerId)?.display_name ?? "-",
              stat: bowler ? `${bowler.overs}.${bowler.balls}-${bowler.maidens}-${bowler.runs}-${bowler.wickets}` : "0-0-0-0",
            },
            {
              role: "Extras",
              name: `W:${innings?.extras_wides ?? 0} Nb:${innings?.extras_no_balls ?? 0}`,
              stat: `B:${innings?.extras_byes ?? 0} Lb:${innings?.extras_leg_byes ?? 0}`,
            },
          ].map(({ role, name, stat }) => (
            <div key={role} className="bg-white/15 rounded-xl py-2 px-3">
              <p className="text-[10px] text-white/70">{role}</p>
              <p className="text-xs font-semibold leading-tight">{name}</p>
              <p className="text-[10px] text-white/60 mt-0.5">{stat}</p>
            </div>
          ))}
        </div>

        {/* Current over ball row */}
        {current_over && <CurrentOverBallRow currentOver={current_over} />}
      </div>

      {isSuperOver && canScore && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-700">Super Over Controls</p>
              <p className="truncate text-xs font-semibold text-amber-800">
                Pause the super over or close it with a league rule decision.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white">
              Live phase
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSuperOverModal("pause")}
              className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              disabled={submitting}
            >
              Pause Super Over
            </button>
            <button
              onClick={() => setSuperOverModal("resolve")}
              className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              disabled={submitting}
            >
              Resolve Super Over
            </button>
          </div>
        </div>
      )}

      {/* Player selectors */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-base font-bold text-foreground">Select Players</h2>
          {!canScore && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container text-foreground-muted font-semibold">
              View Only
            </span>
          )}
          {canScore && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-secondary font-semibold">
              You have scorer control
            </span>
          )}
        </div>
        <div className="lg:sticky lg:top-24 z-10 rounded-2xl border border-outline-variant bg-surface-container/80 p-3 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-foreground-muted">Active Setup</p>
            <p className="text-[10px] text-foreground-muted">Always check this before scoring</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {setupCards.map((item) => (
              <div key={item.label} className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[10px] font-bold uppercase tracking-wide ${item.accent}`}>{item.label}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.chip === "Selected" ? "bg-green-100 text-secondary" : "bg-amber-100 text-amber-700"}`}>
                    {item.chip}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        {singleWicketMode && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
            Single wicket mode is active. The same batter is used for striker and non-striker.
          </div>
        )}
        {innings?.next_delivery_is_free && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-700">Free Delivery</p>
              <p className="truncate text-xs font-semibold text-amber-800">Next ball is free. Only run out can dismiss a batter.</p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white">
              Next ball
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PlayerSelector
            label={singleWicketMode ? "Batter" : "Striker *"}
            players={singleWicketMode ? battingPlayers : battingPlayers.filter((p) => p.id !== nonStrikerId && p.id !== bowlerId)}
            value={strikerId}
            onChange={setStrikerId}
            disabled={!canScore}
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <PlayerSelector
                label={singleWicketMode ? "Same Batter" : "Non-Striker"}
                players={singleWicketMode ? battingPlayers : battingPlayers.filter((p) => p.id !== strikerId && p.id !== bowlerId)}
                value={singleWicketMode ? strikerId : nonStrikerId}
                onChange={setNonStrikerId}
                disabled={!canScore || singleWicketMode}
              />
            </div>
            {canScore && !singleWicketMode && (
              <button
                onClick={() => { setStrikerId(nonStrikerId); setNonStrikerId(strikerId); }}
                title="Swap striker / non-striker"
                className="mb-0.5 h-[42px] w-[42px] shrink-0 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container flex items-center justify-center text-foreground-muted hover:text-primary transition-colors"
              >
                <Icon name="swap_horiz" className="text-lg" />
              </button>
            )}
          </div>
          <PlayerSelector
            label="Bowler"
            players={bowlingPlayers.filter((p) => p.id !== strikerId && p.id !== (singleWicketMode ? strikerId : nonStrikerId))}
            value={bowlerId}
            onChange={setBowlerId}
            disabled={!canScore}
          />
        </div>
      </div>

      {/* Delivery entry */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-base font-bold text-foreground">Enter Delivery</h2>
            {/* Wagon Wheel tracking toggle */}
            <button
              onClick={toggleWagonWheel}
              title={trackWagonWheel ? "Wagon wheel tracking ON — tap to disable" : "Wagon wheel tracking OFF — tap to enable"}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors ${
                trackWagonWheel
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "border-outline-variant bg-surface-container text-foreground-muted"
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: trackWagonWheel ? "#4f46e5" : "#9ca3af" }}
              />
              Wagon Wheel {trackWagonWheel ? "ON" : "OFF"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-foreground-muted">
            <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1">0/1/2/3/4/6</span>
            <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1">W wicket</span>
            <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1">Shift+W wide</span>
            <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1">N no-ball</span>
            <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1">B bye</span>
            <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1">L leg-bye</span>
            <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1">U undo</span>
          </div>
        </div>

        {/* Runs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
          {[0, 1, 2, 3, 4, 6].map((r) => (
            <button
              key={r}
              onClick={() => handleRuns(r)}
              disabled={!canScore || submitting}
              className={`score-btn text-2xl disabled:opacity-40 disabled:cursor-not-allowed
                ${r === 4 ? "bg-primary! text-white! border-primary! hover:bg-primary-container!" : ""}
                ${r === 6 ? "bg-indigo-900! text-white! border-indigo-900! hover:bg-indigo-800!" : ""}
              `}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Extras + Wicket */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
          <button
            onClick={() => handleExtra("wide")}
            disabled={!canScore || submitting}
            className="score-btn text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >Wide</button>
          <button
            onClick={() => handleExtra("no_ball")}
            disabled={!canScore || submitting}
            className="score-btn text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >No Ball</button>
          <button
            onClick={() => handleExtra("bye")}
            disabled={!canScore || submitting}
            className="score-btn text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >Bye</button>
          <button
            onClick={() => handleExtra("leg_bye")}
            disabled={!canScore || submitting}
            className="score-btn text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >Leg Bye</button>
          <button
            onClick={handleWicket}
            disabled={!canScore || submitting}
            className="score-btn text-sm text-tertiary! border-tertiary! bg-red-50! hover:bg-red-100! disabled:opacity-40 disabled:cursor-not-allowed"
          >Wicket</button>
          <button
            onClick={handleRetiredHurt}
            disabled={!canScore || submitting}
            className="score-btn text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >Retired Hurt</button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={promptUndo}
            disabled={undoing || (!isActiveScorer)}
            className="rounded-xl bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {undoing ? "Undoing..." : "Undo Last Ball"}
          </button>
          {canScore && (
            <button
              onClick={() => setModal("complete")}
              disabled={completing}
              className="rounded-xl bg-tertiary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Complete Innings
            </button>
          )}
          {submitting && (
            <span className="inline-flex items-center gap-2 text-sm text-foreground-muted">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Recording...
            </span>
          )}
        </div>
      </div>

      {/* Recent overs scroller */}
      <ScoringRecentOvers state={state} scorecard={scorecard} />
    </>
  );
}

// â"€â"€â"€ This Over Panel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function ThisOverPanel({ currentOver, innings, onProposeCorrection }) {
  const deliveries = (currentOver?.deliveries ?? [])
    .filter((d) => !d.is_undone)
    .sort((a, b) => a.raw_ball_number - b.raw_ball_number);

  const legalCount = deliveries.filter((d) => d.is_legal_ball).length;
  const overNum    = currentOver?.over_number ?? ((innings?.total_overs ?? 0) + 1);

  // Placeholders for remaining balls
  const slots = [...deliveries];
  while (slots.length < 6) slots.push(null);

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base font-bold text-foreground">This Over</h3>
        <span className="text-xs text-foreground-muted">
          Over {overNum} · {legalCount}/6 balls
        </span>
      </div>

      <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        Tap any ball below to propose a correction. Use undo only for the most recent delivery.
      </div>

      {/* Ball chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {slots.map((d, i) => (
          <div
            key={i}
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-sm font-black shadow-sm transition-transform hover:scale-110 ${ballChipStyle(d)}`}
          >
            {ballLabel(d)}
          </div>
        ))}
      </div>

      {/* Over runs */}
      {currentOver && (
        <div className="flex gap-4 text-xs text-foreground-muted mb-3">
          <span>Runs: <strong className="text-foreground">{currentOver.runs ?? 0}</strong></span>
          <span>Wickets: <strong className="text-foreground">{currentOver.wickets ?? 0}</strong></span>
          {(currentOver.wides ?? 0) > 0 && <span>Wd: <strong className="text-foreground">{currentOver.wides}</strong></span>}
          {(currentOver.no_balls ?? 0) > 0 && <span>Nb: <strong className="text-foreground">{currentOver.no_balls}</strong></span>}
        </div>
      )}

      {/* Commentary - click any delivery to propose a correction */}
      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {deliveries.length === 0 && (
          <p className="text-xs text-foreground-muted italic">No deliveries yet this over.</p>
        )}
        {[...deliveries].reverse().map((d) => (
          <div
            key={d.id}
            className={`rounded-xl px-3 py-2 text-xs leading-snug flex items-center justify-between gap-2 ${
              d.is_wicket
                ? "bg-red-50 border border-red-200 text-tertiary font-semibold"
                : d.runs_bat >= 4
                ? "bg-primary/5 border border-primary/20"
                : "bg-surface-container-low"
            }`}
          >
            <span>{d.commentary ?? `${overNum}.${d.ball_number} - ${d.runs_bat} run${d.runs_bat !== 1 ? "s" : ""}`}</span>
            {onProposeCorrection && (
              <button
                onClick={() => onProposeCorrection({ ...d, over: overNum })}
                title="Propose correction"
                className="shrink-0 text-foreground-muted hover:text-amber-600 transition-colors"
              >
                <Icon name="edit" className="text-sm" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// â"€â"€â"€ Manhattan Chart â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function ManhattanChart({ scorecard, currentOver, innings }) {
  const oversLimit = scorecard?.innings?.[0]
    ? (scorecard.match?.overs_limit ?? 20)
    : 20;

  // Current innings from scorecard overs_log
  const innNum = innings?.innings_number;
  const inn    = scorecard?.innings?.find((i) => i.innings_number === innNum);
  const log    = inn?.overs_log ?? [];

  // Completed overs bars
  const completed = log.filter((o) => o.is_completed);
  // Live over partial bar (current over deliveries)
  const liveBalls = (currentOver?.deliveries ?? []).filter((d) => !d.is_undone);
  const liveRuns  = liveBalls.reduce((s, d) => s + (d.runs_bat ?? 0) + (d.extras_runs ?? 0), 0);
  const liveOverNum = currentOver?.over_number;

  if (completed.length === 0 && !liveOverNum) return null;

  const maxRuns = Math.max(...completed.map((o) => o.runs ?? 0), liveRuns, 8);

  // SVG dims
  const BAR_W = 14, GAP = 3, PAD_L = 24, PAD_B = 18, PAD_T = 8, CHART_H = 90;
  const totalBars = oversLimit;
  const svgW = PAD_L + totalBars * (BAR_W + GAP) + 8;
  const svgH = CHART_H + PAD_T + PAD_B;

  function barH(runs) { return Math.max(2, (runs / maxRuns) * CHART_H); }
  function barX(n)    { return PAD_L + (n - 1) * (BAR_W + GAP); }
  function barY(runs) { return PAD_T + CHART_H - barH(runs); }

  function barColor(runs, wkts) {
    if (wkts >= 3) return "#ef4444";
    if (runs >= 15) return "#6366f1";
    if (runs >= 10) return "#3b82f6";
    return "#60a5fa";
  }

  // Y-axis labels
  const ySteps = [0, Math.round(maxRuns / 2), maxRuns];

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-sm font-bold text-foreground">Manhattan</h3>
        <span className="text-[10px] text-foreground-muted">Runs per over</span>
      </div>
      <div className="overflow-x-auto">
        <svg width={svgW} height={svgH} style={{ minWidth: 200 }}>
          {/* Y gridlines */}
          {ySteps.map((v) => {
            const y = PAD_T + CHART_H - barH(v);
            return (
              <g key={v}>
                <line x1={PAD_L - 2} y1={y} x2={svgW - 4} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,2" />
                <text x={PAD_L - 4} y={y + 3.5} textAnchor="end" fontSize="7" fill="#9ca3af">{v}</text>
              </g>
            );
          })}

          {/* Completed over bars */}
          {completed.map((ov) => {
            const x = barX(ov.over_number);
            const h = barH(ov.runs ?? 0);
            const y = barY(ov.runs ?? 0);
            const color = barColor(ov.runs ?? 0, ov.wickets ?? 0);
            return (
              <g key={ov.over_number}>
                <rect x={x} y={y} width={BAR_W} height={h} rx="2" fill={color} />
                {(ov.wickets ?? 0) > 0 && (
                  <text x={x + BAR_W / 2} y={y - 2} textAnchor="middle" fontSize="7" fill="#ef4444" fontWeight="bold">
                    {Array(ov.wickets).fill("W").join("")}
                  </text>
                )}
              </g>
            );
          })}

          {/* Live over bar (semi-transparent, pulsing via opacity) */}
          {liveOverNum && liveRuns > 0 && (
            <rect
              x={barX(liveOverNum)} y={barY(liveRuns)}
              width={BAR_W} height={barH(liveRuns)}
              rx="2" fill="#3b82f6" opacity="0.5"
            />
          )}

          {/* X-axis labels every 5 overs */}
          {Array.from({ length: Math.floor(oversLimit / 5) + 1 }, (_, i) => i * 5).filter((n) => n > 0).map((n) => (
            <text key={n} x={barX(n) + BAR_W / 2} y={svgH - 4} textAnchor="middle" fontSize="7" fill="#9ca3af">
              {n}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// â"€â"€â"€ Partnership Tracker â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function PartnershipTracker({ batsmen, innings }) {
  const striker    = batsmen?.find((b) => b.is_striker) ?? batsmen?.[0];
  const nonStriker = batsmen?.find((b) => !b.is_striker) ?? batsmen?.[1];

  if (!striker && !nonStriker) return null;

  // Partnership runs = sum of both batsmen's runs that weren't there at last wicket.
  // We can't perfectly reconstruct this without delivery-level tracking,
  // but we can approximate: min of both current balls is the partnership start proxy.
  // Better: use innings.total_runs and subtract the score at last fall of wicket.
  // For now derive from both batsmen's current run tallies combined.
  const partRuns  = (striker?.runs ?? 0) + (nonStriker?.runs ?? 0);
  const partBalls = Math.max((striker?.balls ?? 0), (nonStriker?.balls ?? 0));

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-bold text-foreground">Partnership</h3>
        <span className="text-lg font-black text-primary tabular-nums">
          {partRuns}
          <span className="text-xs font-normal text-foreground-muted ml-1">({partBalls}b)</span>
        </span>
      </div>
      <div className="space-y-2">
        {[striker, nonStriker].filter(Boolean).map((b, i) => {
          const pct = partRuns > 0 ? Math.round((b.runs / partRuns) * 100) : 0;
          const isStriking = b.is_striker;
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  {isStriking && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  <span className={`font-semibold truncate max-w-[120px] ${isStriking ? "text-foreground" : "text-foreground-muted"}`}>
                    {b.player?.display_name ?? "-"}
                  </span>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  {b.runs}<span className="text-foreground-muted font-normal text-[10px] ml-0.5">({b.balls}b)</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container-low overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isStriking ? "bg-primary" : "bg-outline"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// â"€â"€â"€ RRR Panel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function RRRPanel({ state, scorecard }) {
  const innings = state?.innings;
  if (!innings || innings.innings_number !== 2) return null;

  const inn1 = scorecard?.innings?.find((i) => i.innings_number === 1);
  if (!inn1) return null;

  const target     = parseInt(inn1.total?.split("/")[0] ?? 0) + 1;
  const runsScored = innings.total_runs ?? 0;
  const runsNeeded = Math.max(0, target - runsScored);
  const oversLimit = scorecard?.match?.overs_limit ?? state?.match?.overs_limit ?? 20;
  const ballsDone  = (innings.total_overs ?? 0) * 6 + (innings.total_balls ?? 0);
  const ballsLeft  = Math.max(0, oversLimit * 6 - ballsDone);
  const oversLeft  = Math.floor(ballsLeft / 6);
  const ballsRem   = ballsLeft % 6;
  const rrr        = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "-";
  const crr        = ballsDone > 0 ? ((runsScored / ballsDone) * 6).toFixed(2) : "0.00";

  const rrrNum   = parseFloat(rrr);
  const crrNum   = parseFloat(crr);
  const pressure = !isNaN(rrrNum) && rrrNum > crrNum + 2;

  return (
    <div className={`rounded-2xl border p-4 ${pressure ? "border-red-200 bg-red-50/60" : "border-outline-variant bg-surface"}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-display text-sm font-bold ${pressure ? "text-red-700" : "text-foreground"}`}>
          Chase
        </h3>
        <span className="text-xs text-foreground-muted">
          Target <span className="font-bold text-foreground">{target}</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-foreground-muted uppercase font-semibold tracking-wide mb-0.5">Need</p>
          <p className="text-xl font-black tabular-nums text-foreground">{runsNeeded}</p>
          <p className="text-[10px] text-foreground-muted">runs</p>
        </div>
        <div>
          <p className="text-[10px] text-foreground-muted uppercase font-semibold tracking-wide mb-0.5">From</p>
          <p className="text-xl font-black tabular-nums text-foreground">{oversLeft}.{ballsRem}</p>
          <p className="text-[10px] text-foreground-muted">overs</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wide mb-0.5 text-foreground-muted">RRR</p>
          <p className={`text-xl font-black tabular-nums ${pressure ? "text-red-600" : "text-primary"}`}>{rrr}</p>
          <p className="text-[10px] text-foreground-muted">CRR {crr}</p>
        </div>
      </div>
    </div>
  );
}

// â"€â"€â"€ Scorebook Panel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function ballBookStyle(ball) {
  if (!ball) return { cls: "border border-dashed border-outline-variant text-foreground-muted/40", label: "" };
  if (ball.is_wicket)              return { cls: "bg-tertiary text-white font-black", label: ball.runs_bat > 0 ? `${ball.runs_bat}W` : "W" };
  if (ball.runs_bat === 6)         return { cls: "bg-indigo-900 text-white font-black", label: "6" };
  if (ball.runs_bat === 4)         return { cls: "bg-primary text-white font-black", label: "4" };
  if (ball.extras_type === "wide") return { cls: "bg-amber-100 text-amber-700 border border-amber-300 font-bold", label: "Wd" };
  if (ball.extras_type === "no_ball") return { cls: "bg-orange-100 text-orange-700 border border-orange-300 font-bold", label: "Nb" };
  if (ball.extras_type === "bye")     return { cls: "bg-surface-container border border-outline-variant text-foreground-muted font-semibold", label: `B${ball.extras_runs || ""}` };
  if (ball.extras_type === "leg_bye") return { cls: "bg-surface-container border border-outline-variant text-foreground-muted font-semibold", label: `Lb${ball.extras_runs || ""}` };
  if (ball.runs_bat === 0)         return { cls: "border border-outline-variant text-foreground-muted", label: "·" };
  return { cls: "border border-outline-variant text-foreground font-semibold", label: String(ball.runs_bat) };
}

// Grid columns: 40px | 110px | 1fr | 36px | 32px | 68px
// The "1fr" balls column absorbs all available space; right columns are fixed and never shift.
const SB_GRID = "grid-cols-[40px_110px_1fr_36px_32px_68px]";
const SB_HEAD_BG = "bg-[var(--color-surface-container-low,#f5f5f5)]";

function SbRow({ children, className = "" }) {
  return (
    <div className={`grid ${SB_GRID} items-center border-b border-outline-variant text-xs ${className}`}>
      {children}
    </div>
  );
}

function ScorebookInnings({ inn, oversLimit }) {
  const totalRows = oversLimit ?? 20;
  const rows = Array.from({ length: totalRows }, (_, i) => {
    const overNum = i + 1;
    return inn?.overs_log?.find((o) => o.over_number === overNum) ?? null;
  });

  let runningRuns = 0;
  let runningWkts = 0;

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
      {/* Summary header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <div>
          <p className="font-display font-bold text-foreground text-sm">
            {inn?.batting_team ?? "-"} batting
          </p>
          <p className="text-xs text-foreground-muted mt-0.5">
            {inn?.total ?? "0/0"} · {inn?.overs ?? "0.0"} overs
          </p>
        </div>
        <div className="text-right text-xs text-foreground-muted">
          Extras: <strong className="text-foreground">{inn?.extras?.total ?? 0}</strong>
          <span className="ml-1">
            (W:{inn?.extras?.wides ?? 0} Nb:{inn?.extras?.no_balls ?? 0} B:{inn?.extras?.byes ?? 0} Lb:{inn?.extras?.leg_byes ?? 0})
          </span>
        </div>
      </div>

      {/* Scrollable grid body */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 400 }}>

          {/* Header row */}
          <SbRow className={`${SB_HEAD_BG} border-b-2 border-outline-variant sticky top-0 z-10`}>
            <div className="px-2 py-2 text-center font-bold text-outline uppercase tracking-wide">Ov</div>
            <div className="px-3 py-2 text-left font-bold text-outline uppercase tracking-wide">Bowler</div>
            <div className="px-2 py-2 text-center font-bold text-outline uppercase tracking-wide">Balls</div>
            <div className="px-1 py-2 text-right font-bold text-outline uppercase tracking-wide">R</div>
            <div className="px-1 py-2 text-right font-bold text-outline uppercase tracking-wide">W</div>
            <div className="px-2 py-2 text-right font-bold text-outline uppercase tracking-wide">Total</div>
          </SbRow>

          {/* Data rows */}
          {rows.map((over, idx) => {
            const overNum = idx + 1;
            const isLive  = over && !over.is_completed;

            if (over?.is_completed) {
              runningRuns += over.runs ?? 0;
              runningWkts += over.wickets ?? 0;
            }

            const balls = over?.balls ?? [];
            const slots = [...balls];
            while (slots.length < 6) slots.push(null);

            const rowCls = isLive
              ? "bg-primary/5"
              : over
              ? "hover:bg-surface-container-low/40"
              : "opacity-30";

            return (
              <SbRow key={overNum} className={rowCls}>
                {/* Over number */}
                <div className="px-2 py-2 flex justify-center">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black
                    ${isLive ? "bg-primary text-white" : over ? "bg-surface-container text-foreground" : "bg-surface-container-low text-foreground-muted/40"}`}>
                    {overNum}
                  </span>
                </div>

                {/* Bowler */}
                <div className="px-3 py-2 font-medium text-foreground truncate">
                  {over?.bowler ?? <span className="text-foreground-muted/30">-</span>}
                </div>

                {/* Balls â€" flex-wrap inside the 1fr cell; extras just add more chips, never push columns */}
                <div className="px-2 py-1.5 flex flex-wrap gap-1 min-w-0">
                  {slots.map((ball, bi) => {
                    const { cls, label } = ballBookStyle(ball);
                    return (
                      <span
                        key={bi}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] leading-none flex-shrink-0 ${cls}`}
                      >
                        {label || <span className="opacity-20">·</span>}
                      </span>
                    );
                  })}
                </div>

                {/* Runs */}
                <div className="px-1 py-2 text-right font-bold text-foreground">
                  {over ? over.runs : <span className="text-foreground-muted/20">-</span>}
                </div>

                {/* Wickets */}
                <div className={`px-1 py-2 text-right font-bold ${over?.wickets > 0 ? "text-tertiary" : "text-foreground-muted"}`}>
                  {over ? over.wickets : <span className="text-foreground-muted/20">-</span>}
                </div>

                {/* Running total */}
                <div className="px-2 py-2 text-right font-display font-bold">
                  {over?.is_completed
                    ? <span className="text-foreground">{runningRuns}/{runningWkts}</span>
                    : isLive
                    ? <span className="text-primary text-[10px] font-semibold">live</span>
                    : <span className="text-foreground-muted/20">-</span>
                  }
                </div>
              </SbRow>
            );
          })}

          {/* Footer totals row */}
          {inn && (
            <SbRow className="border-t-2 border-outline-variant bg-surface-container font-bold">
              <div />
              <div className="px-3 py-2.5 uppercase text-foreground text-[10px] tracking-wide">Total</div>
              <div className="px-2 py-2.5 text-xs text-foreground-muted">
                W:{inn.extras?.wides ?? 0} Nb:{inn.extras?.no_balls ?? 0} B:{inn.extras?.byes ?? 0} Lb:{inn.extras?.leg_byes ?? 0} = {inn.extras?.total ?? 0}
              </div>
              <div className="col-span-3 px-2 py-2.5 text-right font-display font-bold text-foreground">
                {inn.total}
              </div>
            </SbRow>
          )}

        </div>
      </div>
    </div>
  );
}

function ScorebookPanel({ scorecard, oversLimit }) {
  const [tab, setTab] = useState("inn1");
  const inn1 = scorecard?.innings?.find((i) => i.innings_number === 1);
  const inn2 = scorecard?.innings?.find((i) => i.innings_number === 2);
  const target = inn1 ? inningsRuns(inn1) + 1 : null;

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("inn1")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
            tab === "inn1" ? "cricket-gradient text-white shadow-md" : "border border-outline-variant text-foreground-muted hover:bg-surface-container"
          }`}
        >
          1st Innings {inn1 ? `· ${inn1.batting_team}` : ""}
        </button>
        {inn2 && (
          <button
            onClick={() => setTab("inn2")}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === "inn2" ? "cricket-gradient text-white shadow-md" : "border border-outline-variant text-foreground-muted hover:bg-surface-container"
            }`}
          >
            2nd Innings · {inn2.batting_team}
          </button>
        )}
      </div>

      {tab === "inn1" && <ScorebookInnings inn={inn1} oversLimit={oversLimit} />}
      {tab === "inn2" && <ScorebookInnings inn={inn2} oversLimit={oversLimit} />}

      {!inn1 && (
        <div className="rounded-2xl border-2 border-dashed border-outline-variant bg-surface p-10 text-center">
          <Icon name="book" className="text-4xl text-outline mb-2 block" />
          <p className="text-sm text-foreground-muted">Scorebook will appear here once the match starts.</p>
        </div>
      )}
      {inn2 && target !== null && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold">Target for 2nd innings:</span> {target}
        </div>
      )}
    </div>
  );
}

// â"€â"€â"€ Correct Delivery Modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const WICKET_TYPES = ["bowled","caught","lbw","run_out","stumped","hit_wicket","retired_hurt","obstructing_field"];
const EXTRAS_TYPES = ["none","wide","no_ball","bye","leg_bye"];

function CorrectDeliveryModal({ delivery, matchCode, innings, allPlayers, token, onDone, onCancel }) {
  const battingPlayers  = allPlayers.filter((p) => p.team_id === innings?.batting_team_id  && !p.is_substitute);
  const bowlingPlayers  = allPlayers.filter((p) => p.team_id === innings?.bowling_team_id  && !p.is_substitute);

  const [runsBat,       setRunsBat]       = useState(delivery.runs_bat ?? 0);
  const [extrasType,    setExtrasType]    = useState(delivery.extras_type ?? "none");
  const [extrasRuns,    setExtrasRuns]    = useState(delivery.extras_runs ?? 0);
  const [isWicket,      setIsWicket]      = useState(delivery.is_wicket ?? false);
  const [wicketType,    setWicketType]    = useState(delivery.wicket_type ?? "bowled");
  const [dismissedId,   setDismissedId]   = useState(delivery.dismissed_player_id ?? null);
  const [fielderId,     setFielderId]     = useState(delivery.fielder_player_id ?? null);
  const [submitting,    setSubmitting]    = useState(false);

  const needsFielder = isWicket && ["caught","run_out","stumped","obstructing_field"].includes(wicketType);

  async function submit() {
    setSubmitting(true);
    try {
      await apiRequest(`/api/matches/${matchCode}/corrections`, {
        method: "POST",
        token,
        body: {
          delivery_id:              delivery.id,
          new_runs_bat:             runsBat,
          new_extras_type:          extrasType,
          new_extras_runs:          extrasRuns,
          new_is_wicket:            isWicket,
          new_wicket_type:          isWicket ? wicketType : null,
          new_dismissed_player_id:  isWicket ? dismissedId : null,
          new_fielder_player_id:    isWicket && needsFielder ? fielderId : null,
        },
      });
      onDone();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to propose correction.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Propose Correction</h3>
          <p className="text-xs text-foreground-muted mt-0.5">
            Original: <span className="font-semibold text-foreground">{delivery.commentary ?? `Over ${delivery.over}.${delivery.ball}`}</span>
          </p>
          <p className="text-[10px] text-amber-600 mt-1 font-semibold">Both team captains must approve before it applies.</p>
        </div>

        {/* Runs off bat */}
        <div>
          <p className="text-xs font-semibold text-foreground-muted mb-2">Runs off bat</p>
          <div className="flex gap-2 flex-wrap">
            {[0,1,2,3,4,6].map((r) => (
              <button
                key={r}
                onClick={() => setRunsBat(r)}
                className={`h-10 w-10 rounded-full font-bold text-sm border transition-all
                  ${runsBat === r ? "cricket-gradient text-white border-transparent shadow-md" : "border-outline-variant bg-surface hover:bg-surface-container"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Extras */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground-muted">Extras type</label>
          <select
            value={extrasType}
            onChange={(e) => setExtrasType(e.target.value)}
            className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary"
          >
            {EXTRAS_TYPES.map((t) => <option key={t} value={t}>{t === "none" ? "None" : t.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
          </select>
        </div>

        {extrasType !== "none" && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-foreground-muted w-24">Extra runs</label>
            <button onClick={() => setExtrasRuns((r) => Math.max(0, r-1))} className="h-8 w-8 rounded-lg border border-outline-variant font-bold hover:bg-surface-container">âˆ’</button>
            <span className="w-8 text-center font-bold text-foreground">{extrasRuns}</span>
            <button onClick={() => setExtrasRuns((r) => Math.min(20, r+1))} className="h-8 w-8 rounded-lg border border-outline-variant font-bold hover:bg-surface-container">+</button>
          </div>
        )}

        {/* Wicket */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="cw-wicket" checked={isWicket} onChange={(e) => setIsWicket(e.target.checked)}
            className="h-4 w-4 accent-red-600" />
          <label htmlFor="cw-wicket" className="text-sm font-semibold text-tertiary cursor-pointer">Wicket fell on this delivery</label>
        </div>

        {isWicket && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground-muted">Wicket type</label>
              <select value={wicketType} onChange={(e) => setWicketType(e.target.value)}
                className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary">
                {WICKET_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground-muted">Dismissed player</label>
              <select value={dismissedId ?? ""} onChange={(e) => setDismissedId(e.target.value ? Number(e.target.value) : null)}
                className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary">
                <option value="">- Select -</option>
                {battingPlayers.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
              </select>
            </div>
            {needsFielder && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground-muted">Fielder</label>
                <select value={fielderId ?? ""} onChange={(e) => setFielderId(e.target.value ? Number(e.target.value) : null)}
                  className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary">
                  <option value="">- None -</option>
                  {bowlingPlayers.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                </select>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-semibold hover:bg-surface-container">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting}
            className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
            {submitting ? "Sending..." : "Propose Correction"}
          </button>
        </div>
      </div>
    </div>
  );
}

// â"€â"€â"€ Pending Corrections Panel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function PendingCorrectionsPanel({ corrections, token, matchCode, onRefresh }) {
  const [busy,        setBusy]        = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote,  setRejectNote]  = useState("");

  if (!corrections?.length) return null;

  async function approve(id) {
    setBusy(id);
    try {
      const res = await apiRequest(`/api/matches/${matchCode}/corrections/${id}/approve`, { method: "POST", token });
      toast.success(res.message ?? "Correction approved.");
      onRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to approve.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmReject(id) {
    setBusy(id);
    try {
      await apiRequest(`/api/matches/${matchCode}/corrections/${id}/reject`, {
        method: "POST", token, body: { note: rejectNote || null },
      });
      toast.success("Correction rejected.");
      setRejectingId(null);
      setRejectNote("");
      onRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to reject.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 overflow-hidden">
      <div className="px-4 py-3 bg-amber-100 border-b border-amber-200 flex items-center gap-2">
        <Icon name="edit_note" className="text-base text-amber-700" />
        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
          Pending Corrections ({corrections.length})
        </span>
      </div>
      <div className="divide-y divide-amber-200">
        {corrections.map((c) => (
          <div key={c.id} className="px-4 py-3 space-y-2">
            {/* Original */}
            <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wide">Original</p>
            <p className="text-xs text-foreground font-mono bg-white rounded-lg px-2 py-1 border border-amber-200">
              {c.delivery?.commentary ?? `Over ${c.delivery?.over}.${c.delivery?.ball} - ${c.delivery?.runs_bat}R`}
            </p>

            {/* Proposed change */}
            <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wide">Proposed</p>
            <p className="text-xs text-foreground bg-white rounded-lg px-2 py-1 border border-amber-200">
              {c.new_runs_bat}R bat
              {c.new_extras_type !== "none" && ` · ${c.new_extras_type} +${c.new_extras_runs}`}
              {c.new_is_wicket && ` · WICKET (${c.new_wicket_type?.replace(/_/g," ")})`}
            </p>

            <p className="text-[10px] text-foreground-muted">Proposed by <span className="font-semibold">{c.proposed_by}</span></p>

            {/* Approval status */}
            <div className="flex gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold
                ${c.team1_approved ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                {c.team1_approved ? "✓" : "○"} Team 1
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold
                ${c.team2_approved ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                {c.team2_approved ? "✓" : "○"} Team 2
              </span>
            </div>

            {/* Action buttons - only for captains */}
            {c.can_approve && (
              <button
                onClick={() => approve(c.id)}
                disabled={busy === c.id}
                className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy === c.id ? "Approving..." : "Approve Correction"}
              </button>
            )}
            {c.can_reject && rejectingId !== c.id && (
              <button
                onClick={() => { setRejectingId(c.id); setRejectNote(""); }}
                disabled={busy === c.id}
                className="w-full rounded-xl border border-red-300 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            )}
            {c.can_reject && rejectingId === c.id && (
              <div className="space-y-2">
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Reason (optional)..."
                  rows={2}
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs resize-none focus:outline-none focus:border-red-400"
                />
                <div className="flex gap-2">
                  <button onClick={() => setRejectingId(null)}
                    className="flex-1 rounded-xl border border-outline-variant py-2 text-xs font-semibold hover:bg-surface-container">
                    Cancel
                  </button>
                  <button onClick={() => confirmReject(c.id)} disabled={busy === c.id}
                    className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
                    {busy === c.id ? "Rejecting..." : "Confirm Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Charts Tab ───────────────────────────────────────────────────────────────

function InningsManhattan({ inn, currentOver, liveState, oversLimit }) {
  const log       = inn?.overs_log ?? [];
  const innNum    = inn?.innings_number;
  const isLiveInn = liveState?.innings?.innings_number === innNum;
  const completed = log.filter((o) => o.is_completed);
  const liveBalls = isLiveInn ? (currentOver?.deliveries ?? []).filter((d) => !d.is_undone) : [];
  const liveRuns  = liveBalls.reduce((s, d) => s + (d.runs_bat ?? 0) + (d.extras_runs ?? 0), 0);
  const liveOverNum = isLiveInn ? currentOver?.over_number : null;
  const limit     = inn?.is_super_over ? 1 : (oversLimit ?? 20);

  if (completed.length === 0 && !liveOverNum) {
    return <p className="text-sm text-foreground-muted text-center py-8">No overs bowled yet.</p>;
  }

  const maxRuns = Math.max(...completed.map((o) => o.runs ?? 0), liveRuns, 8);
  const BAR_W = 14, GAP = 3, PAD_L = 24, PAD_B = 18, PAD_T = 8, CHART_H = 90;
  const svgW = PAD_L + limit * (BAR_W + GAP) + 8;
  const svgH = CHART_H + PAD_T + PAD_B;
  const barH = (r) => Math.max(2, (r / maxRuns) * CHART_H);
  const barX = (n) => PAD_L + (n - 1) * (BAR_W + GAP);
  const barY = (r) => PAD_T + CHART_H - barH(r);
  const barColor = (r, w) => w >= 3 ? "#ef4444" : r >= 15 ? "#6366f1" : r >= 10 ? "#3b82f6" : "#60a5fa";
  const ySteps = [0, Math.round(maxRuns / 2), maxRuns];

  return (
    <div className="overflow-x-auto">
      <svg width={svgW} height={svgH} style={{ minWidth: 200 }}>
        {ySteps.map((v) => {
          const y = PAD_T + CHART_H - barH(v);
          return (
            <g key={v}>
              <line x1={PAD_L - 2} y1={y} x2={svgW - 4} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,2" />
              <text x={PAD_L - 4} y={y + 3.5} textAnchor="end" fontSize="7" fill="#9ca3af">{v}</text>
            </g>
          );
        })}
        {completed.map((ov) => (
          <g key={ov.over_number}>
            <rect x={barX(ov.over_number)} y={barY(ov.runs ?? 0)} width={BAR_W} height={barH(ov.runs ?? 0)} rx="2" fill={barColor(ov.runs ?? 0, ov.wickets ?? 0)} />
            {(ov.wickets ?? 0) > 0 && (
              <text x={barX(ov.over_number) + BAR_W / 2} y={barY(ov.runs ?? 0) - 2} textAnchor="middle" fontSize="7" fill="#ef4444" fontWeight="bold">
                {Array(ov.wickets).fill("W").join("")}
              </text>
            )}
          </g>
        ))}
        {liveOverNum && liveRuns > 0 && (
          <rect x={barX(liveOverNum)} y={barY(liveRuns)} width={BAR_W} height={barH(liveRuns)} rx="2" fill="#3b82f6" opacity="0.5" />
        )}
        {Array.from({ length: Math.floor(limit / 5) + 1 }, (_, i) => i * 5).filter((n) => n > 0).map((n) => (
          <text key={n} x={barX(n) + BAR_W / 2} y={svgH - 4} textAnchor="middle" fontSize="7" fill="#9ca3af">{n}</text>
        ))}
      </svg>
    </div>
  );
}

function InningsWorm({ inn, currentOver, liveState, oversLimit }) {
  const log       = inn?.overs_log ?? [];
  const innNum    = inn?.innings_number;
  const isLiveInn = liveState?.innings?.innings_number === innNum;
  const limit     = inn?.is_super_over ? 1 : (oversLimit ?? 20);
  const points    = [{ over: 0, runs: 0 }];
  let cumRuns = 0;
  log.filter((o) => o.is_completed).forEach((o) => {
    cumRuns += o.runs ?? 0;
    points.push({ over: o.over_number, runs: cumRuns });
  });
  if (isLiveInn && currentOver) {
    const liveBalls = (currentOver.deliveries ?? []).filter((d) => !d.is_undone);
    const liveRuns  = liveBalls.reduce((s, d) => s + (d.runs_bat ?? 0) + (d.extras_runs ?? 0), 0);
    const overFrac  = currentOver.over_number - 1 + liveBalls.filter((d) => d.is_legal_ball).length / 6;
    if (liveRuns > 0) points.push({ over: overFrac, runs: cumRuns + liveRuns });
  }

  if (points.length < 2) {
    return <p className="text-sm text-foreground-muted text-center py-8">No overs bowled yet.</p>;
  }

  const W = 300, H = 130, PL = 30, PR = 10, PT = 10, PB = 22;
  const gW = W - PL - PR, gH = H - PT - PB;
  const maxRuns = Math.max(...points.map((p) => p.runs), 20);
  const toX = (o) => PL + (o / limit) * gW;
  const toY = (r) => PT + gH - (r / maxRuns) * gH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.over).toFixed(1)},${toY(p.runs).toFixed(1)}`).join(" ");
  const yTicks = [0, Math.round(maxRuns * 0.5), maxRuns];
  const xTicks = Array.from({ length: Math.floor(limit / 5) + 1 }, (_, i) => i * 5);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 240 }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PL} y1={toY(t)} x2={W - PR} y2={toY(t)} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PL - 4} y={toY(t) + 3.5} textAnchor="end" fontSize="8" fill="#9ca3af">{t}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={t}>
            <line x1={toX(t)} y1={PT} x2={toX(t)} y2={H - PB} stroke="#f3f4f6" strokeWidth="1" />
            <text x={toX(t)} y={H - PB + 10} textAnchor="middle" fontSize="8" fill="#9ca3af">{t}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <text x={PL + gW / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#6b7280">Overs</text>
      </svg>
    </div>
  );
}

function InningsPartnerships({ inn }) {
  const fow = inn?.fall_of_wickets ?? [];
  if (!fow.length) return <p className="text-sm text-foreground-muted text-center py-8">No wickets fallen.</p>;
  const partnerships = fow.map((wkt, i) => ({
    wkt: wkt.wicket,
    runs: wkt.partnership_runs != null ? wkt.partnership_runs : (wkt.runs ?? 0) - (i === 0 ? 0 : fow[i - 1].runs),
    dismissed: wkt.player,
    over: wkt.over,
    atScore: wkt.runs,
  }));
  const maxRuns = Math.max(...partnerships.map((p) => p.runs), 1);
  return (
    <div className="divide-y divide-outline-variant">
      {partnerships.map((p) => (
        <div key={p.wkt} className="py-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold text-foreground-muted shrink-0">{p.wkt}W</span>
              <span className="text-xs text-foreground truncate">{p.dismissed}</span>
              <span className="text-[10px] text-outline">out {p.over} ov</span>
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums shrink-0 ml-3">
              {p.runs} <span className="text-xs font-normal text-foreground-muted">runs</span>
            </span>
          </div>
          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round((p.runs / maxRuns) * 100)}%` }} />
          </div>
          <p className="text-[10px] text-foreground-muted mt-1 tabular-nums">
            Score at fall: <span className="font-semibold text-foreground">{p.atScore}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function ChartsTab({ scorecard, liveState }) {
  const innings    = scorecard?.innings ?? [];
  const oversLimit = scorecard?.match?.overs_limit ?? 20;
  const currentOver = liveState?.current_over;
  const [activeInn, setActiveInn] = useState(innings[innings.length - 1]?.innings_number ?? 1);

  if (!innings.length) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface p-10 text-center">
        <Icon name="bar_chart" className="text-4xl text-outline mb-2" />
        <p className="text-sm text-foreground-muted">Charts will appear once play has started.</p>
      </div>
    );
  }

  const inn = innings.find((i) => i.innings_number === activeInn) ?? innings[innings.length - 1];

  return (
    <div className="space-y-4">
      {/* Innings selector */}
      {innings.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {innings.map((i) => (
            <button
              key={i.innings_number}
              onClick={() => setActiveInn(i.innings_number)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                activeInn === i.innings_number
                  ? "bg-primary text-white"
                  : "bg-surface border border-outline-variant text-foreground-muted hover:text-foreground"
              }`}
            >
              {i.is_super_over ? "Super Over" : `Inn ${i.innings_number}`}
              {i.batting_team ? ` · ${i.batting_team}` : ""}
            </button>
          ))}
        </div>
      )}

      {/* Manhattan */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-bold text-foreground">Manhattan</h3>
          <span className="text-[10px] text-foreground-muted">Runs per over</span>
        </div>
        <InningsManhattan inn={inn} currentOver={currentOver} liveState={liveState} oversLimit={oversLimit} />
      </div>

      {/* Worm */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-bold text-foreground">Worm</h3>
          <span className="text-[10px] text-foreground-muted">Cumulative runs</span>
        </div>
        <InningsWorm inn={inn} currentOver={currentOver} liveState={liveState} oversLimit={oversLimit} />
      </div>

      {/* Partnerships */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-bold text-foreground">Partnerships</h3>
          <span className="text-[10px] text-foreground-muted">Runs per wicket</span>
        </div>
        <InningsPartnerships inn={inn} />
      </div>
    </div>
  );
}

// â"€â"€â"€ Innings Break Banner â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function InningsBreakBanner({ match, scorecard, token, user, onStateRefresh }) {
  const allInnings      = match.innings ?? [];
  const innings1        = allInnings.find((i) => i.innings_number === 1);
  const innings2        = allInnings.find((i) => i.innings_number === 2);
  // Current innings in match (what liveState returns as match.current_innings_id points to)
  const currentInnings  = allInnings.find((i) => i.id === match.current_innings_id) ?? null;
  const isSuperOver     = Boolean(currentInnings?.is_super_over);
  const isTieBreakPending = Boolean(match.tie_break_pending);
  const isSuperOverTie  = isTieBreakPending && match.tie_break_phase === "super_over";
  const interruptionReason = match.super_over_interruption_reason;
  const interruptionNote   = match.super_over_interruption_note;

  // Target for this break:
  // - Regular innings break: inn1 runs + 1
  // - Super over first-leg break: the completed super over first leg runs + 1
  //   The completed first-leg super over is the one just before current_innings_id
  const completedFirstLeg = isSuperOver
    ? allInnings.find((i) => i.is_super_over && i.status === "completed" && i.innings_number === currentInnings.innings_number - 1)
    : null;
  const firstLegSource  = completedFirstLeg ?? innings1;
  const firstLegRuns    = Number(firstLegSource?.total_runs ?? 0);
  const target          = firstLegSource ? firstLegRuns + 1 : null;

  const [starting, setStarting] = useState(false);
  const isScorer = match.active_scorer_user_id === user?.id;

  async function resume() {
    setStarting(true);
    try {
      await apiRequest(`/api/matches/${match.code}/resume-innings`, { method: "POST", token });
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to start innings.");
    } finally {
      setStarting(false);
    }
  }

  async function decideTieBreak(decision) {
    setStarting(true);
    try {
      await apiRequest(`/api/matches/${match.code}/tie-break/resolve`, {
        method: "POST", token, body: { decision },
      });
      await onStateRefresh();
    } catch (e) {
      toast.error(e?.data?.message ?? "Failed to resolve tie break.");
    } finally {
      setStarting(false);
    }
  }

  // Label logic
  let heading, subtext, resumeLabel;
  if (isTieBreakPending) {
    heading    = isSuperOverTie ? "Super Over Tied ⚡" : "Tie Break Decision ⚖️";
    subtext    = isSuperOverTie
      ? "The super over finished level. Play another super over or keep the match tied."
      : "Scores are level after regulation. Choose a super over or declare a tie.";
  } else if (interruptionReason) {
    heading    = "Super Over Paused";
    subtext    = `Interrupted: ${interruptionReason.replace(/_/g, " ")}${interruptionNote ? ` — ${interruptionNote}` : ""}`;
    resumeLabel = "Resume Super Over";
  } else if (isSuperOver) {
    heading    = "Super Over Break ⚡";
    subtext    = completedFirstLeg
      ? `${completedFirstLeg.batting_team?.name ?? "Team"} scored ${firstLegRuns}. Target: ${target}`
      : "First super over leg complete.";
    resumeLabel = "Start 2nd Super Over Leg";
  } else {
    heading    = "Innings Break";
    subtext    = target ? `1st innings complete · Target: ${target}` : "1st innings complete.";
    resumeLabel = "Start 2nd Innings";
  }

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-3">
      <Icon name="sports_cricket" className="text-4xl text-primary" />
      <h2 className="font-display text-xl font-bold text-foreground">{heading}</h2>
      <p className="text-sm text-foreground-muted">{subtext}</p>

      {/* Chase info for regular innings break */}
      {!isTieBreakPending && !isSuperOver && !interruptionReason && innings2 && target && (
        <p className="text-sm text-foreground-muted">
          {currentInnings?.batting_team?.name ?? "Chasing team"} need{" "}
          <strong className="text-foreground">{target}</strong> to win.
        </p>
      )}

      {isScorer && (
        <div className="flex flex-wrap justify-center gap-2">
          {isTieBreakPending ? (
            <>
              <button
                onClick={() => decideTieBreak("super_over")}
                disabled={starting}
                className="cricket-gradient rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {starting ? "Starting…" : isSuperOverTie ? "Start Next Super Over" : "Start Super Over"}
              </button>
              <button
                onClick={() => decideTieBreak("tie")}
                disabled={starting}
                className="rounded-xl border border-outline-variant bg-white px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface-container disabled:opacity-50"
              >
                Declare Match Tied
              </button>
            </>
          ) : (
            <button
              onClick={resume}
              disabled={starting}
              className="cricket-gradient rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {starting ? "Starting…" : resumeLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// â"€â"€â"€ Page â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export default function LiveScoringPage() {
  const { token, user } = useUser();
  const searchParams    = useSearchParams();
  const code            = searchParams.get("code");

  const [state,        setState]        = useState(null);
  const [scorecard,    setScorecard]    = useState(null);
  const [corrections,  setCorrections]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [activeTab,    setActiveTab]    = useState("scoring");
  const [wsStatus,     setWsStatus]     = useState("connecting"); // "connecting" | "connected" | "disconnected"
  // Auto-switch away from scoring tab when match ends
  useEffect(() => {
    if (state?.match?.status === "completed" || state?.match?.status === "abandoned") {
      setActiveTab((prev) => prev === "scoring" ? "scorebook" : prev);
    }
  }, [state?.match?.status]);
  const [correctingDelivery, setCorrectingDelivery] = useState(null); // delivery object to correct

  const fetchState = useCallback(async () => {
    if (!code || !token) return null;
    try {
      const data = await apiRequest(`/api/matches/${code}/state`, { token });
      setState(data);
      setError("");
      return data;
    } catch (e) {
      setError(e?.data?.message ?? "Failed to load live state.");
      return null;
    }
  }, [code, token]);

  const fetchScorecard = useCallback(async () => {
    if (!code) return;
    try {
      const data = await apiRequest(`/api/matches/${code}/scorecard`);
      setScorecard(data);
    } catch { /* non-critical */ }
  }, [code]);

  const fetchCorrections = useCallback(async () => {
    if (!code || !token) return;
    try {
      const data = await apiRequest(`/api/matches/${code}/corrections`, { token });
      setCorrections(Array.isArray(data) ? data : []);
    } catch { /* non-critical - user may not be a participant */ }
  }, [code, token]);

  useEffect(() => {
    if (!code || !token) return;
    let active = true;
    (async () => {
      try {
        await Promise.all([fetchState(), fetchScorecard(), fetchCorrections()]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [code, token, fetchState, fetchScorecard, fetchCorrections]);

  // Reverb WebSocket
  useEffect(() => {
    if (!code) return;

    const echo = getEcho();
    const channel = echo.channel(`match.${code}`);

    channel.listen(".state.updated", () => {
      fetchState().then((st) => {
        // After state refresh, if DLS is active and innings 2 is live, recalculate par
        if (st?.match?.dls_applied && st?.innings?.innings_number === 2 && st?.match?.status === "live") {
          recalcDlsPar();
        }
      });
      fetchScorecard();
      fetchCorrections();
    });

    // Connection status tracking
    const connector = echo.connector?.pusher?.connection;
    if (connector) {
      connector.bind("connected",    () => setWsStatus("connected"));
      connector.bind("disconnected", () => setWsStatus("disconnected"));
      connector.bind("unavailable",  () => setWsStatus("disconnected"));
      connector.bind("connecting",   () => setWsStatus("connecting"));
    }

    return () => {
      echo.leaveChannel(`match.${code}`);
    };
  }, [code, fetchState, fetchScorecard, fetchCorrections]);

  async function refresh() {
    await Promise.all([fetchState(), fetchScorecard(), fetchCorrections()]);
  }

  // Auto-recalculate DLS par after each delivery when DLS is active on innings 2
  const recalcDlsPar = useCallback(async () => {
    if (!code || !token) return;
    try {
      await apiRequest(`/api/matches/${code}/dls/recalculate-par`, { method: "POST", token });
    } catch { /* non-critical */ }
  }, [code, token]);

  if (!code) {
    return (
      <AppShell title="Live Scoring" subtitle="No match code provided">
        <p className="text-sm text-foreground-muted">Please open this page from a match card.</p>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="Live Scoring" subtitle="Loading...">
        <PageSpinner />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Live Scoring" subtitle="Error">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </AppShell>
    );
  }

  if (!state) return null;

  const { match, innings } = state;
  const matchStatus = match.status;
  const isMatchOver = matchStatus === "completed" || matchStatus === "abandoned";

  const teamNames = (match.match_teams ?? []).reduce((acc, mt) => {
    acc[mt.role] = mt.team?.name ?? mt.role;
    return acc;
  }, {});

  const subtitle = [teamNames.home, teamNames.away].filter(Boolean).join(" vs ");

  return (
    <AppShell
      title="Live Scoring"
      subtitle={subtitle || match.code}
      action={
        <div className="flex items-center gap-2">
          {/* WebSocket status pill */}
          <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold
            ${wsStatus === "connected"    ? "bg-green-100 text-secondary" :
              wsStatus === "connecting"   ? "bg-amber-100 text-amber-700" :
                                           "bg-red-100 text-red-600"}`}>
            <span className={`h-1.5 w-1.5 rounded-full
              ${wsStatus === "connected"  ? "bg-secondary live-dot" :
                wsStatus === "connecting" ? "bg-amber-500 animate-pulse" :
                                           "bg-red-500"}`} />
            {wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "Connecting..." : "Offline - run reverb:start"}
          </span>
        <Link
          href={`/matches/${code}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-3 py-2 text-xs font-semibold text-foreground-muted hover:bg-surface-container transition-colors"
          target="_blank"
        >
          <span className="h-2 w-2 rounded-full bg-tertiary live-dot" />
          Live View
        </Link>
        </div>
      }
    >
      {/* Match over banner */}
      {isMatchOver && (
        <div className="mb-5 rounded-2xl border border-secondary/20 bg-secondary/5 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name="emoji_events" className="text-3xl text-secondary shrink-0" />
            <div>
              <p className="font-display font-bold text-foreground">
                {matchStatus === "completed" ? "Match Complete" : "Match Abandoned"}
              </p>
              {scorecard?.result?.summary && (
                <p className="text-sm text-foreground-muted mt-0.5">{scorecard.result.summary}</p>
              )}
            </div>
          </div>
          <Link
            href={`/matches/${code}`}
            target="_blank"
            className="cricket-gradient shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white"
          >
            Public Page →
          </Link>
        </div>
      )}

      {/* Page tabs — hide Scoring tab once match is over */}
      <div className="flex gap-1 border-b border-outline-variant mb-6 -mx-4 px-4 md:-mx-6 md:px-6">
        {[
          { id: "scoring",   label: "Scoring",   icon: "sports_cricket", hidden: isMatchOver },
          { id: "charts",    label: "Charts",    icon: "bar_chart" },
          { id: "scorebook", label: "Scorebook", icon: "book" },
        ].filter((t) => !t.hidden).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            <Icon name={t.icon} className="text-base" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Correct delivery modal */}
      {correctingDelivery && (
        <CorrectDeliveryModal
          delivery={correctingDelivery}
          matchCode={code}
          innings={innings}
          allPlayers={match.players ?? []}
          token={token}
          onDone={() => { setCorrectingDelivery(null); refresh(); }}
          onCancel={() => setCorrectingDelivery(null)}
        />
      )}

      {/* Scoring tab */}
      {activeTab === "scoring" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left: scoring area */}
          <section className="xl:col-span-2 space-y-5">
            {/* Pending corrections banner - visible to everyone in the match */}
            <PendingCorrectionsPanel
              corrections={corrections}
              token={token}
              matchCode={code}
              onRefresh={refresh}
            />

            {matchStatus === "innings_break" ? (
              <InningsBreakBanner
                match={match}
                scorecard={scorecard}
                token={token}
                user={user}
                onStateRefresh={refresh}
              />
            ) : matchStatus === "paused" ? (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center space-y-2">
                <Icon name="pause_circle" className="text-4xl text-amber-500" />
                <h2 className="font-display text-lg font-bold text-amber-800">
                  {PAUSE_REASONS.find((r) => r.value === match.pause_reason)?.label ?? "Match Paused"}
                </h2>
                {match.pause_note && (
                  <p className="text-sm text-amber-600">{match.pause_note}</p>
                )}
                <p className="text-xs text-amber-500">Scoring is locked. Resume play from the sidebar when ready.</p>
              </div>
            ) : (
              <ScoringPanel
                state={state}
                scorecard={scorecard}
                user={user}
                token={token}
                onStateRefresh={refresh}
                onProposeCorrection={setCorrectingDelivery}
              />
            )}
          </section>

          {/* Right: sidebar */}
          <aside className="space-y-5">
            {matchStatus !== "innings_break" && matchStatus !== "paused" && (
              <>
                {/* RRR chase panel - 2nd innings only */}
                <RRRPanel state={state} scorecard={scorecard} />

                {/* Partnership tracker */}
                <PartnershipTracker batsmen={state.batsmen} innings={innings} />

                <ThisOverPanel
                  currentOver={state.current_over}
                  innings={innings}
                  onProposeCorrection={setCorrectingDelivery}
                />

              </>
            )}
            <DlsPanel match={match} scorecard={scorecard} user={user} token={token} onStateRefresh={refresh} />
            <PauseMatchPanel match={match} user={user} token={token} onStateRefresh={refresh} />
            <ManualCommentaryPanel match={match} user={user} token={token} onStateRefresh={refresh} />
            <ScorerLockPanel
              match={match}
              user={user}
              token={token}
              onStateRefresh={refresh}
            />
            <Link
              href={`/matches/${code}`}
              className="block rounded-2xl border border-outline-variant bg-surface p-4 md:p-5 hover:bg-surface-container-low transition-colors"
              target="_blank"
            >
              <div className="flex items-center gap-3 mb-1">
                <span className="h-2 w-2 rounded-full bg-tertiary live-dot" />
                <h3 className="font-display text-base font-bold text-foreground">Public Scoreboard</h3>
              </div>
              <p className="text-xs text-foreground-muted mb-2">Share with spectators - no login needed.</p>
              <p className="text-sm font-semibold text-primary">Open live scoreboard &rarr;</p>
            </Link>
            <div className="rounded-2xl border border-outline-variant bg-surface p-4 md:p-5 space-y-2 text-sm">
              <h3 className="font-display text-base font-bold text-foreground mb-2">Match Info</h3>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Format</span>
                <span className="font-semibold text-foreground">{matchFormatLabel(match)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Code</span>
                <span className="font-mono text-xs font-semibold text-foreground">{match.code}</span>
              </div>
              {match.venue && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Venue</span>
                  <span className="font-semibold text-foreground text-right max-w-[60%]">{match.venue}</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Charts tab */}
      {activeTab === "charts" && (
        <ChartsTab scorecard={scorecard} liveState={state} />
      )}

      {/* Scorebook tab */}
      {activeTab === "scorebook" && (
        <ScorebookPanel
          scorecard={scorecard}
          oversLimit={match.overs_limit}
        />
      )}
    </AppShell>
  );
}


