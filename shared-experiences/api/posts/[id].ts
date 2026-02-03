import { sql } from "../lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // get last segment as ID
  const rows = await sql`SELECT * FROM posts WHERE id = ${id}`;
  return new Response(JSON.stringify(rows[0] || null), { status: 200 });
}

export async function PUT(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // get last segment as ID
  const body = await req.json();

  await sql`
    UPDATE posts SET
      title = ${body.title},
      date = ${body.date},
      excerpt = ${body.excerpt},
      image = ${body.image},
      category = ${body.category},
      featured = ${body.featured},
      content = ${body.content},
      status = ${body.status},
      slug = ${body.slug},
      updated_at = NOW(),
      version = version + 1
    WHERE id = ${id}
  `;

  return new Response("Updated", { status: 200 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // get last segment as ID
  await sql`DELETE FROM posts WHERE id = ${id}`;
  return new Response("Deleted", { status: 200 });
}
