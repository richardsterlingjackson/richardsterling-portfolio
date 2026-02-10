import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import BlogPost from "@/components/BlogPost";
import ArticlesSidebar from "@/components/ArticlesSidebar";
import { getStoredPosts } from "@/lib/postStore";
import { getSiteSettings } from "@/lib/siteSettings";
import type { BlogPost as BlogPostType } from "@/data/posts";

export default function Articles() {
  const [posts, setPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [featuredSlug, setFeaturedSlug] = useState("");
  const location = useLocation();

  useEffect(() => {
    async function load() {
      try {
        const data = await getStoredPosts();
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load articles:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    const value = new URLSearchParams(location.search).get("q") || "";
    setQuery(value);
  }, [location.search]);

  useEffect(() => {
    let active = true;
    getSiteSettings().then((settings) => {
      if (!active) return;
      setFeaturedSlug(settings?.featuredArticleSlug || "");
    });
    return () => {
      active = false;
    };
  }, []);

  const articles = useMemo(() => {
    return posts
      .filter((post) => post.status === "published" && post.article)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [posts]);

  const featuredArticle = useMemo(() => {
    if (!articles.length) return null;
    const preferred = featuredSlug
      ? articles.find((post) => post.slug === featuredSlug)
      : null;
    return preferred ?? articles[0];
  }, [articles, featuredSlug]);

  const filteredArticles = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return articles;
    return articles.filter((post) => post.title.toLowerCase().includes(trimmed));
  }, [articles, query]);

  const listArticles = useMemo(() => {
    if (!featuredArticle) return filteredArticles;
    return filteredArticles.filter((post) => post.id !== featuredArticle.id);
  }, [filteredArticles, featuredArticle]);

  const featuredDisplay = featuredArticle ? { ...featuredArticle, featured: true } : null;
  const showFeatured = useMemo(() => {
    if (!featuredArticle) return false;
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return true;
    return featuredArticle.title.toLowerCase().includes(trimmed);
  }, [featuredArticle, query]);

  const articleStats = useMemo(() => {
    const totalReads = articles.reduce((sum, post) => sum + (post.readsCount || 0), 0);
    const totalLikes = articles.reduce((sum, post) => sum + (post.likesCount || 0), 0);
    return {
      publishedCount: articles.length,
      totalReads,
      totalLikes,
    };
  }, [articles]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <ArticlesSidebar
            loading={loading}
            articles={filteredArticles}
            query={query}
            onQueryChange={setQuery}
          />

          <div className="lg:col-span-9 space-y-8">
            {showFeatured && featuredDisplay && (
              <BlogPost post={featuredDisplay} showStats />
            )}

            <section className="space-y-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Article Spotlight
                </p>
                <h2 className="font-playfair text-2xl sm:text-3xl font-semibold text-elegant-text">
                  Deep dives and long-form explorations.
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Curated pieces with more depth, context, and narrative focus.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Published
                  </p>
                  <p className="text-2xl font-semibold text-elegant-text">
                    {articleStats.publishedCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Total Reads
                  </p>
                  <p className="text-2xl font-semibold text-elegant-text">
                    {articleStats.totalReads}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Total Likes
                  </p>
                  <p className="text-2xl font-semibold text-elegant-text">
                    {articleStats.totalLikes}
                  </p>
                </div>
              </div>
            </section>

            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : listArticles.length === 0 ? (
              <p className="text-muted-foreground">No articles found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listArticles.map((post) => (
                  <BlogPost key={post.id} post={post} showStats />
                ))}
              </div>
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
