import { sql } from "../lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC`;
  return new Response(JSON.stringify(posts), { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const id = uuid();

  await sql`
    INSERT INTO posts (id, title, date, excerpt, image, category, featured, content, status, slug)
    VALUES (${id}, ${body.title}, ${body.date}, ${body.excerpt}, ${body.image}, ${body.category}, ${body.featured}, ${body.content}, ${body.status}, ${body.slug})
  `;

  return new Response(JSON.stringify({ id }), { status: 201 });
}
