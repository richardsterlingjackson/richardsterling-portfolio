// Atomically set only one post as main featured
export async function setMainFeaturedPost(postId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/posts/set-main-featured", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
      credentials: "include",
      body: JSON.stringify({ postId }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Failed to set main featured post:", res.status, res.statusText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error setting main featured post:", err);
    return false;
  }
}
import type { BlogPost } from "@/data/posts";

const API = "/api/posts";

export type NewPostInput = Pick<
  BlogPost,
  "title" | "date" | "excerpt" | "image" | "category" | "featured" | "mainFeatured" | "content" | "status"
>;

export type NewPostPayload = NewPostInput & {
  slug?: string;
  scheduledAt?: string | null;
};

export type UpdatePostInput = {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean;
  mainFeatured: boolean;
  content: string;
  status: "draft" | "published";
  slug: string;
  scheduledAt?: string | null;
};

export async function getStoredPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(API, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch posts:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? (data as BlogPost[]) : [];
  } catch (err) {
    console.error("Error fetching posts:", err);
    return [];
  }
}

export async function savePost(
  post: NewPostPayload
): Promise<BlogPost | null> {
  try {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify(post),
      headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to save post:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    return data as BlogPost;
  } catch (err) {
    console.error("Error saving post:", err);
    return null;
  }
}

export async function updatePost(
  id: string,
  post: UpdatePostInput
): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API}?id=${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(post),
      headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to update post:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    return data as BlogPost;
  } catch (err) {
    console.error("Error updating post:", err);
    return null;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
      credentials: "include",
      cache: "no-store",
    });

    // Treat 204 No Content and other 2xx as success. Log body/text for failures.
    if (res.status === 204) return true;

    if (!res.ok) {
      let body = "";
      try {
        body = await res.text();
      } catch (e) {
        body = String(e);
      }
      console.error("Failed to delete post:", res.status, res.statusText, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error deleting post:", err);
    return false;
  }
}
