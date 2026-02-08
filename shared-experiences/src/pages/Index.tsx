import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BlogPost from "@/components/BlogPost";
import { getStoredPosts } from "@/lib/postStore";
import type { BlogPost as BlogPostType } from "@/data/posts";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";
import postCardOne from "@/assets/blog-post-1.jpg";
import postCardTwo from "@/assets/blog-post-2.webp";
import postCardThree from "@/assets/blog-post-3.jpg";

export default function Index() {
  const [posts, setPosts] = useState<BlogPostType[]>([]);
  const [homeFeatured, setHomeFeatured] = useState<{
    heroImage: string;
    heroTitle: string;
    heroSubtitle: string;
    heroCategory: string;
    cards: Array<{
      image: string;
      title: string;
      category: string;
      excerpt: string;
      date: string;
      link: string;
      readMoreLabel: string;
    }>;
  } | null>(null);

  useEffect(() => {
    document.title = "Home – Shared Experiences";

    async function loadPosts() {
      try {
        const storedPosts = await getStoredPosts();
        setPosts(Array.isArray(storedPosts) ? storedPosts : []);
        const homeRes = await fetch("/api/posts?home=1", { cache: "no-store" });
        if (homeRes.ok) {
          const homeData = await homeRes.json();
          setHomeFeatured(homeData);
        }
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
        (p) => p.status === "published" && !p.hidden && (!featured || p.id !== featured.id)
      ),
    [posts, featured]
  );

  const stats = useMemo(() => {
    const published = posts.filter((p) => p.status === "published");
    const totalReads = published.reduce((sum, post) => sum + (post.readsCount || 0), 0);
    const totalLikes = published.reduce((sum, post) => sum + (post.likesCount || 0), 0);
    return {
      publishedCount: published.length,
      totalReads,
      totalLikes,
    };
  }, [posts]);

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

            <section className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-elegant-primary">
                  Shared Experiences
                </p>
                <h1 className="font-playfair text-3xl sm:text-4xl font-semibold text-elegant-text">
                  Notes on building, learning, and living in public.
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                  A running journal of experiments, reflections, and systems. Every post is a
                  practical artifact or a small story designed to be useful later.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Published
                  </p>
                  <p className="text-2xl font-semibold text-elegant-text">
                    {stats.publishedCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Total Reads
                  </p>
                  <p className="text-2xl font-semibold text-elegant-text">
                    {stats.totalReads}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Total Likes
                  </p>
                  <p className="text-2xl font-semibold text-elegant-text">
                    {stats.totalLikes}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img
                  src={homeFeatured?.heroImage || heroBanner}
                  alt="Shared Experiences feature"
                  className="h-[320px] w-full object-cover sm:h-[420px] lg:h-[520px]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
                <div className="absolute left-6 top-6 sm:left-10 sm:top-10 bg-white/95 backdrop-blur-sm p-5 sm:p-6 max-w-sm border border-white/40 shadow-lg">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {homeFeatured?.heroCategory || "Shared Experiences"}
                  </p>
                  <h3 className="font-playfair text-2xl font-semibold text-elegant-text mt-2">
                    {homeFeatured?.heroTitle || "A quiet place for ideas that earn their keep."}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {homeFeatured?.heroSubtitle || "Essays, systems, and experiments shaped into practical notes."}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-playfair text-xl sm:text-2xl font-semibold text-elegant-text">
                    Featured Articles
                  </h2>
                  {/* <a href="/posts" className="text-sm text-elegant-primary hover:underline">
                    View all
                  </a> */}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(homeFeatured?.cards?.length
                    ? homeFeatured.cards
                    : [
                    {
                      image: postCardOne,
                      category: "Product & Brand News",
                      title: "Le Creuset’s Valentine’s Day Sale Comes With Free Heart Shaped Bowls",
                      excerpt: "Start planning your celebration with special-edition cookware built to last.",
                      date: "Feb 08, 2026",
                      link: "/posts",
                      readMoreLabel: "Read more",
                    },
                    {
                      image: postCardTwo,
                      category: "Product & Brand News",
                      title: "9 Trader Joe’s Valentine’s Day Sweet Treats to Get Before They’re Gone",
                      excerpt: "Sweet, small-batch snacks that are perfect for gifting (or keeping).",
                      date: "Feb 08, 2026",
                      link: "/posts",
                      readMoreLabel: "Read more",
                    },
                    {
                      image: postCardThree,
                      category: "Product & Brand News",
                      title: "This $10 Aldi Serving Tray Makes Super Bowl Hosting So Much Easier",
                      excerpt: "Lightweight, durable, and ready for crowds—the MVP of any party shelf.",
                      date: "Feb 08, 2026",
                      link: "/posts",
                      readMoreLabel: "Read more",
                    },
                      ]).map((item) => (
                    <article
                      key={item.title}
                      className="border border-border rounded-lg overflow-hidden bg-card hover:border-elegant-primary transition"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-[200px] object-cover"
                        loading="lazy"
                      />
                      <div className="p-4 space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex flex-wrap gap-2">
                          <span>{item.category}</span>
                          {/* {item.date && (
                            <span className="opacity-70">• {item.date}</span>
                          )} */}
                        </p>
                        <h3 className="font-playfair text-lg font-semibold text-elegant-text">
                          {item.link ? (
                            <Link
                              to={item.link}
                              className="hover:text-elegant-primary transition"
                            >
                              {item.title}
                            </Link>
                          ) : (
                            item.title
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.excerpt}
                        </p>
                        {item.link ? (
                          <Link
                            to={item.link}
                            className="text-xs uppercase tracking-[0.2em] text-elegant-primary hover:underline"
                          >
                            {item.readMoreLabel || "Read more"}
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

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
