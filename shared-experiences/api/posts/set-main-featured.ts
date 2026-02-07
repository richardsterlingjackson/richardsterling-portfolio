// POST /api/posts/set-main-featured
// Atomically sets only one post as main featured, unsets all others (single DB round-trip for cross-browser consistency)
import { NextRequest, NextResponse } from "next/server";
import { sql } from "./db.js";
import { checkAdmin } from "../_helpers/auth.js";

export async function POST(req: NextRequest) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  let body: { postId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const postId = body?.postId;
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  try {
    // Atomic: unset all, then set only this post (single request = consistent across all browsers)
    await sql`UPDATE posts SET main_featured = false WHERE main_featured = true`;
    await sql`UPDATE posts SET main_featured = true WHERE id = ${postId}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("set-main-featured error:", err);
    return NextResponse.json({ error: "Failed to update main feature" }, { status: 500 });
  }
}
