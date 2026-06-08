import { apiRequest } from "@/lib/api";
import { TournamentHub } from "./tournament-client";

export async function generateMetadata({ params }) {
  try {
    const t = await apiRequest(`/api/tournaments/${params.code}`, { cache: "no-store" });
    const status = t.status === "completed" ? "Completed" : t.status === "active" ? "Active" : "Upcoming";
    return {
      title:       `${t.title} | CricketApp`,
      description: t.description || `${t.title} — ${t.format?.replace("_", " ")} cricket tournament. ${status}.`,
      openGraph: {
        title:       `${t.title} | CricketApp`,
        description: t.description || `${t.title} cricket tournament`,
        images:      t.banner_url ? [{ url: t.banner_url }] : [],
      },
    };
  } catch {
    return { title: "Tournament | CricketApp" };
  }
}

export default async function TournamentPage({ params }) {
  let initialData = null;
  try {
    const [tournament, standings, fixtures, stats] = await Promise.allSettled([
      apiRequest(`/api/tournaments/${params.code}`,            { cache: "no-store" }),
      apiRequest(`/api/tournaments/${params.code}/standings`,  { cache: "no-store" }),
      apiRequest(`/api/tournaments/${params.code}/fixtures`,   { cache: "no-store" }),
      apiRequest(`/api/tournaments/${params.code}/stats`,      { cache: "no-store" }),
    ]);
    initialData = {
      tournament: tournament.status === "fulfilled" ? tournament.value  : null,
      standings:  standings.status  === "fulfilled" ? standings.value   : null,
      fixtures:   fixtures.status   === "fulfilled" ? fixtures.value    : null,
      stats:      stats.status      === "fulfilled" ? stats.value       : null,
    };
  } catch { /* client will fetch */ }

  return <TournamentHub code={params.code} initialData={initialData} />;
}
