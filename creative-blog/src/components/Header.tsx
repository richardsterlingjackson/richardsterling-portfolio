import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import heroBanner from "@/assets/hero-banner-1.jpg";

const Header = () => {
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setQuery("");
    }
  };

  return (
    <header className="w-full">
      {/* Hero Banner */}
      <div
        className="relative h-[300px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-playfair text-6xl md:text-8xl font-bold text-white mb-2 text-shadow-md text-outline">
            creative-blog
          </h1>
          <p className="font-inter text-3xl md:text-5xl font-extrabold italic text-white text-shadow-md text-outline">
            turning thoughts into ideas and memories
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="text-sm font-medium text-elegant-text hover:text-elegant-primary transition-colors"
              >
                HOME
              </Link>
              <Link
                to="/about"
                className="text-sm font-medium text-elegant-text hover:text-elegant-primary transition-colors"
              >
                ABOUT
              </Link>
              <Link
                to="/categories"
                className="text-sm font-medium text-elegant-text hover:text-elegant-primary transition-colors"
              >
                CATEGORIES
              </Link>
              <Link
                to="/contact"
                className="text-sm font-medium text-elegant-text hover:text-elegant-primary transition-colors"
              >
                CONTACT
              </Link>
            </div>

            {isHome && (
              <form onSubmit={handleSearch} className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-muted"
                />
              </form>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
