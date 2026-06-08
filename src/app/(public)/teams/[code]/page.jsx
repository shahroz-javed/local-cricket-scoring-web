import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import TeamProfileClient from "./client";

const BACKEND = process.env.LARAVEL_INTERNAL_URL ?? "http://127.0.0.1:8000";

export async function generateMetadata({ params }) {
  try {
    const { code } = await params;
    const res = await fetch(
      `${BACKEND}/api/teams/${code}/profile`,
      { next: { revalidate: 60 }, headers: { Accept: "application/json" } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    return {
      title: `${data.team?.name ?? "Team"} — CricketApp`,
      description: `${data.team?.name} cricket team profile. ${data.record?.played ?? 0} matches played.`,
    };
  } catch {
    return {};
  }
}

export default async function TeamProfilePage({ params }) {
  const { code } = await params;
  let data;
  try {
    const res = await fetch(
      `${BACKEND}/api/teams/${code}/profile`,
      { next: { revalidate: 30 }, headers: { Accept: "application/json" } }
    );
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error("fetch failed");
    data = await res.json();
  } catch {
    return (
      <PublicShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-10 text-center m-4">
          <p className="text-sm font-semibold text-red-700">Team not found.</p>
        </div>
      </PublicShell>
    );
  }

  return <TeamProfileClient data={data} />;
}
