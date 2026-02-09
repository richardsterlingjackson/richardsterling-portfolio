export const runtime = "nodejs";

import { sql } from "../posts/db.js";
import crypto from "crypto";

function getFingerprint(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { postId?: string; action?: "like" | "unlike" };
    const postId = body.postId;
    const action = body.action || "like";

    if (!postId) {
      return new Response(JSON.stringify({ error: "Missing postId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fingerprint = getFingerprint(req);

    const post = (await sql`
      SELECT id, likes_count FROM posts WHERE id = ${postId}
    `) as { id: string; likes_count: number | null }[];

    if (!post.length) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "unlike") {
      const removed = await sql`
        DELETE FROM post_likes
        WHERE post_id = ${postId} AND fingerprint = ${fingerprint}
        RETURNING id
      `;

      if (removed.length) {
        await sql`
          UPDATE posts
          SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
          WHERE id = ${postId}
        `;
      }
    } else {
      const inserted = await sql`
        INSERT INTO post_likes (post_id, fingerprint, created_at)
        VALUES (${postId}, ${fingerprint}, NOW())
        ON CONFLICT DO NOTHING
        RETURNING id
      `;

      if (inserted.length) {
        await sql`
          UPDATE posts
          SET likes_count = COALESCE(likes_count, 0) + 1
          WHERE id = ${postId}
        `;
      }
    }

    const updated = (await sql`
      SELECT likes_count FROM posts WHERE id = ${postId}
    `) as { likes_count: number | null }[];

    return new Response(
      JSON.stringify({
        likesCount: updated[0]?.likes_count ?? 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("POST /api/likes failed:", err);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
