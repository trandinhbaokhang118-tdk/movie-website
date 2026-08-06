import Link from "next/link";
import { CinematicHero } from "./components/CinematicHero";
import { Footer } from "./components/Footer";
import { ImportedMovieRail } from "./components/ImportedMovieRail";
import { ManagedTitleCard } from "./components/ManagedTitleCard";
import { MediaRail } from "./components/MediaRail";
import { SiteHeader } from "./components/SiteHeader";
import { LandingPage } from "./components/LandingPage";
import { TrendDiscovery } from "./components/TrendDiscovery";
import { getViewerContext } from "./viewer-context";
import { getTrendSnapshots, listManagedTitles, listProfileReactions, listUpcomingManagedTitles, listViewingActivity, listWatchlist, maturityRatingAllows, type TrendPeriod, type TrendSnapshot } from "@/db/runtime";
import { featuredMovie, filterMoviesForMaturity, movies, viewingProgressPercent } from "@/lib/catalog";
import { parseRecommenderMode, recommendationReasonLabel, recommendMovies } from "@/lib/recommendation/hybrid";
import { importedMoviesForHome } from "@/lib/tmdb/sync";

export const dynamic = "force-dynamic";

export default async function Home() {
  const viewerContext = await getViewerContext();
  if (!viewerContext) return <LandingPage movies={movies.filter((movie) => movie.video && movie.source)} />;
  const [activity, savedIds, reactions] = await Promise.all([
    listViewingActivity(viewerContext.viewer.id, viewerContext.profile.id, 30),
    listWatchlist(viewerContext.viewer.id, viewerContext.profile.id),
    listProfileReactions(viewerContext.profile.id),
  ]);
  const context = { ...viewerContext, activity, savedIds, reactions };
  const visibleMovies = filterMoviesForMaturity(movies, context.profile.maturity);
  const newReleases = visibleMovies.filter((movie) => movie.newRelease);
  const movieById = Object.fromEntries(visibleMovies.map((movie) => [movie.id, movie]));
  const [trendSnapshotsResult, importedMovies, managedTitles, upcomingTitles] = await Promise.all([
    getTrendSnapshots(),
    context.profile.isKids ? Promise.resolve([]) : importedMoviesForHome(),
    listManagedTitles({ publishedOnly: true }),
    listUpcomingManagedTitles(),
  ]);
  const newManagedTitles = managedTitles
    .filter((title) => maturityRatingAllows(title.maturity, context.profile.maturity))
    .slice(0, 12);
  const visibleUpcomingTitles = upcomingTitles
    .filter((title) => maturityRatingAllows(title.maturity, context.profile.maturity))
    .slice(0, 12);
  const { hour: hourTrend, day: dayTrend, week: weekTrend } = trendSnapshotsResult;
  const visibleIds = new Set(visibleMovies.map((movie) => movie.id));
  const hiddenTitles = new Set(movies.filter((movie) => !visibleIds.has(movie.id)).map((movie) => movie.title));
  const sanitizeTrend = (snapshot: TrendSnapshot): TrendSnapshot => ({
    ...snapshot,
    ranking: snapshot.ranking.filter((entry) => visibleIds.has(entry.movieId)),
    hotTags: snapshot.hotTags.filter((tag) => !hiddenTitles.has(tag.label)),
  });
  const trendSnapshots: Record<TrendPeriod, TrendSnapshot> = {
    hour: sanitizeTrend(hourTrend), day: sanitizeTrend(dayTrend), week: sanitizeTrend(weekTrend),
  };
  const trendScore = new Map(dayTrend.ranking.map((item) => [item.movieId, item.score]));
  const recommendationResult = recommendMovies({
    candidates: visibleMovies.filter((movie) => !movie.featured),
    watchHistory: context.activity,
    savedMovieIds: context.savedIds,
    reactions: context.reactions,
    trendScores: trendScore,
    limit: 8,
  }, {
    mode: parseRecommenderMode(process.env.CINEWAVE_RECOMMENDER_MODE),
    profileKey: context.profile.id,
    canaryPercent: Number(process.env.CINEWAVE_RECOMMENDER_CANARY_PERCENT ?? 10),
  });
  const forYou = recommendationResult.items.flatMap((item) => movieById[item.movieId] ? [movieById[item.movieId]] : []);
  const recommendationReasonsById = Object.fromEntries(recommendationResult.items.map((item) => [
    item.movieId,
    recommendationReasonLabel(item.reasonCodes[0]),
  ]));
  const activityWithMovies = activity.flatMap((item) => {
    const movie = movies.find((candidate) => candidate.id === item.movieId);
    return movie ? [{ movie, progress: viewingProgressPercent(movie, item.positionSeconds) }] : [];
  });
  const progressById = Object.fromEntries(activityWithMovies.map(({ movie, progress }) => [movie.id, progress]));
  const continueWatching = activityWithMovies.filter(({ progress }) => progress < 90).map(({ movie }) => movie);

  return (
    <main>
      <SiteHeader />
      <CinematicHero movie={featuredMovie} />
      <div className="page-shell home-content">
        {continueWatching.length ? (
          <MediaRail
            title="Tiếp tục xem"
            eyebrow="QUAY LẠI ĐÚNG NƠI BẠN DỪNG"
            movies={continueWatching}
            progressById={progressById}
            watchDirectly
            savedMovieIds={context.savedIds}
          />
        ) : (
          <section className="continue-banner">
            <div>
              <p className="eyebrow">XEM TIẾP</p>
              <h2>Bắt đầu một câu chuyện mới</h2>
              <p>Tiến độ xem sẽ xuất hiện tại đây và được đồng bộ an toàn.</p>
            </div>
            <Link className="text-link" href="/browse">Khám phá phim <span>→</span></Link>
          </section>
        )}
        <ImportedMovieRail movies={importedMovies} />
        {newManagedTitles.length ? (
          <section className="rail-section" aria-labelledby="managed-new-releases-heading">
            <div className="section-heading editorial-heading"><div><p className="eyebrow">CINEWAVE VỪA XUẤT BẢN</p><h2 id="managed-new-releases-heading">Phim mới phát hành</h2></div><Link className="text-link" href="/browse">Xem tất cả <span>→</span></Link></div>
            <div className="media-rail">{newManagedTitles.map((title) => <ManagedTitleCard key={title.id} title={title} />)}</div>
          </section>
        ) : null}
        {visibleUpcomingTitles.length ? (
          <section className="rail-section" aria-labelledby="upcoming-releases-heading">
            <div className="section-heading editorial-heading"><div><p className="eyebrow">LỊCH CHIẾU SẮP TỚI</p><h2 id="upcoming-releases-heading">Phim &amp; series sắp ra mắt</h2></div></div>
            <div className="media-rail">{visibleUpcomingTitles.map((title) => <ManagedTitleCard key={title.id} title={title} />)}</div>
          </section>
        ) : null}
        <TrendDiscovery snapshots={trendSnapshots} movieMap={movieById} savedMovieIds={context.savedIds} />
        <MediaRail title="Mới trên CineWave" eyebrow="NHỮNG CÂU CHUYỆN VỪA CẬP BẾN" movies={newReleases} savedMovieIds={context.savedIds} />
        <MediaRail title="Dự đoán hợp gu tối nay" eyebrow="GỢI Ý TỪ LỊCH SỬ XEM · TIM · TỦ PHIM" movies={forYou} savedMovieIds={context.savedIds} reasonById={recommendationReasonsById} />
      </div>
      <Footer />
    </main>
  );
}
