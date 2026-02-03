import type { BlogPost } from "@/data/posts";

const API = "/api/posts";

export async function getStoredPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(API);
    if (!res.ok) {
      console.error("Failed to fetch posts:", res.statusText);
      return [];
    }
    const data = await res.json();
    // Ensure it's an array
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching posts:", err);
    return [];
  }
}

export async function savePost(post: Omit<BlogPost, "id" | "slug">): Promise<void> {
  try {
    await fetch(API, {
      method: "POST",
      body: JSON.stringify(post),
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error saving post:", err);
  }
}

export async function updatePost(post: BlogPost): Promise<void> {
  try {
    await fetch(`${API}/${post.id}`, {
      method: "PUT",
      body: JSON.stringify(post),
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error updating post:", err);
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    await fetch(`${API}/${id}`, { method: "DELETE" });
  } catch (err) {
    console.error("Error deleting post:", err);
  }
}
