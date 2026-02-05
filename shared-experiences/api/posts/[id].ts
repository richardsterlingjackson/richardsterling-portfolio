export const runtime = "nodejs";

import { sql } from "./db.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type DbRow = {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean;
  content: string;
  status: "draft" | "published";
  created_at: string | null;
  updated_at: string | null;
  version: number | null;
};

type UpdateBody = {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean;
  content: string;
  status: "draft" | "published";
  slug: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

function getId(req: VercelRequest): string | null {
  const raw = req.query?.id;
  if (Array.isArray(raw)) return raw[0] || null;
  if (typeof raw === "string") return raw;
  return null;
}

function getAuthError(req: VercelRequest): { status: number; body: { error: string } } | null {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return { status: 500, body: { error: "Admin token not configured" } };
  }

  const authHeader = req.headers?.authorization || req.headers?.["x-admin-token"];
  if (!authHeader) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (token !== adminToken) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  return null;
}

function parseBody(req: VercelRequest): UpdateBody {
  if (typeof req.body === "string") return JSON.parse(req.body) as UpdateBody;
  return req.body as UpdateBody;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = getId(req);

  if (!id) {
    return res.status(400).json({ error: "Missing post ID" });
  }

  try {
    if (req.method === "GET") {
      const rows = (await sql`
        SELECT * FROM posts WHERE id = ${id}
      `) as DbRow[];

      if (!rows.length) {
        return res.status(404).json({ error: "Post not found" });
      }

      return res.status(200).json(mapRow(rows[0]));
    }

    if (req.method === "PUT") {
      const authErr = getAuthError(req);
      if (authErr) return res.status(authErr.status).json(authErr.body);

      const body = parseBody(req);
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
          return res.status(400).json({ error: `Missing field: ${field}` });
        }
      }

      const slug = body.slug && typeof body.slug === "string"
        ? body.slug
        : slugify(body.title);

      const existing = (await sql`
        SELECT id FROM posts WHERE slug = ${slug} AND id != ${id} LIMIT 1
      `) as { id: string }[];

      if (existing.length) {
        return res.status(409).json({ error: "Slug already exists" });
      }

      const result = (await sql`
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

      if (!result.length) {
        return res.status(404).json({ error: "Post not found" });
      }

      return res.status(200).json(mapRow(result[0]));
    }

    if (req.method === "DELETE") {
      const authErr = getAuthError(req);
      if (authErr) return res.status(authErr.status).json(authErr.body);

      const result = (await sql`
        DELETE FROM posts WHERE id = ${id} RETURNING id
      `) as { id: string }[];

      if (!result.length) {
        return res.status(404).json({ error: "Post not found" });
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err: any) {
    const message = err?.message || "Server error";
    console.error("/api/posts/:id failed:", err);
    return res.status(500).json({ error: message });
  }
}

