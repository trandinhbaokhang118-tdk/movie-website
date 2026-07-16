import Link from "next/link";
import { CinematicHero } from "./components/CinematicHero";
import { Footer } from "./components/Footer";
import { ImportedMovieRail } from "./components/ImportedMovieRail";
import { MediaRail } from "./components/MediaRail";
import { SiteHeader } from "./components/SiteHeader";
import { getChatGPTUser } from "./chatgpt-auth";
import { ensureViewer, listViewingActivity } from "@/db/runtime";
import { demoVideo, featuredMovie, movies } from "@/lib/catalog";
import { importedMoviesForHome } from "@/lib/tmdb/sync";

export const dynamic = "force-dynamic";

export default async function Home() {
  const trending = movies.filter((movie) => movie.trending);
  const newReleases = movies.filter((movie) => movie.newRelease);
  const forYou = movies.filter((movie) => !movie.featured).slice(0, 7);
  const importedMovies = await importedMoviesForHome();
  const user = await getChatGPTUser();
  const activity = user
    ? await ensureViewer(user.email, user.displayName).then((viewer) => listViewingActivity(viewer.id, 12))
    : [];
  const progressById = Object.fromEntries(
    activity.map((item) => [item.movieId, progressPercent(item.positionSeconds)]),
  );
  const continueWatching = activity
    .filter((item) => progressById[item.movieId] < 90)
    .map((item) => movies.find((movie) => movie.id === item.movieId))
    .filter((movie): movie is (typeof movies)[number] => Boolean(movie));

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

function progressPercent(positionSeconds: number) {
  return Math.min(100, Math.max(1, Math.round((positionSeconds / demoVideo.durationSeconds) * 100)));
}
