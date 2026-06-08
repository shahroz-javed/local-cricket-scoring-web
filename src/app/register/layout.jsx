import { fetchPageSeo, buildMetadata } from "@/lib/page-seo";

export async function generateMetadata() {
  const seo = await fetchPageSeo("register");
  return buildMetadata({
    seo,
    fallbackTitle: "Get Started — CricketApp",
    fallbackDescription: "Create your free CricketApp account and start scoring cricket matches with real-time scorecards and push notifications.",
    path: "/register",
  });
}

export default function RegisterLayout({ children }) {
  return children;
}
