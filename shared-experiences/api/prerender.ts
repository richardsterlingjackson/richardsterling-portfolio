export const runtime = "nodejs";

import { sql } from "./posts/db.js";

type DbRow = {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  status: "draft" | "published";
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function humanizeSlug(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const slug = url.searchParams.get("slug") || "";

  let post: DbRow | null = null;

  if (slug) {
    try {
      const rows = (await sql`
        SELECT title, excerpt, image, category, slug, status
        FROM posts
        WHERE slug = ${slug}
        LIMIT 1
      `) as DbRow[];
      post = rows[0] ?? null;
    } catch (err) {
      console.error("prerender fetch failed:", err);
    }
  }

  const fallbackTitle = slug ? humanizeSlug(slug) : "Shared Experiences";
  const title = post?.title || fallbackTitle;
  const description = post?.excerpt || "Stories and reflections from Shared Experiences.";
  const category = post?.category || "";
  const pageUrl = slug ? `${origin}/posts/${encodeURIComponent(slug)}` : origin;

  // Use our dynamic OG image so Facebook always gets a crawlable preview (post images can be blocked or fail for crawlers).
  const ogImage = `${origin}/api/og?title=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | Shared Experiences</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(pageUrl)}" />

    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta property="og:site_name" content="Shared Experiences" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  </head>
  <body>
    <p>Loading…</p>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
