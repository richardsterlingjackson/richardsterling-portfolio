export const runtime = "nodejs";

import { sql } from "../posts/db.js";
import crypto from "crypto";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function htmlResponse(message: string, status = 200): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe</title></head><body style="font-family: Arial, sans-serif; padding: 24px;"><p>${message}</p></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim();
  const token = (url.searchParams.get("token") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();

  if (!email || !isValidEmail(email)) {
    return htmlResponse("Invalid unsubscribe request.", 400);
  }

  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    return htmlResponse("Unsubscribe is not configured.", 500);
  }

  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  if (!token || !timingSafeEqual(token, expected)) {
    return htmlResponse("Invalid or expired unsubscribe link.", 403);
  }

  try {
    if (category && category.toLowerCase() !== "all") {
      await sql`
        DELETE FROM subscribers WHERE email = ${email} AND category = ${category}
      `;
      return htmlResponse(`You have been unsubscribed from ${category}.`);
    }

    await sql`
      DELETE FROM subscribers WHERE email = ${email}
    `;

    return htmlResponse("You have been unsubscribed from all categories.");
  } catch (err) {
    console.error("Unsubscribe failed:", err);
    return htmlResponse("Unsubscribe failed. Please try again later.", 500);
  }
}
