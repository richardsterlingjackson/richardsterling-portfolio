import { sql } from "./db";
import { v4 as uuid } from "uuid";

export async function GET() {
  try {
    const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC`;
    return new Response(JSON.stringify(posts), { status: 200 });
  } catch (err) {
    console.error("GET /api/posts failed:", err);
    return new Response("Server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!req.body) return new Response("Missing request body", { status: 400 });

    const body = await req.json();

    // validate required fields
    const requiredFields = ["title", "date", "excerpt", "image", "category", "content", "status", "slug"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(`Missing field: ${field}`, { status: 400 });
      }
    }

    const id = uuid();

    await sql`
      INSERT INTO posts (
        id, title, date, excerpt, image, category, featured, content, status, slug
      ) VALUES (
        ${id},
        ${body.title},
        ${body.date},
        ${body.excerpt},
        ${body.image},
        ${body.category},
        ${body.featured ?? false}, -- default to false if undefined
        ${body.content},
        ${body.status},
        ${body.slug}
      )
    `;

    return new Response(JSON.stringify({ id }), { status: 201 });
  } catch (err) {
    console.error("POST /api/posts failed:", err);
    return new Response("Server error", { status: 500 });
  }
}
