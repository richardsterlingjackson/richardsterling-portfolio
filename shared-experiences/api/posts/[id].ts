import { sql } from "../lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) return new Response("Missing post ID", { status: 400 });

    const rows = await sql`SELECT * FROM posts WHERE id = ${id}`;
    return new Response(JSON.stringify(rows[0] || null), { status: 200 });
  } catch (err) {
    console.error("GET /api/posts/:id failed:", err);
    return new Response("Server error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) return new Response("Missing post ID", { status: 400 });

    const body = await req.json();
    if (!body) return new Response("Missing request body", { status: 400 });

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
        version = version + 1
      WHERE id = ${id}
    `;

    return new Response("Updated", { status: 200 });
  } catch (err) {
    console.error("PUT /api/posts/:id failed:", err);
    return new Response("Server error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) return new Response("Missing post ID", { status: 400 });

    await sql`DELETE FROM posts WHERE id = ${id}`;
    return new Response("Deleted", { status: 200 });
  } catch (err) {
    console.error("DELETE /api/posts/:id failed:", err);
    return new Response("Server error", { status: 500 });
  }
}
