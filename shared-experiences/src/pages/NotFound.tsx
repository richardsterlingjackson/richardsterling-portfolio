// 404 page: logs missing routes and provides a way back home.
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    document.title = "404 – Page Not Found | Shared Experiences";
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-elegant-text">404</h1>

        <p className="text-xl text-muted-foreground">
          The page you’re looking for doesn’t exist.
        </p>

        <Link
          to="/"
          className="text-elegant-primary underline hover:text-elegant-primary/80 transition-colors text-lg"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
