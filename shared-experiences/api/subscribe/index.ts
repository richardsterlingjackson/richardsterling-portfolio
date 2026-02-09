// Subscribe API: stores subscriber preferences and sends welcome emails.
import { sql } from "../posts/db.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendWelcomeEmail } from "../_helpers/sendEmails.js";

type SubscriberRow = {
  id: string;
  email: string;
  category: string;
  created_at: string | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, category, categories } = req.body;

    // Validate email
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const allCategory = "All Categories";
    const inputCategories = Array.isArray(categories)
      ? categories.filter((c) => typeof c === "string")
      : typeof category === "string"
        ? [category]
        : [];

    const uniqueCategories = Array.from(new Set(inputCategories)).filter(Boolean);

    // Validate categories
    if (uniqueCategories.length === 0) {
      return res.status(400).json({ error: "At least one category is required" });
    }

    const useAll = uniqueCategories.includes(allCategory);
    const targetCategories = useAll ? [allCategory] : uniqueCategories;

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set. Subscription not saved to database.");
      // Still return success for UX, but log warning
      return res.status(200).json({ message: "Subscription received (database offline)" });
    }

    // Insert subscriber into database with category
    try {
      if (useAll) {
        await sql`
          DELETE FROM subscribers WHERE email = ${email} AND category != ${allCategory}
        `;
      } else {
        await sql`
          DELETE FROM subscribers WHERE email = ${email} AND category = ${allCategory}
        `;
      }

      const results: SubscriberRow[] = [];

      for (const cat of targetCategories) {
        const inserted = await sql`
          INSERT INTO subscribers (email, category, created_at)
          VALUES (${email}, ${cat}, NOW())
          ON CONFLICT DO NOTHING
          RETURNING id, email, category, created_at
        `;

        if (inserted.length) {
          results.push(inserted[0]);
          sendWelcomeEmail(email, cat).catch((err) =>
            console.error("Failed to send welcome email:", err)
          );
          continue;
        }

        const updatedSame = await sql`
          UPDATE subscribers
          SET updated_at = NOW()
          WHERE email = ${email} AND category = ${cat}
          RETURNING id, email, category, created_at
        `;

        if (updatedSame.length) {
          results.push(updatedSame[0]);
          continue;
        }
      }

      if (results.length) {
        return res.status(200).json({
          message: useAll ? "Subscribed to all categories" : "Successfully subscribed",
          subscribers: results,
        });
      }

      return res.status(500).json({ error: "Failed to subscribe" });
    } catch (dbErr: unknown) {
      const message = dbErr instanceof Error ? dbErr.message : "";
      // If table doesn't exist, still return success but log the error
      if (message.includes("does not exist")) {
        console.warn("Subscribers table does not exist. Create it with:", message);
        return res.status(200).json({ message: "Subscription received (table setup needed)" });
      }

      throw dbErr;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to subscribe";
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Failed to subscribe", details: message });
  }
}
