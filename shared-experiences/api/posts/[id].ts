// api/posts/[id].ts
import { sql } from "./db.js";

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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing post ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const rows = (await sql`SELECT * FROM posts WHERE id = ${id}`) as DbRow[];

    if (!rows.length) {
      return new Response(
        JSON.stringify({ error: "Post not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const post = mapRow(rows[0]);

    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/posts/:id failed:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing post ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as UpdateBody;

    await sql`
      UPDATE posts SET
        title = ${body.title},
        date = ${body.date},
        excerpt = ${body.excerpt},
        image = ${body.image},
        category = ${body.category},
        featured = ${body.featured ?? false},
        content = ${body.content},
        status = ${body.status},
        slug = ${body.slug},
        updated_at = NOW(),
        version = COALESCE(version, 0) + 1
      WHERE id = ${id}
    `;

    const rows = (await sql`SELECT * FROM posts WHERE id = ${id}`) as DbRow[];
    const post = mapRow(rows[0]);

    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PUT /api/posts/:id failed:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing post ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await sql`DELETE FROM posts WHERE id = ${id}`;

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/posts/:id failed:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
