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
  type NewPostInput,
  type UpdatePostInput,
} from "@/lib/postStore";

import type { BlogPost } from "@/data/posts";
import { categories } from "@/data/categories";

// Token-based auth: User enters token at login gate, stored in sessionStorage.
// Token is sent in Authorization header for each request and validated by server.
// This way, the token is never embedded in source code or visible to dev tools observers.

function AdminGate({ onSuccess }: { onSuccess: () => void }) {
  const [token, setToken] = React.useState("");
  const [error, setError] = React.useState("");

  const handleEnter = () => {
    if (!token.trim()) {
      setError("Please enter the admin token");
      return;
    }

    // Store token in sessionStorage; postStore will use it for requests
    sessionStorage.setItem("adminToken", token);
    setError("");
    onSuccess();
  };

  return (
    <div className="max-w-sm mx-auto py-24 space-y-4">
      <h2 className="text-xl font-semibold text-center">Admin Access</h2>
      <p className="text-sm text-center text-muted-foreground">
        Enter the admin token to manage posts.
      </p>

      <Input
        type="password"
        placeholder="Enter admin token"
        value={token}
        onChange={(e) => {
          setToken(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && handleEnter()}
      />

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button className="w-full" onClick={handleEnter}>
        Access Admin Panel
      </Button>
    </div>
  );
}

export default function Admin() {
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (token) setAuthorized(true);
  }, []);

  if (!authorized) {
    return <AdminGate onSuccess={() => setAuthorized(true)} />;
  }

  return <AdminContent />;

export function AdminContent() {
  React.useEffect(() => {
    document.title = "Admin – Shared Experiences – Richard Sterling Jackson";
  }, []);

  const { toast } = useToast();
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = React.useState<BlogPost | null>(null);
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

  React.useEffect(() => {
    async function load() {
      const data = await getStoredPosts();
      setPosts(data);
    }
    load();
  }, []);

  const onSubmit = async (data: BlogFormData) => {
    try {
      if (editingPost) {
        const payload: UpdatePostInput = {
          title: data.title,
          date: data.date,
          excerpt: data.excerpt,
          image: data.image,
          category: data.category,
          content: data.content,
          status: data.status,
          featured: !!data.featured,
          slug: editingPost.slug ?? data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), // fallback slug
        };

        const updated = await updatePost(editingPost.id, payload);
        if (!updated) {
          toast({ title: "Update Failed", description: "Unable to update post. Check console for details.", variant: "destructive" });
          return;
        }

        toast({ title: "Post Updated", description: `"${data.title}" has been updated.` });
      } else {
        const payload: NewPostInput = {
          title: data.title,
          date: data.date,
          excerpt: data.excerpt,
          image: data.image,
          category: data.category,
          content: data.content,
          status: data.status,
          featured: !!data.featured,
        };

        const created = await savePost(payload);
        if (!created) {
          toast({ title: "Create Failed", description: "Unable to create post. Check console for details.", variant: "destructive" });
          return;
        }

        toast({ title: "Post Created", description: `"${data.title}" has been saved.` });
      }

      reset();
      setEditingPost(null);

      const refreshed = await getStoredPosts();
      setPosts(refreshed);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("onSubmit error:", err);
      toast({ title: "Save Failed", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    reset({
      title: post.title,
      date: post.date,
      excerpt: post.excerpt,
      image: post.image,
      category: post.category,
      featured: post.featured ?? false,
      content: post.content,
      status: post.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteConfirmed = async (id: string) => {
    try {
      const ok = await deletePost(id);
      if (!ok) {
        toast({ title: "Delete Failed", description: "Unable to delete post. Check console for details.", variant: "destructive" });
        return;
      }

      toast({ title: "Post Deleted", description: "The post has been removed." });

      const refreshed = await getStoredPosts();
      setPosts(refreshed);

      reset();
      setEditingPost(null);
    } catch (err) {
      console.error("handleDeleteConfirmed error:", err);
      toast({ title: "Delete Failed", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const filteredPosts = posts
    .filter((p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((p) => filterStatus === "all" || p.status === filterStatus);

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
            <option key={label} value={label}>
              {label}
            </option>
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
          <Button type="submit">
            {editingPost ? "Update Post" : "Publish"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              setEditingPost(null);
            }}
          >
            Clear Form
          </Button>
        </div>
      </form>

      {/* POSTS LIST CONTROLS */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-elegant-text">Saved Posts</h2>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search by title or excerpt"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:flex-1"
          />

          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "draft" | "published")
            }
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

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
                  <Button variant="ghost" onClick={() => handleEdit(post)}>
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete</Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteConfirmed(post.id)}
                        >
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
