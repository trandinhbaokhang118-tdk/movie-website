import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { closePlaybackSession, deleteViewingActivity, ensureViewer, getActiveProfile, recordAnalytics, saveProgress } from "@/db/runtime";
import { findMovie } from "@/lib/catalog";

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ ignored: true }, { status: 202 });
  const payload = (await request.json()) as { movieId?: string; positionSeconds?: number; sessionId?: string; final?: boolean };
  if (!payload.movieId || !findMovie(payload.movieId) || !Number.isFinite(payload.positionSeconds)) {
    return NextResponse.json({ error: "INVALID_PROGRESS" }, { status: 400 });
  }
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  await saveProgress(viewer.id, profile.id, payload.movieId, payload.positionSeconds ?? 0);
  await recordAnalytics(profile.id, payload.final ? "playback.session.completed" : "playback.progress", { movieId: payload.movieId }, "essential");
  if (payload.final && payload.sessionId) await closePlaybackSession(viewer.id, payload.sessionId);
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
  const profile = await getActiveProfile(viewer.id);
  await deleteViewingActivity(viewer.id, profile.id, payload.movieId);
  return NextResponse.json({ deleted: true, scope: payload.movieId ? "item" : "all" });
}
