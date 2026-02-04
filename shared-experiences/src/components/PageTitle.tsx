import { useEffect } from "react";

export default function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    const base = "Shared Experiences";
    document.title = title?.trim() ? title : base;
  }, [title]);

  return null;
}
