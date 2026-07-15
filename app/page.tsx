import Link from "next/link";
import { Footer } from "./components/Footer";
import { MediaRail } from "./components/MediaRail";
import { SiteHeader } from "./components/SiteHeader";
import { featuredMovie, movies } from "@/lib/catalog";

export default function Home() {
  const trending = movies.filter((movie) => movie.trending);
  const newReleases = movies.filter((movie) => movie.newRelease);
  const forYou = movies.filter((movie) => !movie.featured).slice(0, 7);

  return (
    <main>
      <SiteHeader />
      <section className="hero" style={{ "--hero-accent": featuredMovie.accent } as React.CSSProperties}>
        <img className="hero-image" src={featuredMovie.backdrop} alt="" />
        <div className="hero-scrim" />
        <div className="hero-content page-shell">
          <p className="hero-kicker"><span>CINEWAVE</span> PHIM NỔI BẬT</p>
          <h1>{featuredMovie.title}</h1>
          <p className="hero-original">{featuredMovie.originalTitle}</p>
          <div className="title-meta">
            <strong>{featuredMovie.match}% phù hợp</strong>
            <span>{featuredMovie.year}</span>
            <span className="maturity-badge">{featuredMovie.maturity}</span>
            <span>{featuredMovie.duration}</span>
            <span>4K</span>
          </div>
          <p className="hero-synopsis">{featuredMovie.synopsis}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={`/watch/${featuredMovie.id}`}>
              <span aria-hidden="true">▶</span> Xem ngay
            </Link>
            <Link className="button button-secondary" href={`/title/${featuredMovie.id}`}>
              <span aria-hidden="true">ⓘ</span> Chi tiết
            </Link>
          </div>
        </div>
        <p className="hero-credit">Ảnh điện ảnh từ Unsplash</p>
      </section>

      <div className="page-shell home-content">
        <section className="continue-banner">
          <div>
            <p className="eyebrow">XEM TIẾP</p>
            <h2>Câu chuyện của bạn vẫn đang chờ</h2>
            <p>Đăng nhập để đồng bộ tiến độ xem trên mọi thiết bị.</p>
          </div>
          <Link className="text-link" href="/account">Xem hồ sơ <span>→</span></Link>
        </section>
        <MediaRail title="Đang thịnh hành" eyebrow="ĐƯỢC XEM NHIỀU TUẦN NÀY" movies={trending} />
        <MediaRail title="Mới trên CineWave" eyebrow="NHỮNG CÂU CHUYỆN VỪA CẬP BẾN" movies={newReleases} />
        <MediaRail title="Dành riêng cho bạn" eyebrow="TUYỂN CHỌN THEO CẢM HỨNG" movies={forYou} />
      </div>
      <Footer />
    </main>
  );
}
