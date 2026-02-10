"use client";

// Admin dashboard: auth gate + post editor + backups + home featured + site settings + post list.
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import adminBgImage from "@/assets/blog-post-2.webp";

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
  setMainFeaturedPost,
  type NewPostInput,
  type UpdatePostInput,
} from "@/lib/postStore";

import type { BlogPost } from "@/data/posts";
import { categories } from "@/data/categories";

// Token-based auth: User enters token at login gate.
// Server sets an HttpOnly cookie session; the token is not stored in the browser.
type HomeFeaturedPayload = {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCategory: string;
  bubbleHeading?: string;
  bubbleTitle?: string;
  bubbleDescription?: string;
  cards: Array<{
    image: string;
    fallbackImage?: string;
    title: string;
    category: string;
    excerpt: string;
    date: string;
    link: string;
    readMoreLabel: string;
  }>;
};

type SiteSettingsPayload = {
  postFallbackImage: string;
  categoriesImage: string;
  categoriesFallbackImage: string;
  categoryCardImages: Record<string, { image: string; fallbackImage: string }>;
  categoryCardExcerpts: Record<string, string>;
  featuredArticleSlug: string;
  categoriesHeadingEyebrow: string;
  categoriesHeadingTitle: string;
  categoriesHeadingSubtitle: string;
  articlesSpotlightEyebrow: string;
  articlesSpotlightTitle: string;
  articlesSpotlightSubtitle: string;
};

type MediaLibraryAsset = {
  secure_url?: string;
};

type MediaLibraryInsertData = {
  assets?: MediaLibraryAsset[];
};

type MediaLibraryInstance = {
  show: () => void;
  hide: () => void;
};

type CloudinaryMediaLibrary = {
  createMediaLibrary: (
    config: { cloud_name: string; api_key: string; multiple?: boolean },
    options: { insertHandler: (data: MediaLibraryInsertData) => void },
    target: HTMLElement
  ) => MediaLibraryInstance;
};

function AdminGate({ onSuccess }: { onSuccess: () => void }) {
  const [token, setToken] = React.useState("");
  const [error, setError] = React.useState("");

  const handleEnter = async () => {
    if (!token.trim()) {
      setError("Please enter the admin token");
      return;
    }

    try {
      const res = await fetch("/api/admin?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          setError("Too many attempts. Please wait and try again.");
        } else {
          setError("Invalid token");
        }
        return;
      }
      setError("");
      onSuccess();
    } catch (err) {
      console.error("Admin login failed:", err);
      setError("Login failed. Try again.");
    }
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
    fetch("/api/admin?action=me", { credentials: "include" })
      .then((res) => {
        if (res.ok) setAuthorized(true);
      })
      .catch((err) => console.error("Admin session check failed:", err));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin?action=logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Admin logout failed:", err);
    } finally {
      setAuthorized(false);
    }
  };

  if (sessionExpired) {
    return (
      <div className="max-w-sm mx-auto py-24 space-y-4 text-center">
        <h2 className="text-xl font-semibold">Session Expired</h2>
        <p className="text-sm text-muted-foreground">
          Your session has timed out after 60 minutes of inactivity.
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
    // Bulk delete selected posts
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
        resetForm();
      } catch (err) {
        console.error("handleBulkDelete error:", err);
        toast({ title: "Bulk Delete Failed", description: "An unexpected error occurred.", variant: "destructive" });
      }
    };

    // Bulk status change for selected posts
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
            mainFeatured: newStatus === "published" ? post.mainFeatured ?? false : false,
            hidden: post.hidden ?? false,
            article: post.article ?? false,
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
  const [restoreFile, setRestoreFile] = React.useState<File | null>(null);
  const restoreInputRef = React.useRef<HTMLInputElement | null>(null);
  const [restoring, setRestoring] = React.useState(false);
  const [backupError, setBackupError] = React.useState("");
  const [homeUploading, setHomeUploading] = React.useState(false);
  const [homeUploadError, setHomeUploadError] = React.useState("");
  const [heroFileLabel, setHeroFileLabel] = React.useState("");
  const [cardFileLabels, setCardFileLabels] = React.useState<Record<number, string>>({});
  const [cardFallbackLabels, setCardFallbackLabels] = React.useState<Record<number, string>>({});
  const heroFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const cardFileInputs = React.useRef<(HTMLInputElement | null)[]>([]);
  const cardFallbackFileInputs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [cloudInfo, setCloudInfo] = React.useState<{ cloudName: string; apiKey: string } | null>(null);
  const [mediaLibraryReady, setMediaLibraryReady] = React.useState(false);
  const [homeSaving, setHomeSaving] = React.useState(false);
  const [siteSettings, setSiteSettings] = React.useState<SiteSettingsPayload>({
    postFallbackImage: "",
    categoriesImage: "",
    categoriesFallbackImage: "",
    categoryCardImages: {},
    categoryCardExcerpts: {},
    featuredArticleSlug: "",
    categoriesHeadingEyebrow: "",
    categoriesHeadingTitle: "",
    categoriesHeadingSubtitle: "",
    articlesSpotlightEyebrow: "",
    articlesSpotlightTitle: "",
    articlesSpotlightSubtitle: "",
  });
  const [settingsSaving, setSettingsSaving] = React.useState(false);
  const [settingsFileLabel, setSettingsFileLabel] = React.useState("");
  const settingsFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [categoriesImageLabel, setCategoriesImageLabel] = React.useState("");
  const categoriesImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const [categoriesFallbackLabel, setCategoriesFallbackLabel] = React.useState("");
  const categoriesFallbackInputRef = React.useRef<HTMLInputElement | null>(null);
  const [categoryCardImageLabels, setCategoryCardImageLabels] = React.useState<Record<string, string>>({});
  const [categoryCardFallbackLabels, setCategoryCardFallbackLabels] = React.useState<Record<string, string>>({});
  const categoryCardImageInputs = React.useRef<(HTMLInputElement | null)[]>([]);
  const categoryCardFallbackInputs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [homeFeatured, setHomeFeatured] = React.useState<HomeFeaturedPayload>({
    heroImage: "",
    heroTitle: "",
    heroSubtitle: "",
    heroCategory: "",
    bubbleHeading: "",
    bubbleTitle: "",
    bubbleDescription: "",
    cards: [
      { image: "", fallbackImage: "", title: "", category: "", excerpt: "", date: "", link: "", readMoreLabel: "" },
      { image: "", fallbackImage: "", title: "", category: "", excerpt: "", date: "", link: "", readMoreLabel: "" },
      { image: "", fallbackImage: "", title: "", category: "", excerpt: "", date: "", link: "", readMoreLabel: "" },
    ],
  });

  const slugifyTitle = React.useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, []);

  // Session timeout: 60 minutes (3600 seconds)
  const SESSION_TIMEOUT = 60 * 60 * 1000;
  const WARNING_TIME = 57 * 60 * 1000; // Warn at 57 minutes

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
        fetch("/api/admin?action=logout", { method: "POST", credentials: "include" }).catch((err) =>
          console.error("Admin logout failed:", err)
        );
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
    mainFeatured: z.boolean().optional(),
    hidden: z.boolean().optional(),
    article: z.boolean().optional(),
    content: z.string().min(20),
    status: z.enum(["draft", "published"]),
    scheduledAt: z.string().optional(),
  });

  type BlogFormData = z.infer<typeof blogSchema>;

  const defaultValues = React.useMemo<BlogFormData>(
    () => ({
      title: "",
      date: "",
      excerpt: "",
      image: "",
      category: "",
      featured: false,
      mainFeatured: false,
      hidden: false,
      article: false,
      content: "",
      status: "draft",
      scheduledAt: "",
    }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues,
  });

  const resetForm = React.useCallback(() => {
    reset(defaultValues);
    setEditingPost(null);
    setImageMode("url");
    setUploadError("");
    setUploadingImage(false);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }, [defaultValues, reset, setEditingPost, setImageMode, setUploadError, setUploadingImage]);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadError(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleHomeImageUpload = async (file: File, onUrl: (url: string) => void) => {
    setHomeUploadError("");
    setHomeUploading(true);
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
        onUrl(uploadData.secure_url);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setHomeUploadError(message);
    } finally {
      setHomeUploading(false);
    }
  };

  const updateCard = (index: number, field: string, value: string) => {
    setHomeFeatured((prev) => ({
      ...prev,
      cards: prev.cards.map((card, idx) => (idx === index ? { ...card, [field]: value } : card)),
    }));
  };

  const updateCategoryCardImage = React.useCallback(
    (slug: string, field: "image" | "fallbackImage", value: string) => {
      setSiteSettings((prev) => ({
        ...prev,
        categoryCardImages: {
          ...prev.categoryCardImages,
          [slug]: {
            ...prev.categoryCardImages[slug],
            [field]: value,
          },
        },
      }));
    },
    []
  );

  const updateCategoryCardExcerpt = React.useCallback((slug: string, value: string) => {
    setSiteSettings((prev) => ({
      ...prev,
      categoryCardExcerpts: {
        ...prev.categoryCardExcerpts,
        [slug]: value,
      },
    }));
  }, []);

  const handleCardImageUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setCardFileLabels((prev) => ({ ...prev, [index]: file.name }));
    handleHomeImageUpload(file, (url) => updateCard(index, 'image', url));
  };

  const handleCardFallbackUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setCardFallbackLabels((prev) => ({ ...prev, [index]: file.name }));
    handleHomeImageUpload(file, (url) => updateCard(index, 'fallbackImage', url));
  };

  const handleSelectUploadMode = React.useCallback(() => {
    setImageMode("upload");
    requestAnimationFrame(() => {
      uploadInputRef.current?.click();
    });
  }, []);

  React.useEffect(() => {
    fetch("/api/cloudinary/sign")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.cloudName && data?.apiKey) {
          setCloudInfo({ cloudName: data.cloudName, apiKey: data.apiKey });
        }
      })
      .catch(() => {
        setHomeUploadError("Cloudinary credentials unavailable.");
      });
  }, []);

  React.useEffect(() => {
    if (mediaLibraryReady) return;
    const existing = document.getElementById("cloudinary-media-library");
    if (existing) {
      setMediaLibraryReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "cloudinary-media-library";
    script.src = "https://media-library.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => setMediaLibraryReady(true);
    script.onerror = () => setHomeUploadError("Cloudinary media library failed to load.");
    document.body.appendChild(script);
  }, [mediaLibraryReady]);

  const openMediaLibrary = React.useCallback(
    (onUrl: (url: string) => void) => {
      const cloudinary = (window as Window & { cloudinary?: CloudinaryMediaLibrary }).cloudinary;
      if (!cloudInfo || !mediaLibraryReady || !cloudinary?.createMediaLibrary) {
        setHomeUploadError("Media library not ready yet.");
        return;
      }
      const instance = cloudinary.createMediaLibrary(
        {
          cloud_name: cloudInfo.cloudName,
          api_key: cloudInfo.apiKey,
          multiple: false,
        },
        {
          insertHandler: (data: MediaLibraryInsertData) => {
            const asset = data?.assets?.[0];
            if (asset?.secure_url) {
              onUrl(asset.secure_url);
            }
            instance.hide();
          },
        },
        document.body
      );
      instance.show();
    },
    [cloudInfo, mediaLibraryReady]
  );

  React.useEffect(() => {
    async function load() {
      const data = await getStoredPosts();
      setPosts(data);
      try {
        const homeRes = await fetch("/api/posts?home=1", { credentials: "include", cache: "no-store" });
        if (homeRes.ok) {
          const homeData = (await homeRes.json()) as HomeFeaturedPayload | null;
          if (homeData) {
            setHomeFeatured((prev) => ({
              ...prev,
              ...homeData,
              cards: Array.isArray(homeData.cards) && homeData.cards.length === 3
                ? homeData.cards.map((card) => ({ ...card, fallbackImage: card.fallbackImage ?? "" }))
                : prev.cards,
            }));
          }
        }
        const settingsRes = await fetch("/api/posts?settings=1", { credentials: "include", cache: "no-store" });
        if (settingsRes.ok) {
          const settingsData = (await settingsRes.json()) as SiteSettingsPayload | null;
          if (settingsData) {
            setSiteSettings({
              postFallbackImage: settingsData.postFallbackImage || "",
              categoriesImage: settingsData.categoriesImage || "",
              categoriesFallbackImage: settingsData.categoriesFallbackImage || "",
              categoryCardImages: settingsData.categoryCardImages || {},
              categoryCardExcerpts: settingsData.categoryCardExcerpts || {},
              featuredArticleSlug: settingsData.featuredArticleSlug || "",
              categoriesHeadingEyebrow: settingsData.categoriesHeadingEyebrow || "",
              categoriesHeadingTitle: settingsData.categoriesHeadingTitle || "",
              categoriesHeadingSubtitle: settingsData.categoriesHeadingSubtitle || "",
              articlesSpotlightEyebrow: settingsData.articlesSpotlightEyebrow || "",
              articlesSpotlightTitle: settingsData.articlesSpotlightTitle || "",
              articlesSpotlightSubtitle: settingsData.articlesSpotlightSubtitle || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load home featured:", err);
      }
    }
    load();
  }, []);

  const handleSaveHomeFeatured = async () => {
    setHomeUploadError("");
    setHomeSaving(true);
    try {
      const res = await fetch("/api/posts?home=1", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        credentials: "include",
        body: JSON.stringify(homeFeatured),
      });
      if (!res.ok) {
        throw new Error("Failed to save home section");
      }
      const updated = await res.json();
      if (updated) {
        setHomeFeatured(updated);
      }
      toast({ title: "Home section saved", description: "Your featured section has been updated." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to save home section.";
      console.error("Save home featured failed:", err);
      toast({ title: "Save Failed", description: message, variant: "destructive" });
    } finally {
      setHomeSaving(false);
    }
  };

  const saveSiteSettings = async (next?: SiteSettingsPayload, options?: { silent?: boolean }) => {
    setHomeUploadError("");
    setSettingsSaving(true);
    try {
      const payload = next ?? siteSettings;
      const res = await fetch("/api/posts?settings=1", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to save site settings");
      }
      const updated = await res.json();
      if (updated) {
        setSiteSettings({
          postFallbackImage: updated.postFallbackImage || "",
          categoriesImage: updated.categoriesImage || "",
          categoriesFallbackImage: updated.categoriesFallbackImage || "",
          categoryCardImages: updated.categoryCardImages || {},
          categoryCardExcerpts: updated.categoryCardExcerpts || {},
          featuredArticleSlug: updated.featuredArticleSlug || "",
          categoriesHeadingEyebrow: updated.categoriesHeadingEyebrow || "",
          categoriesHeadingTitle: updated.categoriesHeadingTitle || "",
          categoriesHeadingSubtitle: updated.categoriesHeadingSubtitle || "",
          articlesSpotlightEyebrow: updated.articlesSpotlightEyebrow || "",
          articlesSpotlightTitle: updated.articlesSpotlightTitle || "",
          articlesSpotlightSubtitle: updated.articlesSpotlightSubtitle || "",
        });
      }
      if (!options?.silent) {
        toast({ title: "Settings saved", description: "Site-wide settings updated." });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to save site settings.";
      console.error("Save site settings failed:", err);
      if (!options?.silent) {
        toast({ title: "Save Failed", description: message, variant: "destructive" });
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveSiteSettings = async () => {
    await saveSiteSettings();
  };

  const handleBackupDownload = async () => {
    setBackupError("");
    try {
      const data = await getStoredPosts();
      const mainFeaturedSlug = data.find((post) => post.mainFeatured)?.slug ?? null;
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        mainFeaturedSlug,
        posts: data,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `shared-experiences-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup download failed:", err);
      setBackupError("Unable to download backup. Try again.");
    }
  };

  const parseBackup = (raw: string) => {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { posts: parsed as BlogPost[], mainFeaturedSlug: null };
    }

    const parsedObj = parsed as { posts?: BlogPost[]; mainFeaturedSlug?: string } | null;
    const posts = Array.isArray(parsedObj?.posts) ? parsedObj?.posts ?? [] : [];
    const mainFeaturedSlug = typeof parsedObj?.mainFeaturedSlug === "string" ? parsedObj.mainFeaturedSlug : null;
    return { posts, mainFeaturedSlug };
  };

  const normalizeRestorePost = (
    post: unknown
  ): NewPostInput & { slug?: string; scheduledAt?: string | null } | null => {
    if (!post || typeof post !== "object") return null;

    const data = post as Record<string, unknown>;
    const required = ["title", "date", "excerpt", "image", "category", "content", "status"];
    for (const field of required) {
      if (typeof data[field] !== "string" || !data[field]) return null;
    }

    const status = data.status === "published" ? "published" : "draft";

    return {
      title: data.title as string,
      date: data.date as string,
      excerpt: data.excerpt as string,
      image: data.image as string,
      category: data.category as string,
      content: data.content as string,
      status,
      featured: Boolean(data.featured),
      mainFeatured: Boolean(data.mainFeatured),
      hidden: typeof data.hidden === "boolean" ? data.hidden : false,
      article: typeof data.article === "boolean" ? data.article : false,
      scheduledAt: typeof data.scheduledAt === "string" ? data.scheduledAt : null,
      slug: typeof data.slug === "string" ? data.slug : undefined,
    };
  };

  const handleRestoreBackup = async () => {
    setBackupError("");
    if (!restoreFile) {
      setBackupError("Select a backup file first.");
      return;
    }

    if (!confirm("This will overwrite all existing posts. Continue?")) return;

    setRestoring(true);
    try {
      const raw = await restoreFile.text();
      const { posts: backupPosts } = parseBackup(raw);

      if (!backupPosts.length) {
        setBackupError("Backup file contains no posts.");
        setRestoring(false);
        return;
      }

      const existing = await getStoredPosts();
      let deleteFailures = 0;
      for (const post of existing) {
        const ok = await deletePost(post.id);
        if (!ok) deleteFailures++;
      }

      let createFailures = 0;
      let skipped = 0;
      for (const post of backupPosts) {
        const payload = normalizeRestorePost(post);
        if (!payload) {
          skipped++;
          continue;
        }

        const created = await savePost(payload);
        if (!created) createFailures++;
      }

      const refreshed = await getStoredPosts();
      setPosts(refreshed);
      setSelectedPostIds(new Set());

      if (deleteFailures || createFailures || skipped) {
        toast({
          title: "Restore completed with issues",
          description: `Delete failures: ${deleteFailures}. Create failures: ${createFailures}. Skipped: ${skipped}.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Restore complete", description: "Backup has been restored." });
      }
    } catch (err) {
      console.error("Restore failed:", err);
      setBackupError("Restore failed. Check the file and try again.");
    } finally {
      setRestoring(false);
    }
  };

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
          mainFeatured: !!(editingPost.mainFeatured && data.featured && data.status === "published"),
          hidden: !!data.hidden,
          article: !!data.article,
          slug: slugifyTitle(data.title),
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
          mainFeatured: false,
          hidden: typeof data.hidden === "boolean" ? data.hidden : false,
          article: typeof data.article === "boolean" ? data.article : false,
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

      resetForm();

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
      mainFeatured: post.mainFeatured ?? false,
      hidden: post.hidden ?? false,
      article: post.article ?? false,
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
      resetForm();
      setSelectedPostIds(new Set());
    } catch (err) {
      console.error("handleDeleteConfirmed error:", err);
      toast({ title: "Delete Failed", description: "An unexpected error occurred.", variant: "destructive" });
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
  const draftPosts = posts.filter((p) => p.status === "draft").length;

  const setMainFeatured = async (targetId: string) => {
    const post = posts.find((p) => p.id === targetId);
    if (!post) return;

    // Use atomic API so one post is main featured across all browsers/tabs
    const ok = await setMainFeaturedPost(targetId);
    if (!ok) {
      toast({ title: "Feature update failed", description: "Could not update main feature.", variant: "destructive" });
      return;
    }
    toast({ title: "Main feature set", description: `"${post.title}" will show on the home page.` });
    const refreshed = await getStoredPosts();
    setPosts(refreshed);
  };

  const handleSetMainFeatured = (post: BlogPost) => {
    if (!post.featured || post.status !== "published") {
      toast({ title: "Make it featured", description: "Only featured, published posts can be the main feature.", variant: "destructive" });
      return;
    }

    setMainFeatured(post.id);
  };

  const handleSetFeaturedArticle = async (post: BlogPost) => {
    if (!post.article) {
      toast({ title: "Not an article", description: "Only article posts can be featured here.", variant: "destructive" });
      return;
    }
    if (!post.featured) {
      toast({ title: "Mark as featured", description: "Only featured articles can be set as main.", variant: "destructive" });
      return;
    }
    if (post.status !== "published") {
      toast({ title: "Publish first", description: "Only published articles can be featured.", variant: "destructive" });
      return;
    }
    const next = { ...siteSettings, featuredArticleSlug: post.slug };
    setSiteSettings(next);
    await saveSiteSettings(next, { silent: true });
    toast({ title: "Featured article set", description: `"${post.title}" will appear at the top of Articles.` });
  };

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
        <div className="max-w-5xl mx-auto mb-4">
          <a
            href="/"
            className="text-sm font-medium text-elegant-primary hover:text-elegant-secondary transition-colors"
          >
            ← Back to Home
          </a>
        </div>
        {/* Session timeout warning */}
        {timeoutWarning && (
          <div className="mb-6 max-w-5xl mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Your session will expire in 3 minutes due to inactivity. Move your mouse or click to extend your session.
            </p>
          </div>
        )}

        <div className="max-w-5xl mx-auto space-y-10">
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
                  <p className="text-2xl font-semibold text-orange-500">{publishedPosts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-semibold text-elegant-primary">{draftPosts}</p>
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
                  <ReactMarkdown
                    remarkPlugins={[remarkBreaks]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-4 last:mb-0">{children}</p>
                      ),
                      br: () => <span className="block h-4" />,
                    }}
                  >
                    {watch("content")}
                  </ReactMarkdown>
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
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploadingImage}
                    className="sm:w-auto"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                    onClick={() =>
                      openMediaLibrary((url) => {
                        setValue("image", url, { shouldValidate: true });
                        if (uploadInputRef.current) {
                          uploadInputRef.current.value = "";
                        }
                      })
                    }
                    disabled={uploadingImage || !mediaLibraryReady || !cloudInfo}
                  >
                    Library
                  </button>
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
            <div className="bg-muted/50 border rounded px-3 py-2 text-sm flex items-center gap-3">
              <input
                type="checkbox"
                id="hidden"
                {...register("hidden")}
                className="h-4 w-4 accent-elegant-primary"
              />
              <label htmlFor="hidden" className="text-sm text-elegant-text">
                Is hidden (exclude from recent lists)
              </label>
            </div>
            <div className="bg-muted/50 border rounded px-3 py-2 text-sm flex items-center gap-3">
              <input
                type="checkbox"
                id="article"
                {...register("article")}
                className="h-4 w-4 accent-elegant-primary"
              />
              <label htmlFor="article" className="text-sm text-elegant-text">
                Article (show only on Articles page)
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
                  resetForm();
                }}
              >
                Clear Form
              </Button>
            </div>
          </form>

          {/* BACKUP & RESTORE */}
          <div className="space-y-3 bg-background/95 p-6 rounded-lg border">
            <h2 className="text-xl font-semibold text-elegant-text">Backup & Restore</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Button type="button" variant="default" size="default" onClick={handleBackupDownload}>
                Download Backup
              </Button>
              <div className="flex flex-1 flex-col sm:flex-row gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept="application/json"
                    className="rounded border border-border bg-background/60 px-3 py-2 text-sm"
                    onChange={(event) => {
                      setBackupError("");
                      setRestoreFile(event.target.files?.[0] ?? null);
                    }}
                  />

                  {restoreFile && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        Selected: {restoreFile.name} ({(restoreFile.size / 1024).toFixed(1)} KB)
                      </p>
                      <button
                        type="button"
                        className="text-xs underline text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setRestoreFile(null);
                          if (restoreInputRef.current) {
                            restoreInputRef.current.value = "";
                          }
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleRestoreBackup}
                  disabled={restoring || !restoreFile}
                >
                  {restoring ? "Restoring…" : "Restore Backup"}
                </Button>
              </div>

              {backupError && (
                <p className="text-sm text-destructive">{backupError}</p>
              )}
            </div>
          </div>

          {/* HOME FEATURED */}
          <div className="space-y-6 bg-background/95 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-elegant-text">Home Featured</h2>
                <p className="text-sm text-muted-foreground">Controls the hero and "Good Things" cards on the home page.</p>
              </div>
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handleSaveHomeFeatured}
              >
                {homeSaving ? "Saving..." : "Save Home Section"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3 bg-card border border-border rounded-lg p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hero Copy</p>
                <Input
                  placeholder="Category label"
                  value={homeFeatured.heroCategory}
                  onChange={(e) => setHomeFeatured({ ...homeFeatured, heroCategory: e.target.value })}
                />
                <Input
                  placeholder="Big headline"
                  value={homeFeatured.heroTitle}
                  onChange={(e) => setHomeFeatured({ ...homeFeatured, heroTitle: e.target.value })}
                />
                <Textarea
                  placeholder="Supporting subtitle"
                  value={homeFeatured.heroSubtitle}
                  onChange={(e) => setHomeFeatured({ ...homeFeatured, heroSubtitle: e.target.value })}
                  rows={2}
                />
                <Input
                  placeholder="Bubble heading"
                  value={homeFeatured.bubbleHeading}
                  onChange={(e) => setHomeFeatured({ ...homeFeatured, bubbleHeading: e.target.value })}
                />
                <Input
                  placeholder="Bubble title"
                  value={homeFeatured.bubbleTitle}
                  onChange={(e) => setHomeFeatured({ ...homeFeatured, bubbleTitle: e.target.value })}
                />
                <Textarea
                  placeholder="Bubble description"
                  value={homeFeatured.bubbleDescription}
                  onChange={(e) => setHomeFeatured({ ...homeFeatured, bubbleDescription: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-3 bg-card border border-border rounded-lg p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hero Image</p>
                <Input
                  placeholder="Image URL"
                  value={homeFeatured.heroImage}
                  onChange={(e) => setHomeFeatured({ ...homeFeatured, heroImage: e.target.value })}
                />
                <input
                  ref={heroFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setHeroFileLabel(file.name);
                      handleHomeImageUpload(file, (url) =>
                        setHomeFeatured((prev) => ({ ...prev, heroImage: url }))
                      );
                    }
                  }}
                />
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={homeUploading}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                    onClick={() => openMediaLibrary((url) =>
                      setHomeFeatured((prev) => {
                        setHeroFileLabel("From library");
                        return { ...prev, heroImage: url };
                      })
                    )}
                    disabled={homeUploading || !mediaLibraryReady || !cloudInfo}
                  >
                    Library
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {homeUploading ? "Uploading..." : "JPG/PNG recommended"}
                  </span>
                  {heroFileLabel && (
                    <span className="text-[11px] px-2 py-1 rounded border border-border bg-muted/70 text-elegant-text">
                      {heroFileLabel}
                    </span>
                  )}
                </div>
                {homeFeatured.heroImage && (
                  <img src={homeFeatured.heroImage} alt="Hero" className="w-full rounded-md border" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {homeFeatured.cards.map((card, index) => (
                <div key={index} className="space-y-3 bg-card border border-border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-elegant-text">Card {index + 1}</h3>
                  <Input
                    placeholder="Image URL"
                    value={card.image}
                    onChange={(e) => updateCard(index, 'image', e.target.value)}
                  />
                  <input
                    ref={(el) => {
                      cardFileInputs.current[index] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleCardImageUpload(e, index)}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                      onClick={() => cardFileInputs.current[index]?.click()}
                      disabled={homeUploading}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                      onClick={() =>
                        openMediaLibrary((url) => {
                          setCardFileLabels((prev) => ({ ...prev, [index]: "From library" }));
                          updateCard(index, 'image', url);
                        })
                      }
                      disabled={homeUploading || !mediaLibraryReady || !cloudInfo}
                    >
                      Library
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {homeUploading ? "Uploading..." : "JPG/PNG"}
                    </span>
                    {cardFileLabels[index] && (
                      <span className="text-[11px] px-2 py-1 rounded border border-border bg-muted/70 text-elegant-text">
                        {cardFileLabels[index]}
                      </span>
                    )}
                  </div>
                  {card.image && (
                    <img
                      src={card.image}
                      alt={`Card ${index + 1}`}
                      className="w-full max-w-sm rounded-md border"
                    />
                  )}
                  <Input
                    placeholder="Fallback image URL"
                    value={card.fallbackImage ?? ""}
                    onChange={(e) => updateCard(index, 'fallbackImage', e.target.value)}
                  />
                  <input
                    ref={(el) => {
                      cardFallbackFileInputs.current[index] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleCardFallbackUpload(e, index)}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                      onClick={() => cardFallbackFileInputs.current[index]?.click()}
                      disabled={homeUploading}
                    >
                      Upload fallback
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                      onClick={() =>
                        openMediaLibrary((url) => {
                          setCardFallbackLabels((prev) => ({ ...prev, [index]: "From library" }));
                          updateCard(index, 'fallbackImage', url);
                        })
                      }
                      disabled={homeUploading || !mediaLibraryReady || !cloudInfo}
                    >
                      Library
                    </button>
                    {cardFallbackLabels[index] && (
                      <span className="text-[11px] px-2 py-1 rounded border border-border bg-muted/70 text-elegant-text">
                        {cardFallbackLabels[index]}
                      </span>
                    )}
                  </div>
                  <Input
                    placeholder="Category"
                    value={card.category}
                    onChange={(e) => updateCard(index, 'category', e.target.value)}
                  />
                  <Input
                    placeholder="Date (e.g., Feb 08, 2026)"
                    value={card.date}
                    onChange={(e) => updateCard(index, 'date', e.target.value)}
                  />
                  <Input
                    placeholder="Title"
                    value={card.title}
                    onChange={(e) => updateCard(index, 'title', e.target.value)}
                  />
                  <Textarea
                    placeholder="Excerpt"
                    value={card.excerpt ?? ''}
                    onChange={(e) => updateCard(index, 'excerpt', e.target.value)}
                    rows={2}
                  />
                  <Input
                    placeholder="Link"
                    value={card.link}
                    onChange={(e) => updateCard(index, 'link', e.target.value)}
                  />
                  <Input
                    placeholder="Read more label"
                    value={card.readMoreLabel}
                    onChange={(e) => updateCard(index, 'readMoreLabel', e.target.value)}
                  />
                </div>
              ))}
            </div>

            {homeUploadError && <p className="text-sm text-destructive">{homeUploadError}</p>}
          </div>

          {/* SITE SETTINGS */}
          <div className="space-y-4 bg-background/95 p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-elegant-text">Site Settings</h2>
                <p className="text-sm text-muted-foreground">Control global images used across posts and category pages.</p>
              </div>
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handleSaveSiteSettings}
              >
                {settingsSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Post Fallback Image</p>
                <Input
                  placeholder="Fallback image URL"
                  value={siteSettings.postFallbackImage}
                  onChange={(e) =>
                    setSiteSettings((prev) => ({ ...prev, postFallbackImage: e.target.value }))
                  }
                />
                <input
                  ref={settingsFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSettingsFileLabel(file.name);
                      handleHomeImageUpload(file, (url) =>
                        setSiteSettings((prev) => ({ ...prev, postFallbackImage: url }))
                      );
                    }
                  }}
                />
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                    onClick={() => settingsFileInputRef.current?.click()}
                    disabled={homeUploading}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                    onClick={() =>
                      openMediaLibrary((url) => {
                        setSettingsFileLabel("From library");
                        setSiteSettings((prev) => ({ ...prev, postFallbackImage: url }));
                      })
                    }
                    disabled={homeUploading || !mediaLibraryReady || !cloudInfo}
                  >
                    Library
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {homeUploading ? "Uploading..." : "JPG/PNG"}
                  </span>
                  {settingsFileLabel && (
                    <span className="text-[11px] px-2 py-1 rounded border border-border bg-muted/70 text-elegant-text">
                      {settingsFileLabel}
                    </span>
                  )}
                </div>
                {siteSettings.postFallbackImage && (
                  <img
                    src={siteSettings.postFallbackImage}
                    alt="Post fallback"
                    className="w-full max-w-sm rounded-md border"
                  />
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Categories Header Image</p>
                  <Input
                    placeholder="Header image URL"
                    value={siteSettings.categoriesImage}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({ ...prev, categoriesImage: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">If empty, the fallback image is used.</p>
                  <input
                    ref={categoriesImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCategoriesImageLabel(file.name);
                        handleHomeImageUpload(file, (url) =>
                          setSiteSettings((prev) => ({ ...prev, categoriesImage: url }))
                        );
                      }
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                      onClick={() => categoriesImageInputRef.current?.click()}
                      disabled={homeUploading}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                      onClick={() =>
                        openMediaLibrary((url) => {
                          setCategoriesImageLabel("From library");
                          setSiteSettings((prev) => ({ ...prev, categoriesImage: url }));
                        })
                      }
                      disabled={homeUploading || !mediaLibraryReady || !cloudInfo}
                    >
                      Library
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {homeUploading ? "Uploading..." : "JPG/PNG"}
                    </span>
                    {categoriesImageLabel && (
                      <span className="text-[11px] px-2 py-1 rounded border border-border bg-muted/70 text-elegant-text">
                        {categoriesImageLabel}
                      </span>
                    )}
                  </div>
                  {siteSettings.categoriesImage && (
                    <img
                      src={siteSettings.categoriesImage}
                      alt="Categories header"
                      className="w-full max-w-sm rounded-md border"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Categories Fallback Image</p>
                  <Input
                    placeholder="Fallback image URL"
                    value={siteSettings.categoriesFallbackImage}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({ ...prev, categoriesFallbackImage: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to use the local default.</p>
                  <input
                    ref={categoriesFallbackInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCategoriesFallbackLabel(file.name);
                        handleHomeImageUpload(file, (url) =>
                          setSiteSettings((prev) => ({ ...prev, categoriesFallbackImage: url }))
                        );
                      }
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                      onClick={() => categoriesFallbackInputRef.current?.click()}
                      disabled={homeUploading}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                      onClick={() =>
                        openMediaLibrary((url) => {
                          setCategoriesFallbackLabel("From library");
                          setSiteSettings((prev) => ({ ...prev, categoriesFallbackImage: url }));
                        })
                      }
                      disabled={homeUploading || !mediaLibraryReady || !cloudInfo}
                    >
                      Library
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {homeUploading ? "Uploading..." : "JPG/PNG"}
                    </span>
                    {categoriesFallbackLabel && (
                      <span className="text-[11px] px-2 py-1 rounded border border-border bg-muted/70 text-elegant-text">
                        {categoriesFallbackLabel}
                      </span>
                    )}
                  </div>
                  {siteSettings.categoriesFallbackImage && (
                    <img
                      src={siteSettings.categoriesFallbackImage}
                      alt="Categories fallback"
                      className="w-full max-w-sm rounded-md border"
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Categories Heading</p>
                  <Input
                    placeholder="Eyebrow (e.g., Browse by theme)"
                    value={siteSettings.categoriesHeadingEyebrow}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({ ...prev, categoriesHeadingEyebrow: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Title (e.g., Categories)"
                    value={siteSettings.categoriesHeadingTitle}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({ ...prev, categoriesHeadingTitle: e.target.value }))
                    }
                  />
                  <Textarea
                    placeholder="Subtitle"
                    value={siteSettings.categoriesHeadingSubtitle}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({ ...prev, categoriesHeadingSubtitle: e.target.value }))
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Articles Spotlight Copy</p>
                  <Input
                    placeholder="Eyebrow (e.g., Article Spotlight)"
                    value={siteSettings.articlesSpotlightEyebrow}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({ ...prev, articlesSpotlightEyebrow: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Title"
                    value={siteSettings.articlesSpotlightTitle}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({ ...prev, articlesSpotlightTitle: e.target.value }))
                    }
                  />
                  <Textarea
                    placeholder="Subtitle"
                    value={siteSettings.articlesSpotlightSubtitle}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({ ...prev, articlesSpotlightSubtitle: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category Card Images</p>
                    <p className="text-xs text-muted-foreground">
                      Leave both fields blank to use the local default fallback.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {categories.map((category, index) => {
                    const config = siteSettings.categoryCardImages[category.slug] || {
                      image: "",
                      fallbackImage: "",
                    };
                    const excerpt = siteSettings.categoryCardExcerpts[category.slug] || "";
                    const preview = config.image || config.fallbackImage;
                    return (
                      <div key={category.slug} className="rounded-lg border border-border p-4 space-y-3 bg-card/40">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-elegant-text">{category.label}</p>
                            <p className="text-xs text-muted-foreground">{category.slug}</p>
                          </div>
                          {preview ? (
                            <img
                              src={preview}
                              alt={`${category.label} preview`}
                              className="h-12 w-20 rounded-md object-cover border border-border"
                            />
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Input
                            placeholder="Image URL"
                            value={config.image}
                            onChange={(e) => updateCategoryCardImage(category.slug, "image", e.target.value)}
                          />
                          <input
                            ref={(el) => {
                              categoryCardImageInputs.current[index] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCategoryCardImageLabels((prev) => ({
                                  ...prev,
                                  [category.slug]: file.name,
                                }));
                                handleHomeImageUpload(file, (url) =>
                                  updateCategoryCardImage(category.slug, "image", url)
                                );
                              }
                            }}
                          />
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                              onClick={() => categoryCardImageInputs.current[index]?.click()}
                              disabled={homeUploading}
                            >
                              Upload
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                              onClick={() =>
                                openMediaLibrary((url) => {
                                  setCategoryCardImageLabels((prev) => ({
                                    ...prev,
                                    [category.slug]: "From library",
                                  }));
                                  updateCategoryCardImage(category.slug, "image", url);
                                })
                              }
                              disabled={homeUploading || !mediaLibraryReady || !cloudInfo}
                            >
                              Library
                            </button>
                            {categoryCardImageLabels[category.slug] && (
                              <span className="text-[11px] px-2 py-1 rounded border border-border bg-muted/70 text-elegant-text">
                                {categoryCardImageLabels[category.slug]}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Input
                            placeholder="Fallback image URL"
                            value={config.fallbackImage}
                            onChange={(e) =>
                              updateCategoryCardImage(category.slug, "fallbackImage", e.target.value)
                            }
                          />
                          <input
                            ref={(el) => {
                              categoryCardFallbackInputs.current[index] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCategoryCardFallbackLabels((prev) => ({
                                  ...prev,
                                  [category.slug]: file.name,
                                }));
                                handleHomeImageUpload(file, (url) =>
                                  updateCategoryCardImage(category.slug, "fallbackImage", url)
                                );
                              }
                            }}
                          />
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                              onClick={() => categoryCardFallbackInputs.current[index]?.click()}
                              disabled={homeUploading}
                            >
                              Upload
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded border border-border bg-background hover:border-elegant-primary transition text-xs"
                              onClick={() =>
                                openMediaLibrary((url) => {
                                  setCategoryCardFallbackLabels((prev) => ({
                                    ...prev,
                                    [category.slug]: "From library",
                                  }));
                                  updateCategoryCardImage(category.slug, "fallbackImage", url);
                                })
                              }
                              disabled={homeUploading || !mediaLibraryReady || !cloudInfo}
                            >
                              Library
                            </button>
                            {categoryCardFallbackLabels[category.slug] && (
                              <span className="text-[11px] px-2 py-1 rounded border border-border bg-muted/70 text-elegant-text">
                                {categoryCardFallbackLabels[category.slug]}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Textarea
                            placeholder="Card excerpt (optional)"
                            value={excerpt}
                            onChange={(e) => updateCategoryCardExcerpt(category.slug, e.target.value)}
                            rows={2}
                          />
                          <p className="text-xs text-muted-foreground">
                            Shows on the Categories page below the title.
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

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
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-elegant-text">{post.title}</h4>
                        {post.mainFeatured && (
                          <span className="text-[10px] uppercase tracking-wide bg-elegant-primary/10 text-elegant-primary px-2 py-0.5 rounded-sm font-medium">
                            Main Feature
                          </span>
                        )}
                        {post.featured && !post.article && (
                          <span className="text-[10px] uppercase tracking-wide bg-elegant-primary/10 text-elegant-primary px-2 py-0.5 rounded-sm font-medium">
                            Featured
                          </span>
                        )}
                        {post.article && (
                          <span className="text-[10px] uppercase tracking-wide bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-sm">
                            Article
                          </span>
                        )}
                        {post.article && post.featured && (
                          <span className="text-[10px] uppercase tracking-wide bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-sm">
                            Featured
                          </span>
                        )}
                        {post.hidden && (
                          <span className="text-[10px] uppercase tracking-wide bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-sm">
                            Hidden
                          </span>
                        )}
                        {post.slug === siteSettings.featuredArticleSlug && (
                          <span className="text-[10px] uppercase tracking-wide bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-sm">
                            Featured Article
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-line text-xs text-muted-foreground">
                        {post.excerpt}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {post.date} • {post.status} • v{post.version ?? 1}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {post.article && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetFeaturedArticle(post)}
                          disabled={post.status !== "published" || !post.featured}
                          className="border-elegant-primary/40 text-elegant-primary hover:bg-elegant-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {post.slug === siteSettings.featuredArticleSlug ? "Main Article" : "Set Main Article"}
                        </Button>
                      )}
                      {post.featured && !post.article && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetMainFeatured(post)}
                          disabled={post.status !== "published"}
                          className="border-elegant-primary/40 text-elegant-primary hover:bg-elegant-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {post.mainFeatured ? "Main Feature" : "Set Main Feature"}
                        </Button>
                      )}

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
