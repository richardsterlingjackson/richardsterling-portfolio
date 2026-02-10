// Search page: filters posts by query string and renders results.
import { useLocation } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost as BlogPostType } from "@/data/posts";
import Sidebar from "@/components/Sidebar";
import BlogPost from "@/components/BlogPost";
import Header from "@/components/Header";

export function SearchResults() {
  const { search } = useLocation();

  //
  // EXTRACT QUERY
  //
  const query = useMemo(() => {
    const value = new URLSearchParams(search).get("q");
    return value ? value.toLowerCase().trim() : "";
  }, [search]);

  const [posts, setPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

  //
  // LOAD POSTS
  //
  useEffect(() => {
    async function loadPosts() {
      try {
        const storedPosts = await getStoredPosts();
        setPosts(Array.isArray(storedPosts) ? storedPosts : []);
      } catch (err) {
        console.error("Failed to load posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  //
  // DOCUMENT TITLE
  //
  useEffect(() => {
    document.title = query
      ? `Search: “${query}” – Shared Experiences`
      : "Search – Shared Experiences";
  }, [query]);

  //
  // FILTER POSTS
  //
  const filtered = useMemo(() => {
    if (!query) return [];

    return posts.filter((post) => {
      const title = post.title?.toLowerCase() || "";
      return (
        post.status === "published" &&
        !post.hidden &&
        !post.article &&
        title.includes(query)
      );
    });
  }, [posts, query]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <Sidebar />
          </div>

          <div className="lg:col-span-9 space-y-12">
            <div>
              <h1 className="font-playfair text-2xl font-semibold mb-6 text-elegant-text uppercase tracking-wide">
                Search Results for “{query || "…" }”
              </h1>

              {loading ? (
                <p className="text-muted-foreground">Searching…</p>
              ) : filtered.length === 0 ? (
                <p className="text-muted-foreground">No results found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filtered.map((post) => (
                    <BlogPost key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Shared Experiences. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
