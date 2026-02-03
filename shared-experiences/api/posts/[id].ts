import { sql } from "../lib/db";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(req: Request, context: Context) {
  const rows = await sql`SELECT * FROM posts WHERE id = ${context.params.id}`;
  return new Response(JSON.stringify(rows[0] || null), { status: 200 });
}

export async function PUT(req: Request, context: Context) {
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
    WHERE id = ${context.params.id}
  `;

  return new Response("Updated", { status: 200 });
}

export async function DELETE(req: Request, context: Context) {
  await sql`DELETE FROM posts WHERE id = ${context.params.id}`;
  return new Response("Deleted", { status: 200 });
}
