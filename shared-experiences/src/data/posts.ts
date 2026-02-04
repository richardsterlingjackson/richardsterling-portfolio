// src/data/posts.ts

// The canonical BlogPost type used across the entire app.
// Matches your Neon database schema and your API response shape exactly.

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured: boolean; // always boolean, never optional
  content: string;
  status: "draft" | "published";
  createdAt: string | null; // DB returns null when empty
  updatedAt: string | null;
  version: number | null;
};

// Legacy placeholder array — kept empty on purpose.
// You no longer use localStorage or static posts.

export const recentPosts: BlogPost[] = [ /**
  {
    title: "Hared cod",
    date: "2025-10-01",
    excerpt: "Explore how Martha designed a whimsical hedge maze using native plants and seasonal blooms.",
    image: "https://lovable.dev/images/garden-maze.jpg",
    category: "Gardening",
  },
  {
    title: "Autumn Tablescapes for Cozy Gatherings",
    date: "2025-10-10",
    excerpt: "Warm tones, layered textures, and vintage accents make these fall tablescapes unforgettable.",
    image: "https://lovable.dev/images/autumn-table.jpg",
    category: "Entertaining",
  },**/
];
