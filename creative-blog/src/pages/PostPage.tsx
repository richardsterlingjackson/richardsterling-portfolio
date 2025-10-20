import { useParams } from "react-router-dom";
import { recentPosts } from "@/data/posts";
import { getStoredPosts } from "@/lib/postStore";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export default function PostPage() {
  const { postId } = useParams();
  const allPosts = [...getStoredPosts(), ...recentPosts];
  const post = allPosts.find((p) => p.slug === postId);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground text-lg">Post not found.</p>
        </main>
      </div>
    );
  }

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
