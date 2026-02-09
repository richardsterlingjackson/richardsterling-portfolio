// Categories page: aggregates published posts into category counts.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getStoredPosts } from "@/lib/postStore";
import { getSiteSettings } from "@/lib/siteSettings";
import type { BlogPost } from "@/data/posts";
import { categories as categoryList } from "@/data/categories";
import categoriesFallback from "@/assets/hero-banner-1.webp";

type CategoryInfo = {
  label: string;
  slug: string;
  count: number;
  latestDate?: string;
};

export default function Categories() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerImage, setHeaderImage] = useState(categoriesFallback);
  const [headerFallbackImage, setHeaderFallbackImage] = useState(categoriesFallback);
  const [categoryCardImages, setCategoryCardImages] = useState<
    Record<string, { image?: string; fallbackImage?: string }>
  >({});

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

  useEffect(() => {
    let active = true;
    getSiteSettings().then((settings) => {
      if (!active) return;
      const fallback = settings?.categoriesFallbackImage || categoriesFallback;
      const hero = settings?.categoriesImage || fallback;
      setHeaderFallbackImage(fallback);
      setHeaderImage(hero);
      setCategoryCardImages(settings?.categoryCardImages || {});
    });
    return () => {
      active = false;
    };
  }, []);

  //
  // BUILD CATEGORY COUNTS (memoized)
  //
  const categoryData = useMemo<CategoryInfo[]>(() => {
    const map = new Map<string, { count: number; latestDate?: string }>();

    posts.forEach((post) => {
      const category = post.category?.trim();
      if (!category) return;
      const current = map.get(category) || { count: 0, latestDate: undefined };
      const nextCount = current.count + 1;

      let nextLatest = current.latestDate;
      const parsed = post.date ? new Date(post.date) : null;
      if (parsed && !Number.isNaN(parsed.getTime())) {
        if (!current.latestDate || parsed > new Date(current.latestDate)) {
          nextLatest = post.date;
        }
      }

      map.set(category, { count: nextCount, latestDate: nextLatest });
    });

    // Convert to array using official category list
    return categoryList
      .map(({ label, slug }) => {
        const entry = map.get(label);
        return {
          label,
          slug,
          count: entry?.count || 0,
          latestDate: entry?.latestDate,
        };
      })
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
            <section className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30">
                <img
                  src={headerImage}
                  alt="Categories header"
                  className="w-full h-[220px] sm:h-[280px] object-cover"
                  loading="lazy"
                  onError={() => {
                    if (headerImage !== headerFallbackImage) {
                      setHeaderImage(headerFallbackImage);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Browse by theme
                </p>
                <h1 className="text-4xl sm:text-5xl font-playfair font-bold text-elegant-text tracking-tight">
                  Categories
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Browse curated themes and topics explored across the blog.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="px-3 py-1 rounded-full border border-border bg-background">
                    {categoryData.length} themes
                  </span>
                  <span className="px-3 py-1 rounded-full border border-border bg-background">
                    {posts.length} posts
                  </span>
                </div>
              </div>
            </section>

            {loading ? (
              <p className="text-muted-foreground text-md">Loading…</p>
            ) : categoryData.length === 0 ? (
              <p className="text-muted-foreground text-md">No categories found.</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryData.map(({ label, slug, count, latestDate }) => {
                  const config = categoryCardImages[slug] || {};
                  const fallbackImage = config.fallbackImage || categoriesFallback;
                  const cardImage = config.image || fallbackImage;
                  return (
                    <li
                      key={slug}
                      className="group border border-border rounded-xl p-6 bg-card/70 hover:border-elegant-primary/60 hover:shadow-md transition"
                    >
                      <Link to={`/category/${slug}`} className="block space-y-4">
                        <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
                          <img
                            src={cardImage}
                            alt={`${label} category`}
                            className="w-full h-40 object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== fallbackImage) {
                                target.src = fallbackImage;
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-xl font-semibold text-elegant-text group-hover:text-elegant-primary transition-colors">
                            {label}
                          </h3>
                          <span className="text-[11px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-border bg-background text-muted-foreground">
                            {count} post{count > 1 ? "s" : ""}
                          </span>
                        </div>
                      <p className="text-sm text-muted-foreground">
                        Explore posts curated under {label}.
                      </p>
                      {latestDate && (
                        <p className="text-xs text-muted-foreground">
                          Latest: {latestDate}
                        </p>
                      )}
                      <span className="text-[11px] uppercase tracking-[0.2em] text-elegant-primary">
                        View posts
                      </span>
                    </Link>
                  </li>
                  );
                })}
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
