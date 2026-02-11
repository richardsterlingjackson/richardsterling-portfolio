import { useEffect, useState } from "react";
import postFallback from "@/assets/blog-post-1.jpg";
import { getSiteSettings } from "@/lib/siteSettings";

export function usePostFallbackImage(isArticle: boolean = false) {
  const [fallbackImage, setFallbackImage] = useState(postFallback);

  useEffect(() => {
    let active = true;
    getSiteSettings().then((settings) => {
      if (!active) return;
      if (isArticle && settings?.articlesFallbackImage) {
        setFallbackImage(settings.articlesFallbackImage);
        return;
      }
      if (settings?.postFallbackImage) {
        setFallbackImage(settings.postFallbackImage);
      }
    });
    return () => {
      active = false;
    };
  }, [isArticle]);

  return fallbackImage;
}
