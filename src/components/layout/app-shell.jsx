"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-config";
import { useUser } from "@/lib/user-context";
import { Icon } from "@/components/ui/icon";

function isItemActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// ─── User avatar (real photo or initials) ────────────────────────────────────

function UserAvatar({ user, size = "sm" }) {
  const dim = size === "lg" ? "h-10 w-10 text-base" : "h-9 w-9 text-sm";
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={user.name} className={`${dim} rounded-full object-cover`} />;
  }
  return (
    <div className={`${dim} cricket-gradient flex items-center justify-center rounded-full font-bold text-white`}>
      {initials(user?.name || "CA")}
    </div>
  );
}

// ─── Navbar user dropdown ─────────────────────────────────────────────────────

function UserDropdown({ user, signOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-surface-container"
      >
        <UserAvatar user={user} />
        <span className="hidden max-w-[120px] truncate text-sm font-semibold text-foreground md:block">
          {user?.name?.split(" ")[0] ?? "Account"}
        </span>
        <Icon name="expand_more" className="text-lg text-outline" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-lg">
          {/* User info header */}
          <div className="flex items-center gap-3 border-b border-outline-variant px-4 py-3">
            <UserAvatar user={user} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
              <p className="truncate text-xs text-foreground-muted">{user?.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-container-low"
            >
              <Icon name="person" className="text-lg text-outline" />
              My Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-container-low"
            >
              <Icon name="settings" className="text-lg text-outline" />
              Settings
            </Link>
          </div>

          <div className="border-t border-outline-variant p-1.5">
            <button
              type="button"
              onClick={() => { setOpen(false); signOut(); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground-muted transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Icon name="logout" className="text-lg" />
              Sign Out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export function AppShell({ title, subtitle, action, children }) {
  const pathname = usePathname();
  const { user, signOut } = useUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 flex-col border-r border-outline-variant bg-surface lg:flex">
        <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
          <Icon name="sports_cricket" className="text-2xl text-primary" />
          <p className="font-display text-lg font-bold">CricketApp</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = isItemActive(pathname, item.href);
            
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors text-foreground-muted hover:bg-surface-container-low hover:text-foreground"
                >
                  <Icon name={item.icon} className="text-xl" />
                  <span>{item.label}</span>
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-fixed text-primary"
                    : "text-foreground-muted hover:bg-surface-container-low hover:text-foreground"
                }`}
              >
                <Icon name={item.icon} className={`text-xl ${active ? "" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 border-b border-outline-variant bg-surface/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">{title}</h1>
              {subtitle ? <p className="mt-0.5 text-xs text-foreground-muted">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              {action ? <div>{action}</div> : null}
              <UserDropdown user={user} signOut={signOut} />
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-outline-variant bg-surface lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const active = isItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                active ? "text-primary" : "text-foreground-muted"
              }`}
            >
              <Icon name={item.icon} className="text-xl" />
              <span>{item.label.replace("My ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
