import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { movies } from "@/lib/catalog";
import { listManagedTitles } from "@/db/runtime";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim() || requestHeaders.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const managed = await listManagedTitles({ publishedOnly: true }).catch(() => []);
  const now = new Date();
  return [
    { url: origin, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/browse`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${origin}/trending`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    ...movies.map((movie) => ({ url: `${origin}/title/${movie.id}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...managed.map((title) => ({ url: `${origin}/title/${title.id}`, lastModified: new Date(title.updatedAt), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
