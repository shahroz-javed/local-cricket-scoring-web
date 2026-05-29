export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid_view" },
  { href: "/my-matches", label: "My Matches", icon: "sports_cricket" },
  { href: "/team-management", label: "My Teams", icon: "groups" },
  { href: "/join-team", label: "Join a Team", icon: "group_add" },
  { href: "/profile", label: "My Profile", icon: "person" },
  { href: "/tournaments", label: "Tournaments", icon: "emoji_events" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: process.env.NEXT_PUBLIC_FRONTEND_URL || "https://localhost:3000", label: "Visit Website", icon: "open_in_new", external: true },
];
