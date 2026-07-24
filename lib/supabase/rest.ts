import { env } from "cloudflare:workers";

type SupabaseRuntime = {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
};

export type SupabaseHealth = {
  status: "ready" | "disabled" | "degraded";
  latencyMs: number;
};

function configuration() {
  const runtime = env as unknown as SupabaseRuntime;
  const url = runtime.SUPABASE_URL?.trim().replace(/\/$/, "");
  const publishableKey = runtime.SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && publishableKey ? { url, publishableKey } : null;
}

export async function checkSupabase(): Promise<SupabaseHealth> {
  const config = configuration();
  if (!config) return { status: "disabled", latencyMs: 0 };
  const startedAt = Date.now();
  try {
    const response = await fetch(`${config.url}/rest/v1/movie_catalog?select=id&limit=1`, {
      headers: {
        accept: "application/json",
        apikey: config.publishableKey,
      },
      signal: AbortSignal.timeout(1_500),
    });
    return {
      status: response.ok ? "ready" : "degraded",
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return { status: "degraded", latencyMs: Date.now() - startedAt };
  }
}
