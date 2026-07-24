import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/auth";
import { ensureViewer, getActiveProfile, recordAnalytics, setReaction } from "@/db/runtime";
import { findMovie } from "@/lib/catalog";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const payload = await request.json().catch(() => null) as { movieId?: string; reaction?: string } | null;
  if (!payload?.movieId || !findMovie(payload.movieId) || !["like", "love", "not_for_me"].includes(payload.reaction ?? "")) {
    return NextResponse.json({ error: "INVALID_REACTION" }, { status: 400 });
  }
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  await setReaction(profile.id, payload.movieId, payload.reaction as "like" | "love" | "not_for_me");
  await recordAnalytics(profile.id, `reaction.${payload.reaction}`, { movieId: payload.movieId }, "essential");
  return NextResponse.json({ saved: true });
}
