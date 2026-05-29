"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("notifications");

  const tabs = [
    { id: "notifications", label: "Notifications", icon: "notifications" },
    { id: "appearance",    label: "Appearance",    icon: "palette"        },
    { id: "security",      label: "Password",      icon: "lock"           },
    { id: "danger",        label: "Danger Zone",   icon: "warning", danger: true },
  ];

  return (
    <AppShell title="Settings" subtitle="Manage your account and preferences">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Settings sidebar nav */}
        <aside className="w-full shrink-0 md:w-52">
          <nav className="rounded-2xl border border-outline-variant bg-white p-2 md:sticky md:top-24">
            {tabs.map((tab) => (
              <div key={tab.id}>
                {tab.danger ? <div className="my-2 border-t border-outline-variant" /> : null}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary-fixed text-primary"
                      : tab.danger
                      ? "text-error hover:bg-red-50"
                      : "text-foreground-muted hover:bg-surface-container-low hover:text-foreground"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              </div>
            ))}
          </nav>
        </aside>

        {/* Settings content */}
        <div className="min-w-0 flex-1 space-y-4">
          {activeTab === "notifications" && (
            <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white">
              <div className="border-b border-outline-variant px-6 py-4">
                <h2 className="font-display font-bold text-foreground">Notification Preferences</h2>
              </div>
              <div className="space-y-3 p-6">
                <NotificationToggle icon="sports_cricket"  iconColor="text-primary"   title="Match Started"            description="When a match you're in goes live"        defaultChecked={true}  />
                <NotificationToggle icon="close_small"     iconColor="text-tertiary"  title="Wicket Fell"              description="Real-time wicket notifications"            defaultChecked={true}  />
                <NotificationToggle icon="emoji_events"    iconColor="text-secondary" title="Match Result"             description="Final result & scorecard available"        defaultChecked={true}  />
                <NotificationToggle icon="group_add"       iconColor="text-primary"   title="Join Request"             description="Someone wants to join your team"           defaultChecked={true}  />
                <NotificationToggle icon="edit"            iconColor="text-outline"   title="Scorer Takeover Request"  description="Someone wants scorer control"              defaultChecked={false} />
                <NotificationToggle icon="campaign"        iconColor="text-outline"   title="App Updates & News"       description="New features and announcements"            defaultChecked={false} />
                <div className="flex justify-end pt-2">
                  <button className="cricket-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105">Save Preferences</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white">
              <div className="border-b border-outline-variant px-6 py-4">
                <h2 className="font-display font-bold text-foreground">Appearance</h2>
              </div>
              <div className="p-6">
                <label className="mb-3 block text-sm font-semibold text-foreground">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Light",  bg: "bg-surface border border-outline-variant" },
                    { label: "Dark",   bg: "bg-gray-900"                              },
                    { label: "System", bg: ""                                          },
                  ].map((t, i) => (
                    <div key={t.label} className={`cursor-pointer rounded-xl border-2 p-3 transition-colors ${i === 0 ? "border-primary bg-primary-fixed" : "border-outline-variant hover:border-primary"}`}>
                      <div className={`mb-2 h-12 w-full overflow-hidden rounded-lg ${t.bg}`}>
                        {i === 2 ? <><div className="h-1/2 bg-surface" /><div className="h-1/2 bg-gray-900" /></> : null}
                      </div>
                      <p className={`text-center text-xs font-semibold ${i === 0 ? "text-primary" : "text-foreground-muted"}`}>{t.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white">
              <div className="border-b border-outline-variant px-6 py-4">
                <h2 className="font-display font-bold text-foreground">Change Password</h2>
              </div>
              <div className="space-y-4 p-6">
                {[
                  { label: "Current Password", icon: "lock",       placeholder: "••••••••"          },
                  { label: "New Password",      icon: "lock_open",  placeholder: "Min. 8 characters" },
                  { label: "Confirm Password",  icon: "lock_reset", placeholder: "Repeat new password" },
                ].map((f) => (
                  <div key={f.label} className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">{f.label}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">{f.icon}</span>
                      <input type="password" placeholder={f.placeholder} className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <button className="cricket-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105">Update Password</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="overflow-hidden rounded-2xl border-2 border-error/30 bg-white">
              <div className="border-b border-error/20 bg-red-50 px-6 py-4">
                <h2 className="flex items-center gap-2 font-display font-bold text-error">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  Danger Zone
                </h2>
                <p className="mt-0.5 text-xs text-foreground-muted">These actions are irreversible. Please be certain.</p>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4 rounded-xl border border-outline-variant p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Export My Data</p>
                    <p className="mt-0.5 text-xs text-foreground-muted">Download all your matches, stats, and team data as JSON.</p>
                  </div>
                  <button className="shrink-0 rounded-xl border border-outline-variant px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-container">Export</button>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl border border-error/30 bg-red-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-error">Delete Account</p>
                    <p className="mt-0.5 text-xs text-foreground-muted">Permanently delete your account. All data will be removed.</p>
                  </div>
                  <button className="shrink-0 rounded-xl bg-error px-3 py-2 text-xs font-semibold text-white transition-all hover:scale-105">Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function NotificationToggle({ icon, iconColor, title, description, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-xl ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-foreground-muted">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setChecked((v) => !v)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-outline-variant"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
