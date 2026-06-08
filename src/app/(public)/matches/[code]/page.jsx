import MatchPageClient from "./match-client";

// Server-side fetches bypass Next.js rewrites, so hit Laravel directly.
// LARAVEL_INTERNAL_URL defaults to localhost:8000 for local dev.
const BACKEND = process.env.LARAVEL_INTERNAL_URL ?? "http://127.0.0.1:8000";

async function fetchScorecard(code) {
  const res = await fetch(`${BACKEND}/api/matches/${code}/scorecard`, {
    next: { revalidate: 10 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }) {
  try {
    const { code } = await params;
    const data = await fetchScorecard(code);
    if (!data) return { title: "Match — CricketApp" };
    const home = data.match?.teams?.find((t) => t.role === "home")?.name ?? "";
    const away = data.match?.teams?.find((t) => t.role === "away")?.name ?? "";
    const title = home && away
      ? `${home} vs ${away} — CricketApp`
      : "Match Scorecard — CricketApp";
    const status = data.match?.status;
    const description = status === "live"
      ? `Live cricket scorecard: ${home} vs ${away}. Ball-by-ball updates.`
      : `Cricket scorecard: ${home} vs ${away}. ${data.result?.summary ?? ""}`;
    return {
      title,
      description,
      openGraph: { title, description, type: "website" },
    };
  } catch {
    return { title: "Match — CricketApp" };
  }
}

export default async function MatchPage({ params }) {
  const { code } = await params;
  let initialSc = null;
  try {
    initialSc = await fetchScorecard(code);
  } catch {
    // Fall through — client will fetch on mount
  }

  return <MatchPageClient initialSc={initialSc} />;
}
