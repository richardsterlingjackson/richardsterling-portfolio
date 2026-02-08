import crypto from "crypto";

const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60; // 60 minutes

function getAdminToken(): string | null {
  return process.env.ADMIN_TOKEN || null;
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  header.split(";").forEach((part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return;
    out[rawKey] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

function signSession(exp: number, secret: string): string {
  return crypto.createHmac("sha256", secret).update(String(exp)).digest("hex");
}

function isSessionValid(value: string | undefined, secret: string): boolean {
  if (!value) return false;
  const [expStr, sig] = value.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp)) return false;
  if (exp <= Math.floor(Date.now() / 1000)) return false;
  const expected = signSession(exp, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

function getAuthHeaderToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("x-admin-token");
  if (!authHeader) return null;
  let token = authHeader;
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }
  return token || null;
}

function isSameOrigin(req: Request): boolean {
  const requestOrigin = new URL(req.url).origin;
  const origin = req.headers.get("origin");
  if (origin) return origin === requestOrigin;
  const referer = req.headers.get("referer");
  if (referer) return referer.startsWith(requestOrigin);
  return false;
}

export function isAdmin(req: Request): boolean {
  const adminToken = getAdminToken();
  if (!adminToken) return false;

  const headerToken = getAuthHeaderToken(req);
  if (headerToken && headerToken === adminToken) return true;

  const cookies = parseCookies(req.headers.get("cookie"));
  return isSessionValid(cookies[ADMIN_SESSION_COOKIE], adminToken);
}

export function checkAdmin(req: Request) {
  const adminToken = getAdminToken();

  if (!adminToken) {
    return new Response(JSON.stringify({ error: "Admin token not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headerToken = getAuthHeaderToken(req);
  if (headerToken) {
    if (headerToken === adminToken) return null;
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cookies = parseCookies(req.headers.get("cookie"));
  const sessionOk = isSessionValid(cookies[ADMIN_SESSION_COOKIE], adminToken);
  if (!sessionOk) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Basic CSRF guard when using cookie auth for non-safe methods.
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const hasAdminHeader = req.headers.get("x-admin-request") === "1";
    if (!hasAdminHeader && !isSameOrigin(req)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  return null;
}

export function createAdminSessionCookie(req: Request): string | null {
  const adminToken = getAdminToken();
  if (!adminToken) return null;

  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const value = `${exp}.${signSession(exp, adminToken)}`;
  const url = new URL(req.url);
  const secure = url.protocol === "https:" || process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  return [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearAdminSessionCookie(req: Request): string {
  const url = new URL(req.url);
  const secure = url.protocol === "https:" || process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  return [
    `${ADMIN_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
