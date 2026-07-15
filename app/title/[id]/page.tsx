import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "../../components/Footer";
import { MediaRail } from "../../components/MediaRail";
import { SiteHeader } from "../../components/SiteHeader";
import { WatchlistButton } from "../../components/WatchlistButton";
import { chatGPTSignInPath, getChatGPTUser } from "../../chatgpt-auth";
import { ensureViewer, isInWatchlist } from "@/db/runtime";
import { findMovie, movies } from "@/lib/catalog";

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = findMovie(id);
  if (!movie) notFound();
  const user = await getChatGPTUser();
  const saved = user
    ? await ensureViewer(user.email, user.displayName).then((viewer) =>
        isInWatchlist(viewer.id, movie.id),
      )
    : false;
  const similar = movies.filter(
    (item) => item.id !== movie.id && item.genres.some((genre) => movie.genres.includes(genre)),
  );

  return (
    <main>
      <SiteHeader />
      <section className="detail-hero" style={{ "--hero-accent": movie.accent } as React.CSSProperties}>
        <img className="hero-image" src={movie.backdrop} alt="" />
        <div className="detail-scrim" />
        <div className="page-shell detail-content">
          <Link className="back-link" href="/browse">← Trở lại thư viện</Link>
          <p className="hero-kicker"><span>CINEWAVE</span> TUYỂN CHỌN</p>
          <h1>{movie.title}</h1>
          {movie.originalTitle && <p className="hero-original">{movie.originalTitle}</p>}
          <div className="title-meta">
            <strong>{movie.match}% phù hợp</strong>
            <span>{movie.year}</span>
            <span className="maturity-badge">{movie.maturity}</span>
            <span>{movie.duration}</span>
            <span>HD</span>
          </div>
          <p className="detail-synopsis">{movie.synopsis}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={`/watch/${movie.id}`}>
              <span aria-hidden="true">▶</span> Xem ngay
            </Link>
            <WatchlistButton
              movieId={movie.id}
              initialSaved={saved}
              signInUrl={chatGPTSignInPath(`/title/${movie.id}`)}
            />
          </div>
        </div>
      </section>

      <div className="page-shell detail-body">
        <section className="detail-facts" aria-label="Thông tin phim">
          <div><p>Đạo diễn</p><strong>{movie.director}</strong></div>
          <div><p>Diễn viên</p><strong>{movie.cast.join(", ")}</strong></div>
          <div><p>Thể loại</p><strong>{movie.genres.join(", ")}</strong></div>
          <div><p>Âm thanh</p><strong>Tiếng Việt · English</strong></div>
        </section>
        {movie.series && (
          <section className="episodes-section">
            <div className="section-heading">
              <div><p className="eyebrow">MÙA {movie.series.season}</p><h2>Danh sách tập</h2></div>
              <span className="section-count">{movie.series.episodes} tập</span>
            </div>
            <div className="episode-list">
              {Array.from({ length: movie.series.episodes }, (_, index) => (
                <Link href={`/watch/${movie.id}?episode=${index + 1}`} key={index} className="episode-row">
                  <span className="episode-number">{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>Tập {index + 1}: {index === 0 ? "Cánh cửa mở ra" : "Dấu vết còn lại"}</h3><p>48 phút · HD</p></div>
                  <span aria-hidden="true">▶</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <MediaRail title="Có thể bạn cũng thích" movies={similar.length ? similar : movies.slice(0, 5)} />
      </div>
      <Footer />
    </main>
  );
}
