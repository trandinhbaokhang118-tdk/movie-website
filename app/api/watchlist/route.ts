import { NextResponse } from "next/server";
import { getCurrentUser } from "../../auth";
import { ensureViewer, getActiveProfile, isInWatchlist, recordAnalytics, setWatchlist } from "@/db/runtime";
import { findMovie } from "@/lib/catalog";

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
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const payload = (await request.json()) as { movieId?: string; saved?: boolean };
  if (!payload.movieId || !findMovie(payload.movieId) || typeof payload.saved !== "boolean") {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  await setWatchlist(viewer.id, profile.id, payload.movieId, payload.saved);
  await recordAnalytics(profile.id, payload.saved ? "watchlist.saved" : "watchlist.removed", { movieId: payload.movieId }, "essential");
  return NextResponse.json({ saved: payload.saved });
}
