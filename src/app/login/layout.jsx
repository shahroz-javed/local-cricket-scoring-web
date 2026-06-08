import { fetchPageSeo, buildMetadata } from "@/lib/page-seo";

export async function generateMetadata() {
  const seo = await fetchPageSeo("login");
  return buildMetadata({
    seo,
    fallbackTitle: "Sign In — CricketApp",
    fallbackDescription: "Sign in to CricketApp to score matches, manage your teams, and follow live scorecards.",
    path: "/login",
  });
}

export default function LoginLayout({ children }) {
  return children;
}
