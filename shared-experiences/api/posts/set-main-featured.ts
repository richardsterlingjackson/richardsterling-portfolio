// POST /api/posts/set-main-featured
// Atomically sets only one post as main featured, unsets all others (single DB round-trip for cross-browser consistency)
export const runtime = "nodejs";

import { sql } from "./db.js";
import { checkAdmin } from "../_helpers/auth.js";

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const postId = typeof body === "object" && body !== null && "postId" in body
    ? (body as { postId?: unknown }).postId
    : undefined;
  if (!postId || typeof postId !== "string") {
    return jsonResponse({ error: "Missing postId" }, 400);
  }

  try {
    // Atomic: unset all, then set only this post (single request = consistent across all browsers)
    await sql`UPDATE posts SET main_featured = false WHERE main_featured = true`;
    await sql`UPDATE posts SET main_featured = true WHERE id = ${postId}`;
    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error("set-main-featured error:", err);
    return jsonResponse({ error: "Failed to update main feature" }, 500);
  }
}
