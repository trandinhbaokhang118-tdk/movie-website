import { NextResponse } from "next/server";
import { getCurrentUser } from "../../auth";
import { ensureViewer, getActiveProfile, isInWatchlist, recordAnalytics, setWatchlist } from "@/db/runtime";
import { findMovie } from "@/lib/catalog";
import { isTrustedMutation, readJsonBody } from "@/app/lib/request-security";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const movieId = new URL(request.url).searchParams.get("movieId") ?? "";
  if (!findMovie(movieId)) return NextResponse.json({ error: "MOVIE_NOT_FOUND" }, { status: 404 });
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  return NextResponse.json({ saved: await isInWatchlist(viewer.id, profile.id, movieId) });
}

export async function PUT(request: Request) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "CROSS_SITE_REQUEST" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const parsed = await readJsonBody<{ movieId?: string; saved?: boolean }>(request);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const payload = parsed.value;
  if (!payload.movieId || !findMovie(payload.movieId) || typeof payload.saved !== "boolean") {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  await setWatchlist(viewer.id, profile.id, payload.movieId, payload.saved);
  await recordAnalytics(profile.id, payload.saved ? "watchlist.saved" : "watchlist.removed", { movieId: payload.movieId }, "essential");
  return NextResponse.json({ saved: payload.saved });
}
