export type SiteSettings = {
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
  articlesDividerLabel: string;
  headerHeroEyebrow: string;
  headerHeroTitle: string;
  headerHeroSubtitle: string;
  articlesFallbackImage: string;
  articlesHeaderImage: string;
  articlesHeaderFallbackImage: string;
  headerHeroDivider: string;
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
          const rawCategoryExcerpts =
            data.categoryCardExcerpts && typeof data.categoryCardExcerpts === "object" && !Array.isArray(data.categoryCardExcerpts)
              ? data.categoryCardExcerpts
              : {};
          cachedSettings = {
            postFallbackImage: data.postFallbackImage || "",
            categoriesImage: typeof data.categoriesImage === "string" ? data.categoriesImage : "",
            categoriesFallbackImage:
              typeof data.categoriesFallbackImage === "string" ? data.categoriesFallbackImage : "",
            categoryCardImages: rawCategoryImages as Record<string, { image: string; fallbackImage: string }>,
            categoryCardExcerpts: rawCategoryExcerpts as Record<string, string>,
            featuredArticleSlug:
              typeof data.featuredArticleSlug === "string" ? data.featuredArticleSlug : "",
            categoriesHeadingEyebrow:
              typeof data.categoriesHeadingEyebrow === "string" ? data.categoriesHeadingEyebrow : "",
            categoriesHeadingTitle:
              typeof data.categoriesHeadingTitle === "string" ? data.categoriesHeadingTitle : "",
            categoriesHeadingSubtitle:
              typeof data.categoriesHeadingSubtitle === "string" ? data.categoriesHeadingSubtitle : "",
            articlesSpotlightEyebrow:
              typeof data.articlesSpotlightEyebrow === "string" ? data.articlesSpotlightEyebrow : "",
            articlesSpotlightTitle:
              typeof data.articlesSpotlightTitle === "string" ? data.articlesSpotlightTitle : "",
            articlesSpotlightSubtitle:
              typeof data.articlesSpotlightSubtitle === "string" ? data.articlesSpotlightSubtitle : "",
            articlesDividerLabel:
              typeof data.articlesDividerLabel === "string" ? data.articlesDividerLabel : "",
            headerHeroEyebrow:
              typeof data.headerHeroEyebrow === "string" ? data.headerHeroEyebrow : "",
            headerHeroTitle:
              typeof data.headerHeroTitle === "string" ? data.headerHeroTitle : "",
            headerHeroSubtitle:
              typeof data.headerHeroSubtitle === "string" ? data.headerHeroSubtitle : "",
            articlesFallbackImage:
              typeof data.articlesFallbackImage === "string" ? data.articlesFallbackImage : "",
            articlesHeaderImage:
              typeof data.articlesHeaderImage === "string" ? data.articlesHeaderImage : "",
            articlesHeaderFallbackImage:
              typeof data.articlesHeaderFallbackImage === "string" ? data.articlesHeaderFallbackImage : "",
            headerHeroDivider:
              typeof data.headerHeroDivider === "string" ? data.headerHeroDivider : "",
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
