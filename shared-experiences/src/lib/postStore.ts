import type { BlogPost } from "@/data/posts";

const API = "/api/posts";

export async function getStoredPosts(): Promise<BlogPost[]> {
  const res = await fetch(API);
  return res.json();
}

export async function savePost(post: Omit<BlogPost, "id" | "slug">): Promise<void> {
  await fetch(API, {
    method: "POST",
    body: JSON.stringify(post),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updatePost(post: BlogPost): Promise<void> {
  await fetch(`${API}/${post.id}`, {
    method: "PUT",
    body: JSON.stringify(post),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deletePost(id: string): Promise<void> {
  await fetch(`${API}/${id}`, { method: "DELETE" });
}
