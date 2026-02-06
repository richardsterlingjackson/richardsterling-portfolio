import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BlogPost from "@/components/BlogPost";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost as BlogPostType } from "@/data/posts";

export default function Index() {
  const [posts, setPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    document.title = "Home – Shared Experiences";

    async function loadPosts() {
      try {
        const storedPosts = await getStoredPosts();
        setPosts(Array.isArray(storedPosts) ? storedPosts : []);
      } catch (err) {
        console.error("Failed to load posts:", err);
        setPosts([]);
      }
    }

    loadPosts();
  }, []);

  const featured = useMemo(() => {
    const featuredPosts = posts.filter(
      (post) => post.featured && post.status === "published"
    );
    const main = featuredPosts.find((post) => post.mainFeatured);
    return main ?? featuredPosts[0];
  }, [posts]);

  const recentPosts = useMemo(
    () =>
      posts.filter(
        (p) => p.status === "published" && (!featured || p.id !== featured.id)
      ),
    [posts, featured]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <Sidebar />
          </div>

          <div className="lg:col-span-9 space-y-12">
            {featured && <BlogPost post={featured} />}

            <div>
              <h2 className="font-playfair text-xl sm:text-2xl font-semibold mb-6 text-elegant-text uppercase tracking-wide">
                Recent Posts
              </h2>

              {recentPosts.length === 0 ? (
                <p className="text-muted-foreground">No recent posts found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recentPosts.map((post) => (
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
            © 2025 Shared Experiences. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
