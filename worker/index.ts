/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { resolveObjectRange } from "./range";

interface Env {
  ASSETS?: Fetcher;
  DB: D1Database;
  MEDIA?: R2Bucket;
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if ((request.method === "GET" || request.method === "HEAD") && url.pathname.startsWith("/media/uploads/")) {
      let key = "";
      try { key = decodeURIComponent(url.pathname.slice("/media/uploads/".length)); } catch { return new Response("Invalid media path", { status: 400 }); }
      if (!env.MEDIA || !key || key.includes("..") || key.startsWith("/")) return new Response("Media not found", { status: 404 });
      const object = await env.MEDIA.get(key, { range: request.headers });
      if (!object) return new Response("Media not found", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("accept-ranges", "bytes");
      headers.set("x-content-type-options", "nosniff");
      headers.set("cache-control", headers.get("cache-control") ?? "public, max-age=31536000, immutable");
      if (object.range) {
        const range = resolveObjectRange(object.range, object.size);
        headers.set("content-range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
        headers.set("content-length", String(range.length));
      } else {
        headers.set("content-length", String(object.size));
      }
      return new Response(request.method === "HEAD" ? null : object.body, { status: object.range ? 206 : 200, headers });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const images = env.IMAGES;
      return handleImageOptimization(request, {
        fetchAsset: (path) => {
          const assetRequest = new Request(new URL(path, request.url));
          return env.ASSETS ? env.ASSETS.fetch(assetRequest) : fetch(assetRequest);
        },
        ...(images ? {
          transformImage: async (body: ReadableStream, { width, format, quality }: { width: number; format: string; quality: number }) => {
            const result = await images.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
            return result.response();
          },
        } : {}),
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    const secured = new Response(response.body, response);
    const supabaseOrigin = (() => { try { return env.SUPABASE_URL ? new URL(env.SUPABASE_URL).origin : ""; } catch { return ""; } })();
    secured.headers.set("x-content-type-options", "nosniff");
    secured.headers.set("referrer-policy", "strict-origin-when-cross-origin");
    secured.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
    secured.headers.set("x-frame-options", "SAMEORIGIN");
    secured.headers.set("cross-origin-opener-policy", "same-origin-allow-popups");
    secured.headers.set("x-dns-prefetch-control", "off");
    secured.headers.set("x-request-id", request.headers.get("cf-ray") ?? crypto.randomUUID());
    if (url.protocol === "https:") secured.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
    secured.headers.set("content-security-policy", [
      "default-src 'self'",
      "img-src 'self' data: https://images.unsplash.com https://image.tmdb.org https://archive.org https://img.vietqr.io",
      "media-src 'self' https://storage.googleapis.com https://archive.org",
      "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      `connect-src 'self' https://api.themoviedb.org https://challenges.cloudflare.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; "));
    return secured;
  },
};

export default worker;
