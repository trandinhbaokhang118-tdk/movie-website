import { NextResponse } from "next/server";
import { ensureDatabase } from "@/db/runtime";
import { checkSupabase } from "@/lib/supabase/rest";

export async function GET() {
  const startedAt = Date.now();
  try {
    const [, supabase] = await Promise.all([ensureDatabase(), checkSupabase()]);
    return NextResponse.json({
      status: "ready",
      database: "ready",
      supabase: supabase.status,
      latencyMs: Date.now() - startedAt,
      supabaseLatencyMs: supabase.latencyMs,
    }, {
      headers: {
        "cache-control": "no-store",
        "server-timing": `supabase;dur=${supabase.latencyMs}`,
      },
    });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unavailable" }, {
      status: 503,
      headers: { "cache-control": "no-store", "retry-after": "15" },
    });
  }
}
