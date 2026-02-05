import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost } from "@/data/posts";
import { categories } from "@/data/categories";

export default function Sidebar() {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

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
      .filter((p) => p.status === "published")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [allPosts]);

  return (
    <aside className="space-y-10">
      {/* Categories */}
      <section>
        <h3 className="font-playfair text-lg font-semibold mb-4 text-elegant-text">
          Categories
        </h3>

        <ul className="space-y-2 text-sm text-muted-foreground">
          {categories.map(({ slug, label }) => (
            <li key={slug}>
              <Link
                to={`/category/${slug}`}
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-elegant-primary"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent Posts */}
      <section>
        <h3 className="font-playfair text-lg font-semibold mb-4 text-elegant-text">
          Recent Posts
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
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-elegant-primary flex items-center gap-2"
                >
                  {post.featured && <span className="text-xs">⭐</span>}
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
