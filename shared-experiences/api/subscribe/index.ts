import { sql } from "../posts/db.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendWelcomeEmail } from "../_helpers/sendEmails.js";

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
      const inserted = await sql`
        INSERT INTO subscribers (email, category, created_at)
        VALUES (${email}, ${category}, NOW())
        ON CONFLICT DO NOTHING
        RETURNING id, email, category, created_at
      `;

      if (inserted.length) {
        // Send welcome email asynchronously (don't wait for it to complete)
        sendWelcomeEmail(email, category).catch((err) =>
          console.error("Failed to send welcome email:", err)
        );

        return res.status(200).json({
          message: "Successfully subscribed",
          subscriber: inserted[0],
        });
      }

      const updatedSame = await sql`
        UPDATE subscribers
        SET updated_at = NOW()
        WHERE email = ${email} AND category = ${category}
        RETURNING id, email, category, created_at
      `;

      if (updatedSame.length) {
        return res.status(200).json({
          message: "Already subscribed",
          subscriber: updatedSame[0],
        });
      }

      const updatedEmail = await sql`
        UPDATE subscribers
        SET category = ${category}, updated_at = NOW()
        WHERE email = ${email}
        RETURNING id, email, category, created_at
      `;

      if (updatedEmail.length) {
        // Treat category change as a new subscription for messaging.
        sendWelcomeEmail(email, category).catch((err) =>
          console.error("Failed to send welcome email:", err)
        );

        return res.status(200).json({
          message: "Subscription updated",
          subscriber: updatedEmail[0],
        });
      }

      return res.status(500).json({ error: "Failed to subscribe" });
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
