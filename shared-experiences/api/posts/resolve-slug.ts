export const runtime = "nodejs";

import { sql } from "./db.js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug")?.trim();

  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const direct = (await sql`
      SELECT slug FROM posts WHERE slug = ${slug} LIMIT 1
    `) as { slug: string }[];

    if (direct.length) {
      return new Response(JSON.stringify({ slug: direct[0].slug, isAlias: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const aliasRows = (await sql`
      SELECT p.slug AS canonical
      FROM post_slug_aliases a
      JOIN posts p ON p.id = a.post_id
      WHERE a.slug = ${slug}
      LIMIT 1
    `) as { canonical: string }[];

    if (aliasRows.length) {
      return new Response(
        JSON.stringify({ slug: aliasRows[0].canonical, isAlias: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const message = err?.message || "";
    if (message.includes("post_slug_aliases") && message.includes("does not exist")) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("GET /api/posts/resolve-slug failed:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
