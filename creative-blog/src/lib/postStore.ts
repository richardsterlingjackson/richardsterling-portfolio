import type { BlogPost } from "@/data/posts";
import { v4 as uuid } from "uuid";

const STORAGE_KEY = "creative_blog-posts";
const BACKUP_KEY = "creative_blog-backups";

export const slugify = (title: string): string =>
  encodeURIComponent(title.trim().toLowerCase().replace(/\s+/g, "-"));

export const slugifyCategory = (category: string): string =>
  encodeURIComponent(category.trim().toLowerCase().replace(/\s+/g, "-"));

function parseStoredPosts(raw: string | null): BlogPost[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) throw new Error("Invalid post data");

    return parsed.map((p: any): BlogPost => ({
      ...p,
      featured: !!p.featured,
      slug: p.slug || slugify(p.title),
    }));
  } catch (error) {
    console.error("Failed to parse stored posts:", error);
    return [];
  }
}

export function getStoredPosts(): BlogPost[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return parseStoredPosts(raw);
}

export function savePost(post: Omit<BlogPost, "id" | "slug">): void {
  const posts = getStoredPosts();
  const newPost: BlogPost = {
    ...post,
    id: uuid(),
    slug: slugify(post.title),
    featured: !!post.featured,
  };

  const updatedPosts = newPost.featured
    ? posts.map((p) => ({ ...p, featured: false }))
    : posts;

  localStorage.setItem(STORAGE_KEY, JSON.stringify([newPost, ...updatedPosts]));
  backupPost(newPost);
}

export function updatePost(updated: BlogPost): void {
  const posts = getStoredPosts();

  const normalized = updated.featured
    ? posts.map((p) => ({ ...p, featured: false }))
    : posts;

  const newPosts = normalized.map((p) =>
    p.id === updated.id
      ? {
          ...updated,
          slug: slugify(updated.title),
          featured: !!updated.featured,
        }
      : p
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosts));
  backupPost(updated);
}

export function deletePost(id: string): void {
  const posts = getStoredPosts();
  const updated = posts.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function backupPost(post: BlogPost): void {
  const raw = localStorage.getItem(BACKUP_KEY);
  const backups = raw ? JSON.parse(raw) : [];
  localStorage.setItem(BACKUP_KEY, JSON.stringify([...backups, post]));
}

export function restoreBackups(): BlogPost[] {
  const raw = localStorage.getItem(BACKUP_KEY);
  const backups = raw ? JSON.parse(raw) : [];
  backups.forEach((post: BlogPost) => updatePost(post));
  localStorage.removeItem(BACKUP_KEY);
  return getStoredPosts();
}
