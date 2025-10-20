import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BlogPost from "@/components/BlogPost";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost as BlogPostType } from "@/data/posts";

const Index = () => {
  const [posts, setPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    document.title = "Richard Sterling Jackson – A Custom Blog";
    setPosts(getStoredPosts());
  }, []);

  const featured = useMemo(() => posts.find((p) => p.featured), [posts]);

  const recentPosts = useMemo(() => {
    return posts.filter((p) => !p.featured && p.status === "published");
  }, [posts]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <Sidebar />
          </div>
          <div className="lg:col-span-9 space-y-12">
            {featured && (
              <BlogPost
                featured
                title={featured.title}
                date={featured.date}
                excerpt={featured.excerpt}
                image={featured.image}
                content={featured.content}
                slug={featured.slug}
              />
            )}

            <div>
              <h2 className="font-playfair text-2xl font-semibold mb-6 text-elegant-text uppercase tracking-wide">
                Recent Posts
              </h2>
              {recentPosts.length === 0 ? (
                <p className="text-muted-foreground">No recent posts found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recentPosts.map((post) => (
                    <BlogPost
                      key={post.id}
                      title={post.title}
                      date={post.date}
                      excerpt={post.excerpt || post.content.slice(0, 160)}
                      image={post.image}
                      content={post.content}
                      slug={post.slug}
                    />
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
            © 2025 creative-blog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
