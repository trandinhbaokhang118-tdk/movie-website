import { NextResponse } from "next/server";
import { getCurrentUser } from "../../auth";
import { closePlaybackSession, deleteViewingActivity, ensureViewer, findManagedTitle, getActiveProfile, recordAnalytics, saveProgress } from "@/db/runtime";
import { findMovie } from "@/lib/catalog";
import { isTrustedMutation, readJsonBody } from "@/app/lib/request-security";

export async function PUT(request: Request) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "CROSS_SITE_REQUEST" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ignored: true }, { status: 202 });
  const parsed = await readJsonBody<{ movieId?: string; positionSeconds?: number; sessionId?: string; final?: boolean }>(request);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const payload = parsed.value;
  const knownMovie = payload.movieId ? findMovie(payload.movieId) ?? await findManagedTitle(payload.movieId) : null;
  if (!payload.movieId || !knownMovie || !Number.isFinite(payload.positionSeconds)) {
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
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "CROSS_SITE_REQUEST" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  let payload: { movieId?: string } = {};
  try {
    const parsed = await readJsonBody<{ movieId?: string }>(request);
    if (parsed.ok) payload = parsed.value;
  } catch {
    // An empty body intentionally means clearing the viewer's entire history.
  }
  if (payload.movieId && !findMovie(payload.movieId) && !(await findManagedTitle(payload.movieId))) {
    return NextResponse.json({ error: "MOVIE_NOT_FOUND" }, { status: 404 });
  }

  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  await deleteViewingActivity(viewer.id, profile.id, payload.movieId);
  return NextResponse.json({ deleted: true, scope: payload.movieId ? "item" : "all" });
}
