export type SiteSettings = {
  postFallbackImage: string;
  categoriesImage: string;
  categoriesFallbackImage: string;
  categoryCardImages: Record<string, { image: string; fallbackImage: string }>;
};

let cachedSettings: SiteSettings | null = null;
let settingsPromise: Promise<SiteSettings | null> | null = null;

export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (cachedSettings) return cachedSettings;
  if (!settingsPromise) {
    settingsPromise = fetch("/api/posts?settings=1", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.postFallbackImage === "string") {
          const rawCategoryImages =
            data.categoryCardImages && typeof data.categoryCardImages === "object" && !Array.isArray(data.categoryCardImages)
              ? data.categoryCardImages
              : {};
          cachedSettings = {
            postFallbackImage: data.postFallbackImage || "",
            categoriesImage: typeof data.categoriesImage === "string" ? data.categoriesImage : "",
            categoriesFallbackImage:
              typeof data.categoriesFallbackImage === "string" ? data.categoriesFallbackImage : "",
            categoryCardImages: rawCategoryImages as Record<string, { image: string; fallbackImage: string }>,
          };
          return cachedSettings;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        settingsPromise = null;
      });
  }
  return settingsPromise;
}
