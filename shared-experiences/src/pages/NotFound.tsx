import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "404 – Page Not Found | Shared Experiences";
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-elegant-text">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page not found.
        </p>
        <Link
          to="/"
          className="text-elegant-primary underline hover:text-elegant-primary/80"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
