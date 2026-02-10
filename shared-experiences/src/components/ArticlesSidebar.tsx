import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost as BlogPostType } from "@/data/posts";

type ArticlesSidebarProps = {
  loading: boolean;
  articles: BlogPostType[];
  query: string;
  onQueryChange: (value: string) => void;
  featuredArticleSlug?: string;
};

export default function ArticlesSidebar({
  loading,
  articles,
  query,
  onQueryChange,
  featuredArticleSlug = "",
}: ArticlesSidebarProps) {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  const groupedByYear = useMemo(() => {
    const groups = new Map<string, BlogPostType[]>();
    articles.forEach((post) => {
      const parsed = new Date(post.date);
      const year = Number.isNaN(parsed.getTime()) ? "Unknown" : String(parsed.getFullYear());
      const list = groups.get(year) || [];
      list.push(post);
      groups.set(year, list);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [articles]);

  const currentYear = String(new Date().getFullYear());
  const currentYearGroup = groupedByYear.find(([year]) => year === currentYear);
  const previousYears = groupedByYear.filter(([year]) => year !== currentYear);

  const formatDate = (date?: string) => {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getReadTime = (content?: string) => {
    if (!content) return "";
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    setSubscribing(true);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, category: "Articles" }),
      });

      if (response.ok) {
        toast({ title: "Subscribed!", description: "You'll receive new articles via email." });
        setEmail("");
      } else {
        toast({ title: "Subscription failed", description: "Please try again later.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      toast({ title: "Error", description: "Failed to subscribe. Please try again.", variant: "destructive" });
    } finally {
      setSubscribing(false);
    }
  };

  const renderArticleList = (items: BlogPostType[]) => (
    <ul className="space-y-3">
      {items.map((article) => (
        <li key={article.id} className="rounded-md border border-border bg-background px-3 py-2">
          <Link to={`/posts/${article.slug}`} className="block space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {formatDate(article.date)}
              </p>
              {article.slug === featuredArticleSlug ? (
                <span className="text-[10px] uppercase tracking-[0.2em] text-amber-800">
                  Main Featured Article
                </span>
              ) : article.featured ? (
                <span className="text-[10px] uppercase tracking-[0.2em] text-amber-800">
                  Featured Article
                </span>
              ) : null}
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {getReadTime(article.content)}
            </p>
            <p className="text-sm font-medium text-elegant-text hover:text-elegant-primary transition-colors">
              {article.title}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <aside className="lg:col-span-3 space-y-4">
      <div className="rounded-lg border border-border bg-card/70 p-4">
        <h2 className="font-playfair text-lg font-semibold text-elegant-text">
          Articles by Date
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Published articles, newest first.
        </p>
      </div>

      <section className="bg-gradient-to-br from-elegant-primary/10 to-elegant-secondary/10 border border-elegant-primary/20 rounded-lg p-4 space-y-3">
        <h3 className="font-playfair text-base font-semibold text-elegant-text">
          Get new articles in your email...
        </h3>
        <p className="text-xs text-muted-foreground">
          Subscribe to new long-form pieces when they publish.
        </p>
        <form onSubmit={handleSubscribe} className="space-y-3">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={subscribing}
            className="text-sm"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={subscribing}
              className="h-auto px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide bg-elegant-primary text-white hover:bg-elegant-primary/90"
            >
              {subscribing ? "Subscribing..." : "Subscribe"}
            </Button>
          </div>
        </form>
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-10 bg-muted/50 border-muted"
          aria-label="Search articles"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No articles published yet.</p>
      ) : (
        <div className="space-y-6">
          {currentYearGroup ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span>This Year</span>
                <span>{currentYearGroup[0]}</span>
              </div>
              {renderArticleList(currentYearGroup[1])}
            </div>
          ) : null}

          {previousYears.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Previous Years
              </p>
              <div className="space-y-3">
                {previousYears.map(([year, items]) => (
                  <details key={year} className="rounded-md border border-border bg-background/60">
                    <summary className="cursor-pointer px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
                      <span>{year}</span>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-foreground">
                        {items.length} article{items.length === 1 ? "" : "s"}
                      </span>
                    </summary>
                    <div className="px-3 pb-3 pt-1">
                      {renderArticleList(items)}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </aside>
  );
}
