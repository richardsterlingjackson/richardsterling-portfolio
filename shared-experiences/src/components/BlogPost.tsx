// Blog post card used across lists (featured, recent, category, search).
import { Calendar, Eye, Heart, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { usePostFallbackImage } from "@/hooks/use-post-fallback";

interface BlogPostProps {
  post: {
    id: string;
    title: string;
    date: string;
    excerpt: string;
    image: string;
    content: string;
    slug: string;
    category: string;
    featured?: boolean;
    likesCount?: number;
    readsCount?: number;
    article?: boolean;
    articleLabel?: string | null;
  };
  showStats?: boolean;
}

export default function BlogPost({ post, showStats = false }: BlogPostProps) {
  const fallbackImage = usePostFallbackImage();
  const {
    title,
    date,
    excerpt,
    image,
    slug,
    category,
    featured = false,
    likesCount = 0,
    readsCount = 0,
    article = false,
    articleLabel,
  } = post;

  const normalizedArticleLabel = articleLabel?.trim();
  const displayCategory = article
    ? normalizedArticleLabel || (category === "No Category" ? "Article" : category)
    : category;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (fallbackImage && e.currentTarget.src !== fallbackImage) {
      e.currentTarget.src = fallbackImage;
    }
  };

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const readTime = (() => {
    if (!showStats || !post.content) return null;
    const words = post.content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  })();

  const PostTitle = featured ? "h2" : "h3";

  const titleClass = featured
    ? "font-playfair text-2xl sm:text-3xl font-bold mb-4 text-elegant-text hover:text-elegant-primary transition-colors cursor-pointer"
    : "font-playfair text-lg sm:text-xl font-semibold mb-3 text-elegant-text hover:text-elegant-primary transition-colors cursor-pointer";

  return (
    <article className="bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
      <img
        src={image || fallbackImage}
        alt={title}
        onError={handleImageError}
        className={
          featured
            ? "w-full h-[240px] sm:h-[320px] md:h-[400px] object-cover"
            : "w-full h-48 sm:h-56 object-cover"
        }
      />

      <div className={featured ? "p-6 sm:p-8" : "p-5 sm:p-6"}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="h-4 w-4" />
          <time dateTime={date}>{formattedDate}</time>
          <span>•</span>
          <span className="uppercase tracking-wide text-xs text-elegant-primary">
            {displayCategory}
          </span>
          {featured && (
            <>
              <span>•</span>
              <span className="inline-block bg-elegant-primary text-white px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">
                ⭐ Featured
              </span>
            </>
          )}
        </div>
        {showStats && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {readsCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {likesCount}
            </span>
            {readTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {readTime}
              </span>
            )}
          </div>
        )}

        <Link to={`/posts/${slug}`}>
          <PostTitle className={titleClass}>{title}</PostTitle>
        </Link>

        <p className="whitespace-pre-line text-elegant-text-light text-base leading-relaxed mb-6">
          {excerpt}
        </p>

        <Link
          to={`/posts/${slug}`}
          className="inline-block text-elegant-primary hover:text-elegant-secondary font-medium transition-colors uppercase text-sm tracking-wide"
        >
          Read More →
        </Link>
      </div>
    </article>
  );
}
