import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { fetchPageSeo, buildMetadata } from "@/lib/page-seo";

const BACKEND = process.env.LARAVEL_INTERNAL_URL ?? "http://127.0.0.1:8000";

export async function generateMetadata() {
  const seo = await fetchPageSeo("blog");
  return buildMetadata({
    seo,
    fallbackTitle: "Blog — CricketApp",
    fallbackDescription: "Cricket scoring guides, tutorials, and app updates from the CricketApp team.",
    path: "/blog",
  });
}

async function fetchPosts(page = 1) {
  try {
    const res = await fetch(`${BACKEND}/api/blog?page=${page}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function PostCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block rounded-2xl border border-outline-variant bg-surface overflow-hidden hover:shadow-md transition-shadow">
      {post.featured_image && (
        <img
          src={post.featured_image}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-5">
        {post.category && (
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {post.category}
          </span>
        )}
        <h2 className="mt-1 text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 text-sm text-foreground-muted line-clamp-3">{post.excerpt}</p>
        )}
        <div className="mt-4 flex items-center gap-3 text-xs text-outline">
          {post.author && <span>By {post.author}</span>}
          {post.published_at && (
            <span>{new Date(post.published_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function BlogListPage() {
  const data = await fetchPosts();

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground">Blog</h1>
          <p className="mt-3 text-foreground-muted">Cricket scoring guides, tutorials, and app updates</p>
        </div>

        {!data || data.data.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant bg-surface py-20 text-center text-foreground-muted">
            <p className="text-sm">No posts published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
