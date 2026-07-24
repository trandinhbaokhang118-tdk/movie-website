import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/auth";
import { getActiveProfile, getTrendSnapshot, type TrendPeriod } from "@/db/runtime";
import { filterMoviesForMaturity, movies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const periods = new Set<TrendPeriod>(["hour", "day", "week"]);

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("period") as TrendPeriod | null;
  const period = requested && periods.has(requested) ? requested : "day";
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const profile = await getActiveProfile(user.id);
  const visibleMovies = filterMoviesForMaturity(movies, profile.maturity);
  const visibleIds = new Set(visibleMovies.map((movie) => movie.id));
  const hiddenTitles = new Set(movies.filter((movie) => !visibleIds.has(movie.id)).map((movie) => movie.title));
  const snapshot = await getTrendSnapshot(period);

  return NextResponse.json({
    snapshot: {
      ...snapshot,
      ranking: snapshot.ranking.filter((entry) => visibleIds.has(entry.movieId)),
      hotTags: snapshot.hotTags.filter((tag) => !hiddenTitles.has(tag.label)),
    },
    generatedAt: new Date().toISOString(),
  }, {
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "x-cinewave-realtime": "poll-10s",
    },
  });
}
