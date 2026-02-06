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
import adminBgImage from "@/assets/blog-post-2.jpg";

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
  const [sessionExpired, setSessionExpired] = React.useState(false);

  React.useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (token) setAuthorized(true);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    setAuthorized(false);
  };

  if (sessionExpired) {
    return (
      <div className="max-w-sm mx-auto py-24 space-y-4 text-center">
        <h2 className="text-xl font-semibold">Session Expired</h2>
        <p className="text-sm text-muted-foreground">
          Your session has timed out after 30 minutes of inactivity.
        </p>
        <Button onClick={() => { setSessionExpired(false); handleLogout(); }}>
          Return to Login
        </Button>
      </div>
    );
  }

  if (!authorized) {
    return <AdminGate onSuccess={() => setAuthorized(true)} />;
  }

  return <AdminContent onSessionExpired={() => setSessionExpired(true)} onLogout={handleLogout} />;
}

export function AdminContent({ onSessionExpired, onLogout }: { onSessionExpired: () => void; onLogout: () => void }) {
  React.useEffect(() => {
    document.title = "Admin – Shared Experiences – Richard Sterling Jackson";
  }, []);

  const { toast } = useToast();
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = React.useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<"all" | "draft" | "published">("all");
  const [selectedPostIds, setSelectedPostIds] = React.useState<Set<string>>(new Set());
  const [timeoutWarning, setTimeoutWarning] = React.useState(false);
  const [imageMode, setImageMode] = React.useState<"url" | "upload">("url");
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);

  // Session timeout: 30 minutes (1800 seconds)
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const WARNING_TIME = 27 * 60 * 1000; // Warn at 27 minutes

  const resetTimeout = React.useCallback(() => {
    sessionStorage.setItem("lastActivity", Date.now().toString());
    setTimeoutWarning(false);
  }, []);

  React.useEffect(() => {
    // Set initial activity
    resetTimeout();

    // Check session timeout periodically
    const checkInterval = setInterval(() => {
      const lastActivity = sessionStorage.getItem("lastActivity");
      if (!lastActivity) {
        resetTimeout();
        return;
      }

      const timeSinceActivity = Date.now() - parseInt(lastActivity);

      if (timeSinceActivity >= SESSION_TIMEOUT) {
        // Session expired
        onSessionExpired();
        sessionStorage.removeItem("adminToken");
      } else if (timeSinceActivity >= WARNING_TIME && !timeoutWarning) {
        // Show warning
        setTimeoutWarning(true);
      }
    }, 10000); // Check every 10 seconds

    // Track user activity
    const events = ["mousedown", "keydown", "touchstart", "click"];
    const handleActivity = () => resetTimeout();

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      clearInterval(checkInterval);
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [SESSION_TIMEOUT, WARNING_TIME, timeoutWarning, onSessionExpired, resetTimeout]);

  const blogSchema = z.object({
    title: z.string().min(3),
    date: z.string().min(4),
    excerpt: z.string().min(10),
    image: z.string().url(),
    category: z.string().min(1),
    featured: z.boolean().optional(),
    content: z.string().min(20),
    status: z.enum(["draft", "published"]),
    scheduledAt: z.string().optional(),
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

  const handleImageUpload = async (file: File) => {
    setUploadError("");
    setUploadingImage(true);
    try {
      const signRes = await fetch("/api/cloudinary/sign");
      if (!signRes.ok) {
        throw new Error("Failed to get upload signature");
      }

      const { cloudName, apiKey, timestamp, signature, folder } = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = await uploadRes.json();
      if (uploadData.secure_url) {
        setValue("image", uploadData.secure_url, { shouldValidate: true });
      }
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSelectUploadMode = React.useCallback(() => {
    setImageMode("upload");
    requestAnimationFrame(() => {
      uploadInputRef.current?.click();
    });
  }, []);

  React.useEffect(() => {
    async function load() {
      const data = await getStoredPosts();
      setPosts(data);
    }
    load();
  }, []);

  const onSubmit = async (data: BlogFormData) => {
    if (uploadingImage) {
      toast({
        title: "Image Uploading",
        description: "Please wait for the upload to finish before publishing.",
        variant: "destructive",
      });
      return;
    }

    if (imageMode === "upload" && !data.image) {
      toast({
        title: "Image Missing",
        description: "Please upload an image before publishing.",
        variant: "destructive",
      });
      return;
    }

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
          slug: editingPost.slug ?? data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          scheduledAt: data.scheduledAt || null,
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

        const created = await savePost({
          ...payload,
          scheduledAt: data.scheduledAt || null,
        });
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
      setSelectedPostIds(new Set());

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
      scheduledAt: post.scheduledAt ?? "",
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
      setSelectedPostIds(new Set());
    } catch (err) {
      console.error("handleDeleteConfirmed error:", err);
      toast({ title: "Delete Failed", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      let failCount = 0;
      for (const id of Array.from(selectedPostIds)) {
        const ok = await deletePost(id);
        if (!ok) failCount++;
      }

      const successCount = selectedPostIds.size - failCount;
      toast({
        title: `Deleted ${successCount} post${successCount !== 1 ? "s" : ""}`,
        description: failCount > 0 ? `Failed to delete ${failCount} post${failCount !== 1 ? "s" : ""}.` : undefined,
      });

      const refreshed = await getStoredPosts();
      setPosts(refreshed);
      setSelectedPostIds(new Set());
      reset();
      setEditingPost(null);
    } catch (err) {
      console.error("handleBulkDelete error:", err);
      toast({ title: "Bulk Delete Failed", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleBulkStatusChange = async (newStatus: "draft" | "published") => {
    try {
      let failCount = 0;
      for (const id of Array.from(selectedPostIds)) {
        const post = posts.find((p) => p.id === id);
        if (!post) continue;

        const payload: UpdatePostInput = {
          title: post.title,
          date: post.date,
          excerpt: post.excerpt,
          image: post.image,
          category: post.category,
          content: post.content,
          status: newStatus,
          featured: post.featured ?? false,
          slug: post.slug,
        };

        const ok = await updatePost(id, payload);
        if (!ok) failCount++;
      }

      const successCount = selectedPostIds.size - failCount;
      const action = newStatus === "published" ? "Published" : "Drafted";
      toast({
        title: `${action} ${successCount} post${successCount !== 1 ? "s" : ""}`,
        description: failCount > 0 ? `Failed to update ${failCount} post${failCount !== 1 ? "s" : ""}.` : undefined,
      });

      const refreshed = await getStoredPosts();
      setPosts(refreshed);
      setSelectedPostIds(new Set());
    } catch (err) {
      console.error("handleBulkStatusChange error:", err);
      toast({ title: "Bulk Update Failed", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const toggleSelectPost = (id: string) => {
    const newSelected = new Set(selectedPostIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPostIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPostIds.size === filteredPosts.length) {
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(new Set(filteredPosts.map((p) => p.id)));
    }
  };

  const filteredPosts = posts
    .filter((p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((p) => filterStatus === "all" || p.status === filterStatus);

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === "published").length;

  return (
    <div
      className="min-h-screen py-10 px-4 relative"
      style={{
        backgroundImage: `url(${adminBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Background overlay with 50% opacity */}
      <div className="absolute inset-0 bg-white/50 z-0" />

      {/* Content container with relative positioning */}
      <div className="relative z-10">
        {/* Session timeout warning */}
        {timeoutWarning && (
          <div className="mb-6 max-w-2xl mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Your session will expire in 3 minutes due to inactivity. Move your mouse or click to extend your session.
            </p>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-10">
          {/* Header with stats and logout */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-elegant-text">Admin Panel</h1>
              <div className="flex gap-6 mt-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-semibold text-elegant-text">{totalPosts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Published</p>
                  <p className="text-2xl font-semibold text-elegant-primary">{publishedPosts}</p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-background/95 p-6 rounded-lg border">
            <Input placeholder="Title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}

            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}

            <Textarea placeholder="Excerpt" rows={4} {...register("excerpt")} />
            {errors.excerpt && <p className="text-sm text-destructive">{errors.excerpt.message}</p>}

            {/* MARKDOWN EDITOR */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-elegant-text">Content</label>

              {/* Formatting Toolbar */}
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 border rounded">
                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = watch("content").substring(start, end);
                      const before = watch("content").substring(0, start);
                      const after = watch("content").substring(end);
                      setValue("content", `${before}**${selected || "bold text"}**${after}`);
                    }
                  }}
                  className="px-3 py-1 bg-background border rounded text-sm hover:bg-muted font-semibold"
                  title="Bold"
                >
                  B
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = watch("content").substring(start, end);
                      const before = watch("content").substring(0, start);
                      const after = watch("content").substring(end);
                      setValue("content", `${before}*${selected || "italic text"}*${after}`);
                    }
                  }}
                  className="px-3 py-1 bg-background border rounded text-sm hover:bg-muted italic"
                  title="Italic"
                >
                  I
                </button>

                <div className="border-l border-border"></div>

                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = watch("content").substring(start, end);
                      const before = watch("content").substring(0, start);
                      const after = watch("content").substring(end);
                      setValue("content", `${before}# ${selected || "Heading"}${after}`);
                    }
                  }}
                  className="px-3 py-1 bg-background border rounded text-sm hover:bg-muted text-lg font-bold"
                  title="Heading 1"
                >
                  H1
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = watch("content").substring(start, end);
                      const before = watch("content").substring(0, start);
                      const after = watch("content").substring(end);
                      setValue("content", `${before}## ${selected || "Heading"}${after}`);
                    }
                  }}
                  className="px-3 py-1 bg-background border rounded text-sm hover:bg-muted text-base font-bold"
                  title="Heading 2"
                >
                  H2
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = watch("content").substring(start, end);
                      const before = watch("content").substring(0, start);
                      const after = watch("content").substring(end);
                      setValue("content", `${before}### ${selected || "Heading"}${after}`);
                    }
                  }}
                  className="px-3 py-1 bg-background border rounded text-sm hover:bg-muted font-bold"
                  title="Heading 3"
                >
                  H3
                </button>

                <div className="border-l border-border"></div>

                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = watch("content").substring(start, end);
                      const before = watch("content").substring(0, start);
                      const after = watch("content").substring(end);
                      setValue("content", `${before}- ${selected || "List item"}\n${after}`);
                    }
                  }}
                  className="px-3 py-1 bg-background border rounded text-sm hover:bg-muted"
                  title="Bullet List"
                >
                  • List
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = watch("content").substring(start, end);
                      const before = watch("content").substring(0, start);
                      const after = watch("content").substring(end);
                      setValue("content", `${before}\`\`\`\n${selected || "code"}\n\`\`\`\n${after}`);
                    }
                  }}
                  className="px-3 py-1 bg-background border rounded text-sm hover:bg-muted font-mono"
                  title="Code Block"
                >
                  Code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = watch("content").substring(start, end);
                      const before = watch("content").substring(0, start);
                      const after = watch("content").substring(end);
                      setValue("content", `${before}[${selected || "link text"}](https://example.com)${after}`);
                    }
                  }}
                  className="px-3 py-1 bg-background border rounded text-sm hover:bg-muted text-blue-600 underline"
                  title="Link"
                >
                  Link
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = watch("content").substring(start, end);
                      const before = watch("content").substring(0, start);
                      const after = watch("content").substring(end);
                      setValue("content", `${before}> ${selected || "Quote"}${after}`);
                    }
                  }}
                  className="px-3 py-1 bg-background border rounded text-sm hover:bg-muted border-l-4 border-l-muted-foreground pl-2"
                  title="Quote"
                >
                  Quote
                </button>
              </div>

              <Textarea
                id="content-textarea"
                placeholder="Write your markdown content here... Use the toolbar above for formatting"
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

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setImageMode("url")}
                className={`px-2 py-1 rounded border ${imageMode === "url" ? "border-elegant-primary text-elegant-primary" : "border-border text-muted-foreground"}`}
              >
                Use URL
              </button>
              <button
                type="button"
                onClick={handleSelectUploadMode}
                className={`px-2 py-1 rounded border ${imageMode === "upload" ? "border-elegant-primary text-elegant-primary" : "border-border text-muted-foreground"}`}
              >
                Upload Image
              </button>
            </div>

            {imageMode === "url" ? (
              <Input placeholder="Image URL" {...register("image")} />
            ) : (
              <div className="space-y-2">
                <input type="hidden" {...register("image")} />
                <div className="flex items-center gap-3">
                  <Input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploadingImage}
                  />
                  <span className="text-xs text-muted-foreground">
                    {uploadingImage ? "Uploading…" : "JPG/PNG"}
                  </span>
                </div>
                {watch("image") ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={watch("image")}
                      alt="Uploaded preview"
                      className="h-16 w-16 rounded object-cover border"
                    />
                    <span className="text-xs text-muted-foreground">Image ready</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No image uploaded yet</span>
                )}
              </div>
            )}

            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
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

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Schedule publish (optional)</label>
              <Input type="datetime-local" {...register("scheduledAt")} />
            </div>

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
              <Button
                type="submit"
                disabled={
                  uploadingImage ||
                  (imageMode === "upload" && !watch("image"))
                }
              >
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
          <div className="space-y-3 bg-background/95 p-6 rounded-lg border">
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

            {/* Bulk actions toolbar */}
            {selectedPostIds.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedPostIds.size} post{selectedPostIds.size !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange("published")}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange("draft")}
                  >
                    Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Delete ${selectedPostIds.size} post${selectedPostIds.size !== 1 ? "s" : ""}?`)) {
                        handleBulkDelete();
                      }
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedPostIds(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {filteredPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts found.</p>
            ) : (
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <input
                    type="checkbox"
                    checked={selectedPostIds.size === filteredPosts.length && filteredPosts.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                  <span className="flex-1">Select All</span>
                </li>
                {filteredPosts.map((post) => (
                  <li
                    key={post.id}
                    className="border border-border rounded p-4 flex gap-4 items-start"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPostIds.has(post.id)}
                      onChange={() => toggleSelectPost(post.id)}
                      className="h-4 w-4 mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-elegant-text">{post.title}</h4>
                      <p className="whitespace-pre-line text-xs text-muted-foreground">
                        {post.excerpt}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {post.date} • {post.status} • v{post.version ?? 1}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
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
      </div>
    </div>
  );
}
