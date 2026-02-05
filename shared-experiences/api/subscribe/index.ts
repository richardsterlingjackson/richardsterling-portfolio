import { sql } from "../posts/db.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendWelcomeEmail } from "../_helpers/sendEmails";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, category } = req.body;

    // Validate email
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate category
    if (!category || typeof category !== "string") {
      return res.status(400).json({ error: "Category is required" });
    }

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set. Subscription not saved to database.");
      // Still return success for UX, but log warning
      return res.status(200).json({ message: "Subscription received (database offline)" });
    }

    // Insert subscriber into database with category
    try {
      const result = await sql`
        INSERT INTO subscribers (email, category, created_at)
        VALUES (${email}, ${category}, NOW())
        ON CONFLICT (email, category) DO UPDATE SET updated_at = NOW()
        RETURNING id, email, category, created_at
      `;

      // Send welcome email asynchronously (don't wait for it to complete)
      sendWelcomeEmail(email, category).catch((err) =>
        console.error("Failed to send welcome email:", err)
      );

      return res.status(200).json({
        message: "Successfully subscribed",
        subscriber: result[0],
      });
    } catch (dbErr: any) {
      // If table doesn't exist, still return success but log the error
      if (dbErr?.message?.includes("does not exist")) {
        console.warn("Subscribers table does not exist. Create it with:", dbErr.message);
        return res.status(200).json({ message: "Subscription received (table setup needed)" });
      }

      throw dbErr;
    }
  } catch (err: any) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Failed to subscribe", details: err.message });
  }
}
