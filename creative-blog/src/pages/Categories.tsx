// src/pages/Categories.tsx
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getStoredPosts } from "@/lib/postStore";
import { slugifyCategory } from "@/lib/postStore"; // Add this helper if not already present

type CategoryInfo = {
  name: string;
  slug: string;
  count: number;
};

export default function Categories() {
  const posts = getStoredPosts().filter((p) => p.status === "published");

  const categoryMap = new Map<string, number>();
  posts.forEach((post) => {
    const category = post.category?.trim();
    if (category) {
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }
  });

  const categories: CategoryInfo[] = Array.from(categoryMap.entries()).map(
    ([name, count]) => ({
      name,
      slug: slugifyCategory(name),
      count,
    })
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <Sidebar />
          </div>
          <div className="lg:col-span-9 space-y-10">
            <section className="space-y-4">
              <h1 className="text-4xl font-playfair font-bold text-elegant-text tracking-tight">
                Categories
              </h1>
              <p className="text-muted-foreground text-lg">
                Browse curated themes and topics explored across the blog.
              </p>
            </section>

            {categories.length === 0 ? (
              <p className="text-muted-foreground text-md">No categories found.</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map(({ name, slug, count }) => (
                  <li key={slug} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <Link to={`/category/${slug}`} className="block space-y-2">
                      <h3 className="text-xl font-semibold text-elegant-text hover:text-elegant-primary transition-colors">
                        {name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {count} post{count > 1 ? "s" : ""} in this category
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 creative-blog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
