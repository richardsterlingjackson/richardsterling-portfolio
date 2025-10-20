import { useLocation } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost as BlogPostType } from "@/data/posts";
import Sidebar from "@/components/Sidebar";
import BlogPost from "@/components/BlogPost";
import Header from "@/components/Header";

export function SearchResults() {
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search).get("q")?.toLowerCase() || "", [search]);
  const [posts, setPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    setPosts(getStoredPosts());
  }, []);

  useEffect(() => {
    document.title = query
      ? `Search: “${query}” – Creative Blog`
      : "Search – Creative Blog";
  }, [query]);

  const filtered = useMemo(() => {
    return posts.filter((post) =>
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query)
    );
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
                Search Results for “{query}”
              </h1>
              {filtered.length === 0 ? (
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
            © 2025 creative-blog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
