import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureViewer, saveProgress } from "@/db/runtime";
import { findMovie } from "@/lib/catalog";

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ ignored: true }, { status: 202 });
  const payload = (await request.json()) as { movieId?: string; positionSeconds?: number };
  if (!payload.movieId || !findMovie(payload.movieId) || !Number.isFinite(payload.positionSeconds)) {
    return NextResponse.json({ error: "INVALID_PROGRESS" }, { status: 400 });
  }
  const viewer = await ensureViewer(user.email, user.displayName);
  await saveProgress(viewer.id, payload.movieId, payload.positionSeconds ?? 0);
  return NextResponse.json({ saved: true });
}
