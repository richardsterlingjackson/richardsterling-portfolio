import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BlogPost from "@/components/BlogPost";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost as BlogPostType } from "@/data/posts";

export default function Articles() {
  const [posts, setPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

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

  const articles = useMemo(() => {
    return posts
      .filter((post) => post.status === "published" && post.article)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [posts]);

  const formatDate = (date?: string) => {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-4">
            <div className="rounded-lg border border-border bg-card/70 p-4">
              <h2 className="font-playfair text-lg font-semibold text-elegant-text">
                Articles by Date
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Published articles, newest first.
              </p>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No articles published yet.</p>
            ) : (
              <ul className="space-y-3">
                {articles.map((article) => (
                  <li key={article.id} className="rounded-md border border-border bg-background px-3 py-2">
                    <Link to={`/posts/${article.slug}`} className="block space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {formatDate(article.date)}
                      </p>
                      <p className="text-sm font-medium text-elegant-text hover:text-elegant-primary transition-colors">
                        {article.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className="lg:col-span-9 space-y-8">
            <div className="space-y-2">
              <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-elegant-text">
                Articles
              </h1>
              <p className="text-sm text-muted-foreground">
                Long-form entries and curated pieces published as articles.
              </p>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : articles.length === 0 ? (
              <p className="text-muted-foreground">No articles found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.map((post) => (
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
            © 2025 Shared Experiences. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
