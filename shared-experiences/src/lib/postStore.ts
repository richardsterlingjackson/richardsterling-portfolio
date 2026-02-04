import type { BlogPost } from "@/data/posts";

const API = "/api/posts";

export type NewPostInput = Pick<
  BlogPost,
  "title" | "date" | "excerpt" | "image" | "category" | "featured" | "content" | "status"
>;

export type UpdatePostInput = {
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

export async function getStoredPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(API, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
  post: NewPostInput
): Promise<BlogPost | null> {
  try {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify(post),
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      body: JSON.stringify(post),
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok && res.status !== 204) {
      console.error("Failed to delete post:", res.status, res.statusText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error deleting post:", err);
    return false;
  }
}
