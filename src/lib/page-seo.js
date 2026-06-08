const BACKEND = process.env.LARAVEL_INTERNAL_URL ?? "http://127.0.0.1:8000";

export async function fetchPageSeo(key) {
  try {
    const res = await fetch(`${BACKEND}/api/seo/${key}`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Build a Next.js metadata object from page SEO data + fallback defaults.
export function buildMetadata({ seo, fallbackTitle, fallbackDescription, path = "" }) {
  const title       = seo?.meta_title       || fallbackTitle;
  const description = seo?.meta_description || fallbackDescription;
  const keywords    = seo?.keywords ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined;
  const canonical   = seo?.canonical_url    || undefined;

  return {
    title,
    description,
    ...(keywords  && { keywords }),
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}
