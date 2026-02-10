// Global header: nav links + search bar + page title updates.
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import heroBanner from "@/assets/hero-banner-1.webp";

export default function Header() {
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const isSearchPage = location.pathname === "/search";
  const showSearch = true;

  //
  // PAGE TITLES
  //
  const pageTitle = useMemo(() => {
    const titles: Record<string, string> = {
      "/": "Shared Experiences – Home",
      "/about": "About – Shared Experiences",
      "/categories": "Categories – Shared Experiences",
      "/articles": "Articles – Shared Experiences",
      "/contact": "Contact – Shared Experiences",
      "/admin": "Admin – Shared Experiences",
    };

    return titles[location.pathname] || "Shared Experiences – Richard Sterling Jackson";
  }, [location.pathname]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => {
    if (!isSearchPage) return;
    const value = new URLSearchParams(location.search).get("q") || "";
    setQuery(value);
  }, [isSearchPage, location.search]);

  //
  // SEARCH HANDLER
  //
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="w-full">
      {/* HERO BANNER */}
      <div
        className="relative h-[220px] sm:h-[260px] md:h-[320px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-playfair text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-2 text-shadow-md text-outline">
            Shared Experiences
          </h1>
          <p className="font-inter text-base sm:text-2xl md:text-4xl font-extrabold italic text-white text-shadow-md text-outline">
            thoughts, insights, ideas... into memories
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* LEFT LINKS */}
            <div className="flex flex-wrap items-center gap-4">
              <HeaderLink to="/" label="HOME" />
              <HeaderLink to="/about" label="ABOUT" />
              <HeaderLink to="/categories" label="CATEGORIES" />
              <HeaderLink to="/articles" label="ARTICLES" />
              <HeaderLink to="/contact" label="CONTACT" />
            </div>

            {/* SEARCH BAR (HOME ONLY) */}
            {showSearch && (
              <form onSubmit={handleSearch} className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-muted"
                  aria-label="Search blog posts"
                />
              </form>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

//
// SMALL SUBCOMPONENT FOR CLEANER JSX
//
function HeaderLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-sm font-medium text-elegant-text hover:text-elegant-primary transition-colors"
    >
      {label}
    </Link>
  );
}
