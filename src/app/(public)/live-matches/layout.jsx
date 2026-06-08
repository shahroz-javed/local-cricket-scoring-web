import { fetchPageSeo, buildMetadata } from "@/lib/page-seo";

export async function generateMetadata() {
  const seo = await fetchPageSeo("live-matches");
  return buildMetadata({
    seo,
    fallbackTitle: "Live Matches — CricketApp",
    fallbackDescription: "Watch live cricket scores in real time. Ball-by-ball updates, wickets, and push notifications.",
    path: "/live-matches",
  });
}

export default function LiveMatchesLayout({ children }) {
  return children;
}
