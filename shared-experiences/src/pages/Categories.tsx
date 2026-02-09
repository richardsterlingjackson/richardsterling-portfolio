// Categories page: aggregates published posts into category counts.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost } from "@/data/posts";
import { categories as categoryList } from "@/data/categories";

type CategoryInfo = {
  label: string;
  slug: string;
  count: number;
};

export default function Categories() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  //
  // LOAD POSTS
  //
  useEffect(() => {
    document.title = "Categories – Shared Experiences";

    async function load() {
      try {
        const data = await getStoredPosts();
        setPosts(data.filter((p) => p.status === "published"));
      } catch (err) {
        console.error("Failed to load posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  //
  // BUILD CATEGORY COUNTS (memoized)
  //
  const categoryData = useMemo<CategoryInfo[]>(() => {
    const map = new Map<string, number>();

    posts.forEach((post) => {
      const category = post.category?.trim();
      if (category) {
        map.set(category, (map.get(category) || 0) + 1);
      }
    });

    // Convert to array using official category list
    return categoryList
      .map(({ label, slug }) => ({
        label,
        slug,
        count: map.get(label) || 0,
      }))
      .filter((c) => c.count > 0); // Only show categories that actually have posts
  }, [posts]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <Sidebar />
          </div>

          <div className="lg:col-span-9 space-y-10">
            <section className="space-y-4">
              <h1 className="text-4xl font-playfair font-bold text-elegant-text tracking-tight">
                Categories
              </h1>
              <p className="text-muted-foreground text-lg">
                Browse curated themes and topics explored across the blog.
              </p>
            </section>

            {loading ? (
              <p className="text-muted-foreground text-md">Loading…</p>
            ) : categoryData.length === 0 ? (
              <p className="text-muted-foreground text-md">No categories found.</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryData.map(({ label, slug, count }) => (
                  <li
                    key={slug}
                    className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <Link to={`/category/${slug}`} className="block space-y-2">
                      <h3 className="text-xl font-semibold text-elegant-text hover:text-elegant-primary transition-colors">
                        {label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {count} post{count > 1 ? "s" : ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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

