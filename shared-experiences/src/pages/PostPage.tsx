import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStoredPosts } from "@/lib/postStore";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { BlogPost } from "@/data/posts";

export default function PostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  //
  // LOAD POST BY SLUG
  //
  useEffect(() => {
    async function loadPost() {
      try {
        const storedPosts = await getStoredPosts();

        // Find by slug (URL param)
        const found = storedPosts.find((p) => p.slug === postId) || null;

        setPost(found);
      } catch (err) {
        console.error("Failed to load post:", err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  //
  // UPDATE DOCUMENT TITLE
  //
  useEffect(() => {
    const baseTitle = "Shared Experiences";

    if (post) {
      const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      document.title = `${post.title} – ${post.category} – ${formattedDate} | ${baseTitle}`;
    } else {
      document.title = `Post Not Found | ${baseTitle}`;
    }
  }, [post]);

  //
  // LOADING STATE
  //
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground text-lg">Loading…</p>
        </main>
      </div>
    );
  }

  //
  // NOT FOUND
  //
  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground text-lg">
            Post not found.
          </p>
        </main>
      </div>
    );
  }

  //
  // RENDER POST
  //
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <Sidebar />
          </div>

          <article className="lg:col-span-9 space-y-6">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-[400px] object-cover rounded-lg border border-border"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://via.placeholder.com/800x400?text=Image+Unavailable";
              }}
            />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <time dateTime={post.date}>{post.date}</time>
              <span>•</span>
              <span className="uppercase tracking-wide text-xs text-elegant-primary">
                {post.category}
              </span>
            </div>

            <h1 className="text-4xl font-playfair font-bold text-elegant-text">
              {post.title}
            </h1>

            <p className="whitespace-pre-line text-elegant-text-light text-lg leading-relaxed">
              {post.excerpt}
            </p>

            <div className="prose prose-sm text-elegant-text">
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {post.content}
              </ReactMarkdown>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
