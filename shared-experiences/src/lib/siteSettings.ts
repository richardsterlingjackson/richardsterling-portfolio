export type SiteSettings = {
  postFallbackImage: string;
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
          cachedSettings = data as SiteSettings;
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
