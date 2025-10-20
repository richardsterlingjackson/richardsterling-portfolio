import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface BlogPostProps {
  post: {
    title: string;
    date: string;
    excerpt: string;
    image: string;
    content: string;
    slug: string;
    category: string;
    featured?: boolean;
  };
}

const fallbackImage = "https://via.placeholder.com/800x400?text=Image+Unavailable";

const BlogPost = ({ post }: BlogPostProps) => {
  const {
    title,
    date,
    excerpt,
    image,
    slug,
    category,
    featured = false,
  } = post;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = fallbackImage;
  };

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const PostTitle = featured ? "h2" : "h3";
  const titleClass = featured
    ? "font-playfair text-3xl font-bold mb-4 text-elegant-text hover:text-elegant-primary transition-colors cursor-pointer"
    : "font-playfair text-xl font-semibold mb-3 text-elegant-text hover:text-elegant-primary transition-colors cursor-pointer";

  return (
    <article className="bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
      <img
        src={image || fallbackImage}
        alt={title}
        onError={handleImageError}
        className={featured ? "w-full h-[400px] object-cover" : "w-full h-64 object-cover"}
      />
      <div className={featured ? "p-8" : "p-6"}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="h-4 w-4" />
          <time dateTime={date}>{formattedDate}</time>
          <span>•</span>
          <span className="uppercase tracking-wide text-xs text-elegant-primary">
            {category}
          </span>
        </div>
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
};

export default BlogPost;

