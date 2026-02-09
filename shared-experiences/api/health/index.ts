// Health check: verifies DB connectivity and table presence.
export const runtime = "nodejs";

import { sql } from "../posts/db.js";
import { checkAdmin } from "../_helpers/auth.js";

export async function GET(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  try {
    const result = await sql`
      SELECT
        current_database() AS db,
        to_regclass('public.posts') AS posts_table,
        to_regclass('public.subscribers') AS subscribers_table
    `;

    const row = result[0] || {};

    return new Response(
      JSON.stringify({
        ok: true,
        database: row.db ?? null,
        postsTable: row.posts_table ?? null,
        subscribersTable: row.subscribers_table ?? null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Health check failed";
    console.error("GET /api/health failed:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
