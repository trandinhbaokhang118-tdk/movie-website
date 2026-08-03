import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/auth";
import { ensureViewer, getActiveProfile, recordAnalytics, setReaction } from "@/db/runtime";
import { findMovie } from "@/lib/catalog";
import { isTrustedMutation, readJsonBody } from "@/app/lib/request-security";

export async function PUT(request: Request) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "CROSS_SITE_REQUEST" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const parsed = await readJsonBody<{ movieId?: string; reaction?: string }>(request);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const payload = parsed.value;
  if (!payload?.movieId || !findMovie(payload.movieId) || !["like", "love", "not_for_me"].includes(payload.reaction ?? "")) {
    return NextResponse.json({ error: "INVALID_REACTION" }, { status: 400 });
  }
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  await setReaction(profile.id, payload.movieId, payload.reaction as "like" | "love" | "not_for_me");
  await recordAnalytics(profile.id, `reaction.${payload.reaction}`, { movieId: payload.movieId }, "essential");
  return NextResponse.json({ saved: true });
}
