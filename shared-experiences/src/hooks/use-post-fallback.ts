import { useEffect, useState } from "react";
import postFallback from "@/assets/blog-post-1.jpg";
import { getSiteSettings } from "@/lib/siteSettings";

export function usePostFallbackImage() {
  const [fallbackImage, setFallbackImage] = useState(postFallback);

  useEffect(() => {
    let active = true;
    getSiteSettings().then((settings) => {
      if (!active) return;
      if (settings?.postFallbackImage) {
        setFallbackImage(settings.postFallbackImage);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return fallbackImage;
}
