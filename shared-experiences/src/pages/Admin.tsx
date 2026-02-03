"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  savePost,
  updatePost,
  getStoredPosts,
  deletePost,
} from "@/lib/postStore";

import type { BlogPost } from "@/data/posts";
import { categories } from "@/data/categories";

//
// VITE ENV PASSWORD
//
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

//
// LOGIN GATE
//
function AdminGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = React.useState("");

  const handleEnter = () => {
    if (!ADMIN_PASSWORD) {
      alert("Admin password not configured");
      return;
    }

    if (!password) {
      alert("Enter password");
      return;
    }

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("isAdmin", "true");
      onSuccess();
    } else {
      alert("Wrong password");
    }
  };

  return (
    <div className="max-w-sm mx-auto py-24 space-y-4">
      <h2 className="text-xl font-semibold text-center">Admin Login</h2>

      <Input
        type="password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button className="w-full" onClick={handleEnter}>
        Enter
      </Button>
    </div>
  );
}

//
// DEFAULT EXPORT
//
export default function Admin() {
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    const isAdmin = sessionStorage.getItem("isAdmin");
    if (isAdmin === "true") setAuthorized(true);
  }, []);

  if (!authorized) {
    return <AdminGate onSuccess={() => setAuthorized(true)} />;
  }

  return <AdminContent />;
}

//
// FULL ADMIN CONTENT (DATABASE VERSION)
//
export function AdminContent() {
  React.useEffect(() => {
    document.title = "Admin – Shared Experiences – Richard Sterling Jackson";
  }, []);

  const { toast } = useToast();
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<"all" | "draft" | "published">("all");

  const blogSchema = z.object({
    title: z.string().min(3),
    date: z.string().min(4),
    excerpt: z.string().min(10),
    image: z.string().url(),
    category: z.string().min(1),
    featured: z.boolean().optional(),
    content: z.string().min(20),
    status: z.enum(["draft", "published"]),
  });

  type BlogFormData = z.infer<typeof blogSchema>;

  const slugify = (title: string) =>
    encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"));

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
  });

  //
  // LOAD POSTS FROM DATABASE
  //
  React.useEffect(() => {
    async function load() {
      const data = await getStoredPosts();
      setPosts(data);
    }
    load();
  }, []);

  //
  // SUBMIT HANDLER
  //
  const onSubmit = async (data: BlogFormData) => {
    const now = new Date().toISOString();
    const existing = posts.find(
      (p) => p.title.toLowerCase() === data.title.toLowerCase()
    );

    const updatedPost: BlogPost = {
      title: data.title,
      date: data.date,
      excerpt: data.excerpt,
      image: data.image,
      category: data.category,
      featured: !!data.featured,
      content: data.content,
      status: data.status,
      id: existing?.id || crypto.randomUUID(),
      slug: slugify(data.title),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      version: existing?.version ? existing.version + 1 : 1,
    };

    if (existing) {
      await updatePost(updatedPost);
      toast({ title: "Post Updated", description: `"${data.title}" has been updated.` });
    } else {
      const { id, ...postWithoutId } = updatedPost;
      await savePost(postWithoutId);
      toast({ title: "Post Created", description: `"${data.title}" has been saved.` });
    }

    reset();

    const refreshed = await getStoredPosts();
    setPosts(refreshed);
  };

  //
  // EDIT HANDLER
  //
  const handleEdit = (post: BlogPost) => {
    reset(post);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  //
  // DELETE HANDLER
  //
  const handleDeleteConfirmed = async (id: string) => {
    await deletePost(id);
    toast({ title: "Post Deleted", description: "The post has been removed." });

    const refreshed = await getStoredPosts();
    setPosts(refreshed);
    reset();
  };

  //
  // FILTER POSTS
  //
  const filteredPosts = posts
    .filter((p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((p) => filterStatus === "all" || p.status === filterStatus);

  //
  // RENDER
  //
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-10">

      {/* FORM */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input placeholder="Title" {...register("title")} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}

        <Input type="date" {...register("date")} />
        {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}

        <Textarea placeholder="Excerpt" rows={4} {...register("excerpt")} />
        {errors.excerpt && <p className="text-sm text-destructive">{errors.excerpt.message}</p>}

        {/* MARKDOWN EDITOR */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-elegant-text">Content</label>

          <Textarea
            placeholder="Write your markdown content here..."
            rows={12}
            value={watch("content")}
            onChange={(e) => setValue("content", e.target.value)}
          />

          <div className="border rounded p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-2">Preview</h3>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{watch("content")}</ReactMarkdown>
            </div>
          </div>
        </div>

        {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}

        <Input placeholder="Image URL" {...register("image")} />
        {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}

        <select {...register("category")} className="w-full border rounded px-3 py-2 text-sm">
          <option value="">Select a category</option>
          {categories.map(({ label }) => (
            <option key={label} value={label}>{label}</option>
          ))}
        </select>
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}

        <select {...register("status")} className="w-full border rounded px-3 py-2 text-sm">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}

        <div className="bg-muted/50 border rounded px-3 py-2 text-sm flex items-center gap-3">
          <input
            type="checkbox"
            id="featured"
            {...register("featured")}
            className="h-4 w-4 accent-elegant-primary"
          />
          <label htmlFor="featured" className="text-sm text-elegant-text">
            Mark this post as featured
          </label>
        </div>

        <div className="flex justify-between items-center">
          <Button type="submit">Publish</Button>
          <Button type="button" variant="outline" onClick={() => reset()}>
            Clear Form
          </Button>
        </div>
      </form>

      {/* POSTS LIST */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-elegant-text">Saved Posts</h2>
        {filteredPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts found.</p>
        ) : (
          <ul className="space-y-3">
            {filteredPosts.map((post) => (
              <li
                key={post.id}
                className="border border-border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-medium text-elegant-text">{post.title}</h4>
                  <p className="whitespace-pre-line text-xs text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.date} • {post.status} • v{post.version ?? 1}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => handleEdit(post)}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteConfirmed(post.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
