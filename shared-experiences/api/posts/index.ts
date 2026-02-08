// api/posts/index.ts
export const runtime = "nodejs";

import { sql } from "./db.js";
import { checkAdmin, isAdmin } from "../_helpers/auth.js";
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

type HomeFeatured = {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCategory: string;
  cards: Array<{
    image: string;
    title: string;
    category: string;
    excerpt: string;
    date: string;
    link: string;
    readMoreLabel: string;
  }>;
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

async function ensureHomeFeaturedTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS home_featured (
        id integer PRIMARY KEY,
        hero_image text NOT NULL DEFAULT '',
        hero_title text NOT NULL DEFAULT '',
        hero_subtitle text NOT NULL DEFAULT '',
        hero_category text NOT NULL DEFAULT '',
        card1_image text NOT NULL DEFAULT '',
        card1_title text NOT NULL DEFAULT '',
        card1_category text NOT NULL DEFAULT '',
        card1_excerpt text NOT NULL DEFAULT '',
        card1_date text NOT NULL DEFAULT '',
        card1_link text NOT NULL DEFAULT '',
        card1_read_more text NOT NULL DEFAULT '',
        card2_image text NOT NULL DEFAULT '',
        card2_title text NOT NULL DEFAULT '',
        card2_category text NOT NULL DEFAULT '',
        card2_excerpt text NOT NULL DEFAULT '',
        card2_date text NOT NULL DEFAULT '',
        card2_link text NOT NULL DEFAULT '',
        card2_read_more text NOT NULL DEFAULT '',
        card3_image text NOT NULL DEFAULT '',
        card3_title text NOT NULL DEFAULT '',
        card3_category text NOT NULL DEFAULT '',
        card3_excerpt text NOT NULL DEFAULT '',
        card3_date text NOT NULL DEFAULT '',
        card3_link text NOT NULL DEFAULT '',
        card3_read_more text NOT NULL DEFAULT '',
        updated_at timestamptz DEFAULT now()
      )
    `;
  } catch (err) {
    console.warn("Failed to ensure home_featured table:", err);
  }
}

async function getHomeFeatured(): Promise<HomeFeatured | null> {
  try {
    await ensureHomeFeaturedTable();
    const rows = (await sql`
      SELECT * FROM home_featured WHERE id = 1 LIMIT 1
    `) as any[];
    const row = rows[0];
    if (!row) return null;
    return {
      heroImage: row.hero_image || "",
      heroTitle: row.hero_title || "",
      heroSubtitle: row.hero_subtitle || "",
      heroCategory: row.hero_category || "",
      cards: [
        {
          image: row.card1_image || "",
          title: row.card1_title || "",
          category: row.card1_category || "",
          excerpt: row.card1_excerpt || "",
          date: row.card1_date || "",
          link: row.card1_link || "",
          readMoreLabel: row.card1_read_more || "",
        },
        {
          image: row.card2_image || "",
          title: row.card2_title || "",
          category: row.card2_category || "",
          excerpt: row.card2_excerpt || "",
          date: row.card2_date || "",
          link: row.card2_link || "",
          readMoreLabel: row.card2_read_more || "",
        },
        {
          image: row.card3_image || "",
          title: row.card3_title || "",
          category: row.card3_category || "",
          excerpt: row.card3_excerpt || "",
          date: row.card3_date || "",
          link: row.card3_link || "",
          readMoreLabel: row.card3_read_more || "",
        },
      ],
    };
  } catch (err) {
    console.error("Failed to load home_featured:", err);
    return null;
  }
}

async function upsertHomeFeatured(payload: HomeFeatured) {
  await ensureHomeFeaturedTable();
  const cards = payload.cards ?? [];
  const c1 = cards[0] ?? { image: "", title: "", category: "", excerpt: "", date: "", link: "", readMoreLabel: "" };
  const c2 = cards[1] ?? { image: "", title: "", category: "", excerpt: "", date: "", link: "", readMoreLabel: "" };
  const c3 = cards[2] ?? { image: "", title: "", category: "", excerpt: "", date: "", link: "", readMoreLabel: "" };

  await sql`
    INSERT INTO home_featured (
      id,
      hero_image,
      hero_title,
      hero_subtitle,
      hero_category,
      card1_image,
      card1_title,
      card1_category,
      card1_excerpt,
      card1_date,
      card1_link,
      card1_read_more,
      card2_image,
      card2_title,
      card2_category,
      card2_excerpt,
      card2_date,
      card2_link,
      card2_read_more,
      card3_image,
      card3_title,
      card3_category,
      card3_excerpt,
      card3_date,
      card3_link,
      card3_read_more,
      updated_at
    ) VALUES (
      1,
      ${payload.heroImage || ""},
      ${payload.heroTitle || ""},
      ${payload.heroSubtitle || ""},
      ${payload.heroCategory || ""},
      ${c1.image || ""},
      ${c1.title || ""},
      ${c1.category || ""},
      ${c1.excerpt || ""},
      ${c1.date || ""},
      ${c1.link || ""},
      ${c1.readMoreLabel || ""},
      ${c2.image || ""},
      ${c2.title || ""},
      ${c2.category || ""},
      ${c2.excerpt || ""},
      ${c2.date || ""},
      ${c2.link || ""},
      ${c2.readMoreLabel || ""},
      ${c3.image || ""},
      ${c3.title || ""},
      ${c3.category || ""},
      ${c3.excerpt || ""},
      ${c3.date || ""},
      ${c3.link || ""},
      ${c3.readMoreLabel || ""},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      hero_image = EXCLUDED.hero_image,
      hero_title = EXCLUDED.hero_title,
      hero_subtitle = EXCLUDED.hero_subtitle,
      hero_category = EXCLUDED.hero_category,
      card1_image = EXCLUDED.card1_image,
      card1_title = EXCLUDED.card1_title,
      card1_category = EXCLUDED.card1_category,
      card1_excerpt = EXCLUDED.card1_excerpt,
      card1_date = EXCLUDED.card1_date,
      card1_link = EXCLUDED.card1_link,
      card1_read_more = EXCLUDED.card1_read_more,
      card2_image = EXCLUDED.card2_image,
      card2_title = EXCLUDED.card2_title,
      card2_category = EXCLUDED.card2_category,
      card2_excerpt = EXCLUDED.card2_excerpt,
      card2_date = EXCLUDED.card2_date,
      card2_link = EXCLUDED.card2_link,
      card2_read_more = EXCLUDED.card2_read_more,
      card3_image = EXCLUDED.card3_image,
      card3_title = EXCLUDED.card3_title,
      card3_category = EXCLUDED.card3_category,
      card3_excerpt = EXCLUDED.card3_excerpt,
      card3_date = EXCLUDED.card3_date,
      card3_link = EXCLUDED.card3_link,
      card3_read_more = EXCLUDED.card3_read_more,
      updated_at = NOW()
  `;
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const home = url.searchParams.get("home");
    if (home === "1") {
      const data = await getHomeFeatured();
      return new Response(JSON.stringify(data ?? null), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resolveSlug = url.searchParams.get("resolveSlug");
    if (resolveSlug) {
      try {
        const direct = (await sql`
          SELECT slug FROM posts WHERE slug = ${resolveSlug} AND status = 'published' LIMIT 1
        `) as { slug: string }[];

        if (direct.length) {
          return new Response(JSON.stringify({ slug: direct[0].slug, isAlias: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        const aliasRows = (await sql`
          SELECT p.slug AS canonical
          FROM post_slug_aliases a
          JOIN posts p ON p.id = a.post_id
          WHERE a.slug = ${resolveSlug} AND p.status = 'published'
          LIMIT 1
        `) as { canonical: string }[];

        if (aliasRows.length) {
          return new Response(
            JSON.stringify({ slug: aliasRows[0].canonical, isAlias: true }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        const message = err?.message || "";
        if (message.includes("post_slug_aliases") && message.includes("does not exist")) {
          return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        console.error("GET /api/posts resolveSlug failed:", err);
        return new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const admin = isAdmin(req);
    const rows = admin
      ? ((await sql`
          SELECT * FROM posts ORDER BY created_at DESC
        `) as DbRow[])
      : ((await sql`
          SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC
        `) as DbRow[]);

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
    const url = new URL(req.url);
    const home = url.searchParams.get("home");
    if (home === "1") {
      const payload = (await req.json()) as HomeFeatured;
      await upsertHomeFeatured(payload);
      const updated = await getHomeFeatured();
      return new Response(JSON.stringify(updated ?? null), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

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
