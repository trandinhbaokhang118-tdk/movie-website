import Link from "next/link";
import { CinematicHero } from "./components/CinematicHero";
import { Footer } from "./components/Footer";
import { ImportedMovieRail } from "./components/ImportedMovieRail";
import { MediaRail } from "./components/MediaRail";
import { SiteHeader } from "./components/SiteHeader";
import { featuredMovie, movies } from "@/lib/catalog";
import { importedMoviesForHome } from "@/lib/tmdb/sync";

export const dynamic = "force-dynamic";

export default async function Home() {
  const trending = movies.filter((movie) => movie.trending);
  const newReleases = movies.filter((movie) => movie.newRelease);
  const forYou = movies.filter((movie) => !movie.featured).slice(0, 7);
  const importedMovies = await importedMoviesForHome();

  return (
    <main>
      <SiteHeader />
      <CinematicHero movie={featuredMovie} />
      <div className="page-shell home-content">
        <section className="continue-banner">
          <div>
            <p className="eyebrow">XEM TIẾP</p>
            <h2>Câu chuyện của bạn vẫn đang chờ</h2>
            <p>Đăng nhập để đồng bộ tiến độ xem trên mọi thiết bị.</p>
          </div>
          <Link className="text-link" href="/account">Xem hồ sơ <span>→</span></Link>
        </section>
        <ImportedMovieRail movies={importedMovies} />
        <MediaRail title="Đang thịnh hành" eyebrow="ĐƯỢC XEM NHIỀU TUẦN NÀY" movies={trending} />
        <MediaRail title="Mới trên CineWave" eyebrow="NHỮNG CÂU CHUYỆN VỪA CẬP BẾN" movies={newReleases} />
        <MediaRail title="Dành riêng cho bạn" eyebrow="TUYỂN CHỌN THEO CẢM HỨNG" movies={forYou} />
      </div>
      <Footer />
    </main>
  );
}
