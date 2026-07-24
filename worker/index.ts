/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS?: Fetcher;
  DB: D1Database;
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
    secured.headers.set("x-content-type-options", "nosniff");
    secured.headers.set("referrer-policy", "strict-origin-when-cross-origin");
    secured.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
    secured.headers.set("x-frame-options", "SAMEORIGIN");
    secured.headers.set("content-security-policy", [
      "default-src 'self'",
      "img-src 'self' data: https://images.unsplash.com https://image.tmdb.org https://archive.org https://img.vietqr.io",
      "media-src 'self' https://storage.googleapis.com https://archive.org",
      "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "connect-src 'self' https://api.themoviedb.org https://rnhbnkgsqhdtejjdqyui.supabase.co https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
    ].join("; "));
    return secured;
  },
};

export default worker;
