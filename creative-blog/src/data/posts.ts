export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  featured?: boolean;
  content: string;
  status: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
  version?: number;
};



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
