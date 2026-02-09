// Sidebar: newsletter signup + recent/popular posts + category list.
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStoredPosts } from "@/lib/postStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost } from "@/data/posts";
import { categories } from "@/data/categories";

export default function Sidebar() {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  //
  // LOAD POSTS
  //
  useEffect(() => {
    async function load() {
      try {
        const posts = await getStoredPosts();
        setAllPosts(Array.isArray(posts) ? posts : []);
      } catch (err) {
        console.error("Failed to load posts in Sidebar:", err);
        setAllPosts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  //
  // RECENT POSTS (memoized)
  //
  const recentPosts = useMemo(() => {
    return allPosts
      .filter((p) => p.status === "published" && !p.hidden)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [allPosts]);

  //
  // POPULAR POSTS (most reads, then likes)
  //
  const popularPosts = useMemo(() => {
    return allPosts
      .filter((p) => p.status === "published" && !p.hidden)
      .sort((a, b) => {
        const readsDiff = (b.readsCount || 0) - (a.readsCount || 0);
        if (readsDiff !== 0) return readsDiff;
        return (b.likesCount || 0) - (a.likesCount || 0);
      })
      .slice(0, 5);
  }, [allPosts]);

  //
  // CATEGORY COUNTS
  //
  const categoryWithCounts = useMemo(() => {
    return categories.map(({ slug, label }) => {
      const count = allPosts.filter((p) => p.category === label && p.status === "published" && !p.hidden).length;
      return { slug, label, count };
    });
  }, [allPosts]);

  //
  // HANDLE NEWSLETTER SUBSCRIBE
  //
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    if (selectedCategories.length === 0) {
      toast({ title: "Category required", description: "Please select at least one category to subscribe to.", variant: "destructive" });
      return;
    }

    setSubscribing(true);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, categories: selectedCategories }),
      });

      if (response.ok) {
        const hasAll = selectedCategories.includes("All Categories");
        const description = hasAll
          ? "You'll receive new posts from all categories via email."
          : `You'll receive new posts from ${selectedCategories.length} category${selectedCategories.length === 1 ? "" : "ies"} via email.`;
        toast({ title: "Subscribed!", description });
        setEmail("");
        setSelectedCategories([]);
      } else {
        toast({ title: "Subscription failed", description: "Please try again later.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      toast({ title: "Error", description: "Failed to subscribe. Please try again.", variant: "destructive" });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <aside className="space-y-10">
      {/* Newsletter Signup */}
      <section className="bg-gradient-to-br from-elegant-primary/10 to-elegant-secondary/10 border border-elegant-primary/20 rounded-lg p-4 sm:p-5 space-y-3">
        <h3 className="font-playfair text-lg font-semibold text-elegant-text">
          Get new posts in your email...
        </h3>
        <p className="text-sm text-muted-foreground">
          Subscribe to a category and receive new posts via email.
        </p>
        <form onSubmit={handleSubscribe} className="space-y-3">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={subscribing}
            className="text-sm"
          />
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes("All Categories")}
                onChange={(e) =>
                  setSelectedCategories(
                    e.target.checked ? ["All Categories"] : []
                  )
                }
                disabled={subscribing}
              />
              <span>All Categories</span>
            </label>
            <div className="space-y-2 pl-4">
              {categories.map(({ label }) => (
                <label key={label} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(label)}
                    onChange={(e) => {
                      setSelectedCategories((prev) => {
                        const next = new Set(prev.filter((c) => c !== "All Categories"));
                        if (e.target.checked) {
                          next.add(label);
                        } else {
                          next.delete(label);
                        }
                        return Array.from(next);
                      });
                    }}
                    disabled={subscribing || selectedCategories.includes("All Categories")}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end sm:justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={subscribing}
              className="h-auto px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide bg-elegant-primary text-white hover:bg-elegant-primary/90"
            >
              {subscribing ? "Subscribing…" : "Subscribe"}
            </Button>
          </div>
        </form>
      </section>

      {/* Popular Posts */}
      <section>
        <h3 className="font-playfair text-lg font-semibold mb-4 text-elegant-text">
          Popular Posts
        </h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : popularPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No popular posts yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {popularPosts.map((post) => (
              <li key={post.id}>
                <Link
                  to={`/posts/${post.slug}`}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-elegant-primary flex items-center gap-2 line-clamp-2"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Categories with Post Count */}
      <section>
        <h3 className="font-playfair text-lg font-semibold mb-4 text-elegant-text">
          Total in Categories
        </h3>

        <ul className="space-y-2 text-sm text-muted-foreground">
          {categoryWithCounts.map(({ slug, label, count }) => (
            <li key={slug}>
              <Link
                to={`/category/${slug}`}
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-elegant-primary flex items-center justify-between"
              >
                <span>{label}</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium text-foreground">
                  {count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent Posts */}
      <section>
        <h3 className="font-playfair text-lg font-semibold mb-4 text-elegant-text">
          Recent Posts list
        </h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : recentPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent posts available.</p>
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link
                  to={`/posts/${post.slug}`}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-elegant-primary flex items-center gap-2 line-clamp-2"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
