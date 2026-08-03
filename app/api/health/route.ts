import { NextResponse } from "next/server";
import { ensureDatabase } from "@/db/runtime";
import { checkSupabase } from "@/lib/supabase/rest";
import { runtimeConfigurationStatus } from "@/app/runtime-config";

export async function GET() {
  const startedAt = Date.now();
  try {
    const [, supabase] = await Promise.all([ensureDatabase(), checkSupabase()]);
    const capabilities = runtimeConfigurationStatus();
    return NextResponse.json({
      status: "ready",
      database: "ready",
      supabase: supabase.status,
      latencyMs: Date.now() - startedAt,
      supabaseLatencyMs: supabase.latencyMs,
      capabilities: {
        payments: capabilities.payment.ready ? "ready" : "disabled",
        mediaStorage: capabilities.mediaStorageReady ? "ready" : "disabled",
        catalogImport: capabilities.catalogImportReady ? "ready" : "disabled",
      },
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
