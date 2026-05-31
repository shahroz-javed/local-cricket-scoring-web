"use client";

import * as LucideIcons from "lucide-react";

const ICON_MAP = {
  // General UI
  add: "Plus",
  apps: "Grid2X2",
  arrow_back: "ArrowLeft",
  bar_chart: "BarChart3",
  book: "BookOpen",
  cancel: "Ban",
  calendar_today: "Calendar",
  check: "Check",
  check_circle: "CircleCheck",
  close: "X",
  content_copy: "Copy",
  delete: "Trash2",
  download: "Download",
  edit: "Pencil",
  edit_calendar: "CalendarPen",
  edit_note: "NotebookPen",
  event: "CalendarDays",
  grid_view: "LayoutGrid",
  group_add: "UserPlus",
  groups: "Users",
  hourglass_top: "Hourglass",
  info: "Info",
  location_on: "MapPin",
  open_in_new: "ExternalLink",
  pause_circle: "CirclePause",
  person: "User",
  person_add: "UserPlus",
  person_remove: "UserMinus",
  qr_code: "QrCode",
  radar: "Radar",
  record_voice_over: "Mic",
  schedule: "CalendarClock",
  search: "Search",
  settings: "Settings2",
  share: "Share2",
  star: "Star",
  timeline: "Activity",
  tune: "SlidersHorizontal",

  // Cricket-specific / sports
  emoji_events: "Trophy",
  sports_cricket: "Cricket",
  sports_baseball: "Baseball",
  bolt: "Zap",
  send: "Send",
  swap_horiz: "ArrowLeftRight",

  // Compatibility fallbacks
  shield: "Shield",
  help: "HelpCircle",
};

export function Icon({ name, className = "", title, strokeWidth = 2.25, ...props }) {
  const iconName = ICON_MAP[name] ?? name;
  const Glyph = (iconName && LucideIcons[iconName]) || LucideIcons.HelpCircle;

  return (
    <Glyph
      aria-hidden={title ? undefined : true}
      className={className}
      strokeWidth={strokeWidth}
      {...(title ? { role: "img", title } : {})}
      {...props}
    />
  );
}
