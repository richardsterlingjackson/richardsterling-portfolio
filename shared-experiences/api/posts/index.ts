// api/posts/index.ts
export const runtime = "nodejs";

import { sql } from "./db.js";
import { checkAdmin } from "../_helpers/auth.js";
import { sendEmailsToSubscribers } from "../_helpers/sendEmails.js";
import { v4 as uuid } from "uuid";

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

type CreateBody = {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean;
  content: string;
  status: "draft" | "published";
  slug?: string;
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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET() {
  try {
    const rows = (await sql`
      SELECT * FROM posts ORDER BY created_at DESC
    `) as DbRow[];

    const posts = rows.map(mapRow);

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/posts failed:", err);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  try {
    const body = (await req.json()) as CreateBody;

    const requiredFields: (keyof CreateBody)[] = [
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
        return new Response(`Missing field: ${field}`, { status: 400 });
      }
    }

    const id = uuid();
    const slug =
      body.slug && typeof body.slug === "string"
        ? body.slug
        : slugify(body.title);

    await sql`
      INSERT INTO posts (
        id,
        title,
        date,
        excerpt,
        image,
        category,
        featured,
        content,
        status,
        slug,
        created_at,
        updated_at,
        version
      ) VALUES (
        ${id},
        ${body.title},
        ${body.date},
        ${body.excerpt},
        ${body.image},
        ${body.category},
        ${body.featured ?? false},
        ${body.content},
        ${body.status},
        ${slug},
        NOW(),
        NOW(),
        1
      )
    `;

    const rows = (await sql`
      SELECT * FROM posts WHERE id = ${id}
    `) as DbRow[];

    const post = rows.length ? mapRow(rows[0]) : null;

    // Send emails to subscribers if post is published
    if (post && body.status === "published") {
      sendEmailsToSubscribers({
        id: post.id,
        slug: post.slug,
        title: post.title,
        date: post.date,
        excerpt: post.excerpt,
        image: post.image,
        category: post.category,
        featured: post.featured,
        content: post.content,
        status: post.status,
      } as any).catch((err) => {
        console.error("Failed to send subscriber emails for new post:", err);
        // Don't fail the request if email sending fails
      });
    }

    return new Response(JSON.stringify(post), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("POST /api/posts failed:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
