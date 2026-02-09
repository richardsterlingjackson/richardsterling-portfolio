export const runtime = "nodejs";

import { sql } from "../posts/db.js";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { postId?: string };
    const postId = body.postId;

    if (!postId) {
      return new Response(JSON.stringify({ error: "Missing postId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updated = (await sql`
      UPDATE posts
      SET reads_count = COALESCE(reads_count, 0) + 1
      WHERE id = ${postId}
      RETURNING reads_count
    `) as { reads_count: number | null }[];

    if (!updated.length) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ readsCount: updated[0]?.reads_count ?? 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    if (message.includes("reads_count")) {
      return new Response(JSON.stringify({ readsCount: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("POST /api/reads failed:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
