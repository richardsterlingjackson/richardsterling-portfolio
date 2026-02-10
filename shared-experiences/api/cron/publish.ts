// Cron endpoint: publishes scheduled posts and triggers subscriber emails.
export const runtime = "nodejs";

import { sql } from "../posts/db.js";
import { sendEmailsToSubscribers } from "../_helpers/sendEmails.js";
import type { BlogPost } from "../../src/data/posts";

type ScheduledPostRow = {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean;
  main_featured: boolean | null;
  content: string;
  status: "draft" | "published";
  created_at: string | null;
  updated_at: string | null;
  version: number | null;
  scheduled_at: string | null;
  likes_count: number | null;
  reads_count: number | null;
  hidden: boolean | null;
  article: boolean | null;
};

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
    `) as ScheduledPostRow[];

    for (const row of rows) {
      const post: BlogPost = {
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
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null,
        version: row.version ?? 1,
        scheduledAt: row.scheduled_at ?? null,
        likesCount: row.likes_count ?? 0,
        readsCount: row.reads_count ?? 0,
        hidden: row.hidden ?? false,
        article: row.article ?? false,
      };

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cron publish failed";
    console.error("Cron publish failed:", err);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
