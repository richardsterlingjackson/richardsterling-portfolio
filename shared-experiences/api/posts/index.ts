// api/posts/index.ts
export const runtime = "nodejs";

import { sql } from "./db.js";
import { checkAdmin } from "../_helpers/auth.js";
import { sendEmailsToSubscribers, sendUpdateEmailToSubscribers } from "../_helpers/sendEmails.js";
import { v4 as uuid } from "uuid";

// posts table: featured and main_featured both default to false in the DB
type DbRow = {
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
};

type CreateBody = {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean;
  mainFeatured?: boolean;
  content: string;
  status: "draft" | "published";
  slug?: string;
  scheduledAt?: string | null;
};

type UpdateBody = {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean;
  mainFeatured?: boolean;
  content: string;
  status: "draft" | "published";
  slug?: string;
  scheduledAt?: string | null;
};

function mapRow(row: DbRow) {
  return {
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    scheduledAt: row.scheduled_at,
    likesCount: row.likes_count ?? 0,
    readsCount: row.reads_count ?? 0,
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureSlugAliasTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS post_slug_aliases (
        slug text PRIMARY KEY,
        post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at timestamptz DEFAULT now()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS post_slug_aliases_post_id_idx
      ON post_slug_aliases (post_id)
    `;
  } catch (err) {
    console.warn("Failed to ensure post_slug_aliases table:", err);
  }
}

async function isSlugTaken(slug: string, excludePostId?: string): Promise<boolean> {
  const postRows = excludePostId
    ? ((await sql`
        SELECT id FROM posts WHERE slug = ${slug} AND id != ${excludePostId} LIMIT 1
      `) as { id: string }[])
    : ((await sql`
        SELECT id FROM posts WHERE slug = ${slug} LIMIT 1
      `) as { id: string }[]);

  if (postRows.length) return true;

  try {
    await ensureSlugAliasTable();
    const aliasRows = (await sql`
      SELECT post_id FROM post_slug_aliases WHERE slug = ${slug} LIMIT 1
    `) as { post_id: string }[];
    if (aliasRows.length && aliasRows[0]?.post_id !== excludePostId) return true;
  } catch (err) {
    console.warn("Slug alias check failed:", err);
  }

  return false;
}

export async function GET() {
  try {
    const rows = (await sql`
      SELECT * FROM posts ORDER BY created_at DESC
    `) as DbRow[];

    const posts = rows.map(mapRow);

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/posts failed:", err);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function getId(req: Request): string | null {
  const url = new URL(req.url);
  return url.searchParams.get("id");
}

export async function PUT(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  try {
    const id = getId(req);

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing post ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentRows = (await sql`
      SELECT id, slug FROM posts WHERE id = ${id} LIMIT 1
    `) as { id: string; slug: string }[];

    if (!currentRows.length) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentSlug = currentRows[0].slug;

    const body = (await req.json()) as UpdateBody;

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    const shouldSchedule = scheduledAt ? scheduledAt.getTime() > Date.now() : false;

    const requiredFields: (keyof UpdateBody)[] = [
      "title",
      "date",
      "excerpt",
      "image",
      "category",
      "content",
      "status",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(JSON.stringify({ error: `Missing field: ${field}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const slug = body.slug && typeof body.slug === "string" ? body.slug : slugify(body.title);

    const slugTaken = await isSlugTaken(slug, id);
    if (slugTaken) {
      return new Response(JSON.stringify({ error: "Slug already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    let result: DbRow[] = [];
    try {
      result = (await sql`
        UPDATE posts SET
          title = ${body.title},
          date = ${body.date},
          excerpt = ${body.excerpt},
          image = ${body.image},
          category = ${body.category},
          featured = ${body.featured ?? false},
          main_featured = ${body.mainFeatured ?? false},
          content = ${body.content},
          status = ${shouldSchedule ? "draft" : body.status},
          slug = ${slug},
          scheduled_at = ${shouldSchedule ? scheduledAt : null},
          updated_at = NOW(),
          version = COALESCE(version, 0) + 1
        WHERE id = ${id}
        RETURNING *
      `) as DbRow[];
    } catch (err: any) {
      const message = err?.message || "";
      if (message.includes("scheduled_at") || message.includes("main_featured")) {
        console.warn("Missing posts columns; updating without scheduling/main_featured.");
        result = (await sql`
          UPDATE posts SET
            title = ${body.title},
            date = ${body.date},
            excerpt = ${body.excerpt},
            image = ${body.image},
            category = ${body.category},
            featured = ${body.featured ?? false},
            content = ${body.content},
            status = ${body.status},
            slug = ${slug},
            updated_at = NOW(),
            version = COALESCE(version, 0) + 1
          WHERE id = ${id}
          RETURNING *
        `) as DbRow[];
      } else {
        throw err;
      }
    }

    if (!result.length) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedPost = mapRow(result[0]);

    if (currentSlug && currentSlug !== slug) {
      try {
        await ensureSlugAliasTable();
        await sql`
          INSERT INTO post_slug_aliases (slug, post_id)
          VALUES (${currentSlug}, ${id})
          ON CONFLICT (slug) DO NOTHING
        `;
      } catch (err) {
        console.warn("Failed to save slug alias:", err);
      }
    }

    if (updatedPost.status === "published") {
      sendUpdateEmailToSubscribers(updatedPost as any).catch((err) =>
        console.error("Failed to send subscriber update emails:", err)
      );
    }

    return new Response(JSON.stringify(updatedPost), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const message = err?.message || "Server error";
    console.error("PUT /api/posts failed:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  try {
    const id = getId(req);

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing post ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = (await sql`
      DELETE FROM posts WHERE id = ${id} RETURNING id
    `) as { id: string }[];

    if (!result.length) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  } catch (err: any) {
    const message = err?.message || "Server error";
    console.error("DELETE /api/posts failed:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  try {
    const body = (await req.json()) as CreateBody;

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    const shouldSchedule = scheduledAt ? scheduledAt.getTime() > Date.now() : false;

    const requiredFields: (keyof CreateBody)[] = [
      "title",
      "date",
      "excerpt",
      "image",
      "category",
      "content",
      "status",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(`Missing field: ${field}`, { status: 400 });
      }
    }

    const id = uuid();
    const baseSlug =
      body.slug && typeof body.slug === "string"
        ? body.slug
        : slugify(body.title);

    let slug = baseSlug;
    if (await isSlugTaken(slug)) {
      slug = `${baseSlug}-${id.slice(0, 6)}`;
    }

    try {
      await sql`
        INSERT INTO posts (
          id,
          title,
          date,
          excerpt,
          image,
          category,
          featured,
          main_featured,
          content,
          status,
          slug,
          created_at,
          updated_at,
          version,
          scheduled_at,
          likes_count,
          reads_count
        ) VALUES (
          ${id},
          ${body.title},
          ${body.date},
          ${body.excerpt},
          ${body.image},
          ${body.category},
          ${body.featured ?? false},
          ${body.mainFeatured ?? false},
          ${body.content},
          ${shouldSchedule ? "draft" : body.status},
          ${slug},
          NOW(),
          NOW(),
          1,
          ${shouldSchedule ? scheduledAt : null},
          0,
          0
        )
      `;
    } catch (err: any) {
      const message = err?.message || "";
      if (message.includes("main_featured") || message.includes("scheduled_at") || message.includes("likes_count") || message.includes("reads_count")) {
        console.warn("Missing posts columns; inserting without scheduling/likes/reads.");
        await sql`
          INSERT INTO posts (
            id,
            title,
            date,
            excerpt,
            image,
            category,
            featured,
            content,
            status,
            slug,
            created_at,
            updated_at,
            version
          ) VALUES (
            ${id},
            ${body.title},
            ${body.date},
            ${body.excerpt},
            ${body.image},
            ${body.category},
            ${body.featured ?? false},
            ${body.content},
            ${body.status},
            ${slug},
            NOW(),
            NOW(),
            1
          )
        `;
      } else {
        throw err;
      }
    }

    const rows = (await sql`
      SELECT * FROM posts WHERE id = ${id}
    `) as DbRow[];

    const post = rows.length ? mapRow(rows[0]) : null;

    // Send emails to subscribers if post is published
    if (post && body.status === "published" && !shouldSchedule) {
      sendEmailsToSubscribers({
        id: post.id,
        slug: post.slug,
        title: post.title,
        date: post.date,
        excerpt: post.excerpt,
        image: post.image,
        category: post.category,
        featured: post.featured,
        mainFeatured: post.mainFeatured,
        content: post.content,
        status: post.status,
      } as any).catch((err) => {
        console.error("Failed to send subscriber emails for new post:", err);
        // Don't fail the request if email sending fails
      });
    }

    return new Response(JSON.stringify(post), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const message = err?.message || "Server error";
    console.error("POST /api/posts failed:", err);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
