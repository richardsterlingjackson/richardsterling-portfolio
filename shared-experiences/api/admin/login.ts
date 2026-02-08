export const runtime = "nodejs";

import { createAdminSessionCookie } from "../_helpers/auth.js";

type RateEntry = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimit = new Map<string, RateEntry>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many attempts" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as { token?: string };
    const token = body?.token?.trim();
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken) {
      return new Response(JSON.stringify({ error: "Admin token not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!token || token !== adminToken) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    rateLimit.delete(ip);

    const cookie = createAdminSessionCookie(req);
    if (!cookie) {
      return new Response(JSON.stringify({ error: "Failed to create session" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("POST /api/admin/login failed:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
