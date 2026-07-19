import { NextResponse } from "next/server";
import { ensureDatabase } from "@/db/runtime";

export async function GET() {
  const startedAt = Date.now();
  try {
    await ensureDatabase();
    return NextResponse.json({ status: "ready", database: "ready", latencyMs: Date.now() - startedAt }, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unavailable" }, {
      status: 503,
      headers: { "cache-control": "no-store", "retry-after": "15" },
    });
  }
}
