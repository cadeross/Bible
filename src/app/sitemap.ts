import type { MetadataRoute } from "next";
import { BIBLE_BOOKS } from "@/lib/bible-data";
import { getSiteUrl } from "@/lib/seo";

const PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/how-to", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/updates", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/calendar", priority: 0.8, changeFrequency: "daily" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const readingEntries: MetadataRoute.Sitemap = BIBLE_BOOKS.flatMap((book) => {
    return Array.from({ length: book.chapters }, (_, chapterIndex) => {
      const chapter = chapterIndex + 1;
      return {
        url: `${siteUrl}/read/${encodeURIComponent(book.name)}/${chapter}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    });
  });

  return [...staticEntries, ...readingEntries];
}
