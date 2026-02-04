import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BlogPost from "@/components/BlogPost";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost as BlogPostType } from "@/data/posts";
import { categories } from "@/data/categories";

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [posts, setPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

  //
  // RESOLVE CATEGORY LABEL FROM SLUG
  //
  const label = useMemo(() => {
    if (!categoryId) return "";

    const match = categories.find((c) => c.slug === categoryId);
    return match?.label || decodeURIComponent(categoryId);
  }, [categoryId]);

  //
  // LOAD POSTS FOR THIS CATEGORY
  //
  useEffect(() => {
    async function loadPosts() {
      try {
        const allPosts = await getStoredPosts();

        // Match category by label (Admin stores category as label)
        const filtered = allPosts.filter(
          (p) =>
            p.status === "published" &&
            p.category?.toLowerCase() === label.toLowerCase()
        );

        setPosts(filtered);
      } catch (err) {
        console.error("Failed to load posts for category:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [label]);

  //
  // SET PAGE TITLE
  //
  useEffect(() => {
    if (label) {
      document.title = `Category: ${label} – Shared Experiences`;
    }
  }, [label]);

  //
  // LOADING STATE
  //
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground text-lg">Loading…</p>
        </main>
      </div>
    );
  }

  //
  // RENDER
  //
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
              <p className="text-muted-foreground">
                No posts found in this category.
              </p>
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
            © 2025 shared-experiences. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
