export const runtime = "nodejs";

import { clearAdminSessionCookie } from "../_helpers/auth.js";

export async function POST(req: Request) {
  const cookie = clearAdminSessionCookie(req);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
      "Cache-Control": "no-store",
    },
  });
}
