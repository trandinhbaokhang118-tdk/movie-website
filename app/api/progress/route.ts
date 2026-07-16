import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { deleteViewingActivity, ensureViewer, saveProgress } from "@/db/runtime";
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

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  let payload: { movieId?: string } = {};
  try {
    payload = (await request.json()) as { movieId?: string };
  } catch {
    // An empty body intentionally means clearing the viewer's entire history.
  }
  if (payload.movieId && !findMovie(payload.movieId)) {
    return NextResponse.json({ error: "MOVIE_NOT_FOUND" }, { status: 404 });
  }

  const viewer = await ensureViewer(user.email, user.displayName);
  await deleteViewingActivity(viewer.id, payload.movieId);
  return NextResponse.json({ deleted: true, scope: payload.movieId ? "item" : "all" });
}
