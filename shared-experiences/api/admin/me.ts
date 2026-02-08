export const runtime = "nodejs";

import { checkAdmin } from "../_helpers/auth.js";

export async function GET(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
