"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageSection } from "@/components/ui/page-section";
import { useUser } from "@/lib/user-context";
import { Icon } from "@/components/ui/icon";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <AppShell
      title={`Welcome back, ${user.name.split(" ")[0]}`}
      subtitle="Your verified account is ready for scoring, teams, and match management."
      action={
        <Link
          href="/create-match"
          className="cricket-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Icon name="add" className="text-lg" />
          New Match
        </Link>
      }
    >
      <div className="space-y-8">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-xl bg-primary-fixed p-2.5">
                <Icon name="verified_user" className="text-xl text-primary" />
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-secondary">Verified</span>
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Account</p>
            <p className="font-display text-2xl font-bold">Ready</p>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
            <div className="mb-4">
              <div className="rounded-xl bg-green-100 p-2.5 inline-flex">
                <Icon name="mail" className="text-xl text-secondary" />
              </div>
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Email</p>
            <p className="truncate text-sm font-semibold">{user.email}</p>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
            <div className="mb-4">
              <div className="inline-flex rounded-xl bg-primary-fixed p-2.5">
                <Icon name="phone" className="text-xl text-primary" />
              </div>
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Phone</p>
            <p className="text-sm font-semibold">{user.phone || "Not added yet"}</p>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
            <div className="mb-4">
              <div className="rounded-xl bg-green-100 p-2.5 inline-flex">
                <Icon name="vpn_key" className="text-xl text-secondary" />
              </div>
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Session</p>
            <p className="font-display text-2xl font-bold">Active</p>
          </article>
        </section>

        <PageSection title="Quick Actions">
          <div className="flex flex-wrap gap-3">
            <Link href="/create-match" className="cricket-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white">
              <Icon name="add_circle" className="" />
              Create Match
            </Link>
            <Link href="/team-management" className="inline-flex items-center gap-2 rounded-xl bg-surface-container-low px-6 py-3 text-sm font-semibold border border-outline-variant hover:bg-surface-container transition-colors">
              <Icon name="group_add" className="" />
              Manage Teams
            </Link>
            <Link href="/my-matches" className="inline-flex items-center gap-2 rounded-xl border border-primary-fixed px-6 py-3 text-sm font-semibold text-primary hover:bg-primary-fixed transition-colors">
              <Icon name="sports_cricket" className="" />
              View My Matches
            </Link>
          </div>
        </PageSection>
      </div>
    </AppShell>
  );
}
