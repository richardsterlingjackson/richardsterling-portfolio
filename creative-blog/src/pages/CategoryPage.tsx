import { useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BlogPost from "@/components/BlogPost";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost as BlogPostType } from "@/data/posts";
import { categories } from "@/data/categories";

export default function CategoryPage() {
  const { categoryId } = useParams();

  const label = useMemo(() => {
    const match = categories.find((c) => c.slug === categoryId);
    return match?.label || decodeURIComponent(categoryId || "");
  }, [categoryId]);

  const posts = useMemo(() => {
    return getStoredPosts().filter(
      (p) => p.status === "published" && p.category?.toLowerCase() === label.toLowerCase()
    );
  }, [label]);

  useEffect(() => {
    document.title = `Category: ${label} – Creative Blog`;
  }, [label]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <Sidebar />
          </div>
          <div className="lg:col-span-9 space-y-12">
            <h1 className="font-playfair text-2xl font-semibold mb-6 text-elegant-text uppercase tracking-wide">
              Posts in “{label}”
            </h1>
            {posts.length === 0 ? (
              <p className="text-muted-foreground">No posts found in this category.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <BlogPost key={post.id} post={post} />
                ))}
              </div>
            )}
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
