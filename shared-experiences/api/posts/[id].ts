export const runtime = "nodejs";

import { sql } from "./db.js";
import { checkAdmin } from "../_helpers/auth.js";

type DbRow = {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean;
  content: string;
  status: "draft" | "published";
  created_at: string | null;
  updated_at: string | null;
  version: number | null;
};

type UpdateBody = {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean;
  content: string;
  status: "draft" | "published";
  slug: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function mapRow(row: DbRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt,
    image: row.image,
    category: row.category,
    featured: row.featured,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

// GET /api/posts/:id
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || url.pathname.split("/").pop();

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing post ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rows = (await sql`
      SELECT * FROM posts WHERE id = ${id}
    `) as DbRow[];

    if (!rows.length) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(mapRow(rows[0])), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/posts/:id failed:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// PUT /api/posts/:id
export async function PUT(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || url.pathname.split("/").pop();

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing post ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as UpdateBody;

    const requiredFields: (keyof UpdateBody)[] = [
      "title",
      "date",
      "excerpt",
      "image",
      "category",
      "content",
      "status",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(JSON.stringify({ error: `Missing field: ${field}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const slug = body.slug && typeof body.slug === "string"
      ? body.slug
      : slugify(body.title);

    const existing = (await sql`
      SELECT id FROM posts WHERE slug = ${slug} AND id != ${id} LIMIT 1
    `) as { id: string }[];

    if (existing.length) {
      return new Response(JSON.stringify({ error: "Slug already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = (await sql`
      UPDATE posts SET
        title = ${body.title},
        date = ${body.date},
        excerpt = ${body.excerpt},
        image = ${body.image},
        category = ${body.category},
        featured = ${body.featured ?? false},
        content = ${body.content},
        status = ${body.status},
        slug = ${slug},
        updated_at = NOW(),
        version = COALESCE(version, 0) + 1
      WHERE id = ${id}
      RETURNING *
    `) as DbRow[];

    if (!result.length) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(mapRow(result[0])), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const message = err?.message || "Server error";
    console.error("PUT /api/posts/:id failed:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE /api/posts/:id
export async function DELETE(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || url.pathname.split("/").pop();

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing post ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = (await sql`
      DELETE FROM posts WHERE id = ${id} RETURNING id
    `) as { id: string }[];

    if (!result.length) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  } catch (err: any) {
    const message = err?.message || "Server error";
    console.error("DELETE /api/posts/:id failed:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

