export const runtime = "nodejs";

import { sql } from "../posts/db.js";
import { sendEmailsToSubscribers } from "../_helpers/sendEmails.js";

export async function GET(req: Request) {
  const cronHeader = req.headers.get("x-vercel-cron");
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (secret) {
    if (!auth || auth !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else if (!cronHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const rows = (await sql`
      UPDATE posts
      SET status = 'published',
          updated_at = NOW(),
          scheduled_at = NULL
      WHERE status = 'draft'
        AND scheduled_at IS NOT NULL
        AND scheduled_at <= NOW()
      RETURNING *
    `) as any[];

    for (const row of rows) {
      const post = {
        id: row.id,
        slug: row.slug,
        title: row.title,
        date: row.date,
        excerpt: row.excerpt,
        image: row.image,
        category: row.category,
        featured: row.featured,
        mainFeatured: row.main_featured ?? false,
        content: row.content,
        status: row.status,
      } as any;

      sendEmailsToSubscribers(post).catch((err) =>
        console.error("Failed to send scheduled post emails:", err)
      );
    }

    return new Response(
      JSON.stringify({ published: rows.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Cron publish failed:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Cron publish failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
