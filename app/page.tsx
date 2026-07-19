import Link from "next/link";
import { CinematicHero } from "./components/CinematicHero";
import { Footer } from "./components/Footer";
import { ImportedMovieRail } from "./components/ImportedMovieRail";
import { MediaRail } from "./components/MediaRail";
import { SiteHeader } from "./components/SiteHeader";
import { getChatGPTUser } from "./chatgpt-auth";
import { ensureViewer, getActiveProfile, listViewingActivity } from "@/db/runtime";
import { featuredMovie, filterMoviesForMaturity, movies, viewingProgressPercent } from "@/lib/catalog";
import { importedMoviesForHome } from "@/lib/tmdb/sync";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  const context = user ? await ensureViewer(user.email, user.displayName).then(async (viewer) => {
    const profile = await getActiveProfile(viewer.id);
    return { profile, activity: await listViewingActivity(viewer.id, profile.id, 12) };
  }) : null;
  const visibleMovies = filterMoviesForMaturity(movies, context?.profile.maturity ?? "T18");
  const trending = visibleMovies.filter((movie) => movie.trending);
  const newReleases = visibleMovies.filter((movie) => movie.newRelease);
  const watchedGenres = new Set(context?.activity.flatMap((item) => movies.find((movie) => movie.id === item.movieId)?.genres ?? []) ?? []);
  const forYou = visibleMovies.filter((movie) => !movie.featured).sort((a, b) =>
    b.genres.filter((genre) => watchedGenres.has(genre)).length - a.genres.filter((genre) => watchedGenres.has(genre)).length,
  ).slice(0, 7);
  const importedMovies = context?.profile.isKids ? [] : await importedMoviesForHome();
  const activity = context?.activity ?? [];
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
          />
        ) : (
          <section className="continue-banner">
            <div>
              <p className="eyebrow">XEM TIẾP</p>
              <h2>{user ? "Bắt đầu một câu chuyện mới" : "Câu chuyện của bạn vẫn đang chờ"}</h2>
              <p>{user ? "Tiến độ xem sẽ xuất hiện tại đây và được đồng bộ an toàn." : "Đăng nhập để đồng bộ tiến độ xem trên mọi thiết bị."}</p>
            </div>
            <Link className="text-link" href={user ? "/browse" : "/account"}>{user ? "Khám phá phim" : "Xem hồ sơ"} <span>→</span></Link>
          </section>
        )}
        <ImportedMovieRail movies={importedMovies} />
        <MediaRail title="Đang thịnh hành" eyebrow="ĐƯỢC XEM NHIỀU TUẦN NÀY" movies={trending} />
        <MediaRail title="Mới trên CineWave" eyebrow="NHỮNG CÂU CHUYỆN VỪA CẬP BẾN" movies={newReleases} />
        <MediaRail title="Dành riêng cho bạn" eyebrow="TUYỂN CHỌN THEO CẢM HỨNG" movies={forYou} />
      </div>
      <Footer />
    </main>
  );
}
