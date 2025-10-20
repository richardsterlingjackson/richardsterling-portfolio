// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "@/pages/Index";
import About from "@/pages/About";
import Categories from "@/pages/Categories";
import Contact from "@/pages/Contact";
import Admin from "@/pages/Admin";
import PostPage from "@/pages/PostPage";
import CategoryPage from "@/pages/Categories";
import NotFound from "@/pages/NotFound";
import { SearchResults } from "@/pages/SearchResults"; // ✅ added import

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/posts/:postId" element={<PostPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} /> {/* ✅ updated route */}
          <Route path="/search" element={<SearchResults />} /> {/* ✅ added route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
