// POST /api/posts/set-main-featured
// Atomically sets only one post as main featured, unsets all others
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getAdminToken } from "../_utils/auth";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer /, "");
  if (!token || token !== getAdminToken()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  try {
    // Unset main_featured for all posts, then set for the selected one
    await sql`UPDATE posts SET main_featured = false WHERE main_featured = true;`;
    await sql`UPDATE posts SET main_featured = true WHERE id = ${postId};`;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update main feature" }, { status: 500 });
  }
}
