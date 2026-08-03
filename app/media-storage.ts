import { env } from "cloudflare:workers";
import { recordMediaAsset } from "@/db/runtime";

type MediaKind = "poster" | "video" | "subtitle" | "editorial";
const allowedTypes: Record<MediaKind, ReadonlySet<string>> = {
  poster: new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  video: new Set(["video/mp4", "video/webm", "application/vnd.apple.mpegurl", "application/x-mpegURL"]),
  subtitle: new Set(["text/vtt"]),
  editorial: new Set(["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/mp4", "audio/ogg"]),
};
const sizeLimits: Record<MediaKind, number> = { poster: 8 * 1024 * 1024, video: 95 * 1024 * 1024, subtitle: 2 * 1024 * 1024, editorial: 50 * 1024 * 1024 };
const extensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
  "video/mp4": "mp4", "video/webm": "webm", "application/vnd.apple.mpegurl": "m3u8", "application/x-mpegURL": "m3u8",
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/ogg": "ogg",
  "text/vtt": "vtt",
};

export async function storeMediaUpload(file: File | null, kind: MediaKind, actorEmail: string) {
  if (!file || file.size === 0) return null;
  if (!allowedTypes[kind].has(file.type) || file.size > sizeLimits[kind]) throw new Error(`INVALID_${kind.toUpperCase()}_UPLOAD`);
  const bucket = (env as unknown as { MEDIA?: R2Bucket }).MEDIA;
  if (!bucket) throw new Error("MEDIA_STORAGE_UNAVAILABLE");
  const day = new Date().toISOString().slice(0, 10);
  const key = `${kind}/${day}/${crypto.randomUUID()}.${extensions[file.type] ?? "bin"}`;
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { uploadedBy: actorEmail.slice(0, 120), originalName: file.name.slice(0, 240) },
  });
  await recordMediaAsset({ storageKey: key, kind, contentType: file.type, sizeBytes: file.size, originalName: file.name, uploadedBy: actorEmail });
  return `/media/uploads/${key}`;
}
