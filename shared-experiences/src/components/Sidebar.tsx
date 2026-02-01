import { useEffect, useState } from "react";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost } from "@/data/posts";
import { Link } from "react-router-dom";
import { categories } from "@/data/categories";

export default function Sidebar() {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    setAllPosts(getStoredPosts());
  }, []);

  const recentPosts = allPosts
    .filter((p) => p.status === "published" && !p.featured)
    .slice(0, 5);

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
        {recentPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent posts available.</p>
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link
                  to={`/posts/${post.slug}`}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-elegant-primary"
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
