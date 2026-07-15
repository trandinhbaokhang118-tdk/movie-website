import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureViewer, isInWatchlist, setWatchlist } from "@/db/runtime";
import { findMovie } from "@/lib/catalog";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const movieId = new URL(request.url).searchParams.get("movieId") ?? "";
  if (!findMovie(movieId)) return NextResponse.json({ error: "MOVIE_NOT_FOUND" }, { status: 404 });
  const viewer = await ensureViewer(user.email, user.displayName);
  return NextResponse.json({ saved: await isInWatchlist(viewer.id, movieId) });
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const payload = (await request.json()) as { movieId?: string; saved?: boolean };
  if (!payload.movieId || !findMovie(payload.movieId) || typeof payload.saved !== "boolean") {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  const viewer = await ensureViewer(user.email, user.displayName);
  await setWatchlist(viewer.id, payload.movieId, payload.saved);
  return NextResponse.json({ saved: payload.saved });
}
