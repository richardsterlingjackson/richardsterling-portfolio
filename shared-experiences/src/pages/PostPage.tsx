import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStoredPosts } from "@/lib/postStore";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/data/posts";
import { Helmet } from "react-helmet-async";

// Helper: Calculate reading time (avg 200 words per minute)
function calculateReadingTime(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / 200);
}

export default function PostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);

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
        if (found) {
          setLikesCount(found.likesCount || 0);
          const storedLiked = localStorage.getItem(`liked_${found.id}`) === "1";
          setLiked(storedLiked);
        }

        // Find related posts (same category, exclude current post, published only)
        if (found) {
          const related = storedPosts
            .filter(
              (p) =>
                p.category === found.category &&
                p.id !== found.id &&
                p.status === "published"
            )
            .slice(0, 3); // Limit to 3 related posts
          setRelatedPosts(related);
        }
      } catch (err) {
        console.error("Failed to load post:", err);
        setPost(null);
        setRelatedPosts([]);
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

  // Handle copy link to clipboard
  const handleCopyLink = () => {
    const url = post
      ? `${window.location.origin}/posts/${encodeURIComponent(post.slug)}`
      : window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Share to social media
  const shareToTwitter = () => {
    const url = post
      ? `${window.location.origin}/posts/${encodeURIComponent(post.slug)}`
      : window.location.href;
    const text = `Check out: "${post?.title}" by @richardsterling`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareToLinkedIn = () => {
    const url = post
      ? `${window.location.origin}/posts/${encodeURIComponent(post.slug)}`
      : window.location.href;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareToFacebook = () => {
    const url = post
      ? `${window.location.origin}/posts/${encodeURIComponent(post.slug)}`
      : window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleLike = async () => {
    if (!post) return;
    const action = liked ? "unlike" : "like";

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, action }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setLikesCount(data.likesCount ?? 0);
      const nextLiked = !liked;
      setLiked(nextLiked);
      localStorage.setItem(`liked_${post.id}`, nextLiked ? "1" : "0");
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const ogImageUrl = post
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`
    : "";

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
        <Helmet>
          <title>{`${post.title} | Shared Experiences`}</title>
          <meta name="description" content={post.excerpt} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={post.excerpt} />
          <meta property="og:type" content="article" />
          {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
          {pageUrl && <meta property="og:url" content={pageUrl} />}
          <meta name="twitter:card" content="summary_large_image" />
          {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}
        </Helmet>
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

            <div className="space-y-4">
              {/* Metadata: Date, Category, Reading Time */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <time dateTime={post.date}>{post.date}</time>
                <span>•</span>
                <span className="uppercase tracking-wide text-xs text-elegant-primary">
                  {post.category}
                </span>
                <span>•</span>
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {calculateReadingTime(post.content)} min read
                </span>
              </div>

              <h1 className="text-4xl font-playfair font-bold text-elegant-text">
                {post.title}
              </h1>

              <p className="whitespace-pre-line text-elegant-text-light text-lg leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            {/* Share, Like & Copy Buttons */}
            <div className="flex flex-wrap items-center gap-2 py-4 border-y border-border">
              <Button
                variant={liked ? "secondary" : "outline"}
                size="sm"
                onClick={handleLike}
                className={`text-xs font-semibold border-2 ${
                  liked
                    ? "bg-elegant-primary text-white border-elegant-primary"
                    : "bg-elegant-primary/90 text-white border-elegant-primary hover:bg-elegant-primary"
                } px-2 py-1`}
              >
                {liked ? "♥ Liked" : "♡ Like"} · {likesCount}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareToTwitter}
                className="text-xs"
              >
                Share on 𝕏
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareToLinkedIn}
                className="text-xs"
              >
                Share on LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareToFacebook}
                className="text-xs"
              >
                Share on Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="text-xs"
              >
                {copySuccess ? "✓ Copied!" : "Copy Link"}
              </Button>
            </div>

            {/* Content */}
            <div className="prose prose-sm text-elegant-text">
              <ReactMarkdown
                remarkPlugins={[remarkBreaks]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-4 last:mb-0">{children}</p>
                  ),
                  br: () => <span className="block h-4" />,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border space-y-4">
                <h2 className="text-2xl font-semibold text-elegant-text">
                  Related Posts
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {relatedPosts.map((relPost) => (
                    <a
                      key={relPost.id}
                      href={`/posts/${relPost.slug}`}
                      className="group border border-border rounded-lg overflow-hidden hover:border-elegant-primary transition"
                    >
                      <img
                        src={relPost.image}
                        alt={relPost.title}
                        className="w-full h-[180px] object-cover group-hover:opacity-90 transition"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://via.placeholder.com/400x200?text=Image";
                        }}
                      />
                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-sm text-elegant-text group-hover:text-elegant-primary transition line-clamp-2">
                          {relPost.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {relPost.date} • {calculateReadingTime(relPost.content)} min
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}
