import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";

const BACKEND = process.env.LARAVEL_INTERNAL_URL ?? "http://127.0.0.1:8000";

async function fetchPost(slug) {
  const res = await fetch(`${BACKEND}/api/blog/${slug}`, {
    next: { revalidate: 30 },
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const post = await fetchPost(slug);
    if (!post) return {};

    const title       = post.meta_title       || `${post.title} — CricketApp`;
    const description = post.meta_description || post.excerpt || undefined;
    const keywords    = post.keywords ? post.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined;
    const canonical   = post.canonical_url    || undefined;

    return {
      title,
      description,
      ...(keywords  && { keywords }),
      ...(canonical && { alternates: { canonical } }),
      openGraph: {
        title,
        description,
        images: post.featured_image ? [{ url: post.featured_image }] : [],
        type: "article",
        publishedTime: post.published_at,
      },
    };
  } catch {
    return {};
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  let post;
  try {
    post = await fetchPost(slug);
  } catch {
    post = null;
  }

  if (!post) notFound();

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        {/* Back */}
        <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          All posts
        </Link>

        {/* Category */}
        {post.category && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{post.category}</p>
        )}

        {/* Title */}
        <h1 className="font-display text-3xl font-bold text-foreground leading-tight sm:text-4xl">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-outline border-b border-outline-variant pb-6">
          {post.author && <span>By <strong className="text-foreground">{post.author}</strong></span>}
          {publishedDate && <span>{publishedDate}</span>}
          {post.view_count > 0 && <span>{post.view_count.toLocaleString()} views</span>}
        </div>

        {/* Featured image */}
        {post.featured_image && (
          <img
            src={post.featured_image}
            alt={post.title}
            className="mt-8 w-full rounded-2xl object-cover shadow-sm"
            style={{ maxHeight: "400px" }}
          />
        )}

        {/* Body — rendered HTML from Tiptap */}
        <div
          className="blog-body mt-8 text-foreground"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-outline-variant pt-6">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-outline-variant px-3 py-1 text-xs font-medium text-foreground-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

      </article>
    </PublicShell>
  );
}
