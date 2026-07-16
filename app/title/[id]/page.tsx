import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "../../components/Footer";
import { ImportedMovieRail } from "../../components/ImportedMovieRail";
import { MediaRail } from "../../components/MediaRail";
import { SiteHeader } from "../../components/SiteHeader";
import { TrailerModal } from "../../components/TrailerModal";
import { WatchlistButton } from "../../components/WatchlistButton";
import { chatGPTSignInPath, getChatGPTUser } from "../../chatgpt-auth";
import { ensureViewer, findImportedMovie, isInWatchlist, listImportedMovies } from "@/db/runtime";
import { findMovie, movies } from "@/lib/catalog";
import type { ImportedMovie } from "@/lib/tmdb/types";

export const dynamic = "force-dynamic";

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = findMovie(id);
  if (!movie) {
    const imported = await findImportedMovie(id);
    if (!imported) notFound();
    const related = (await listImportedMovies(12)).filter((item) => item.id !== imported.id).slice(0, 8);
    return <ImportedTitlePage movie={imported} related={related} />;
  }

  const user = await getChatGPTUser();
  const saved = user
    ? await ensureViewer(user.email, user.displayName).then((viewer) => isInWatchlist(viewer.id, movie.id))
    : false;
  const similar = movies.filter((item) => item.id !== movie.id && item.genres.some((genre) => movie.genres.includes(genre)));

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
          <div className="title-meta"><strong>{movie.match}% phù hợp</strong><span>{movie.year}</span><span className="maturity-badge">{movie.maturity}</span><span>{movie.duration}</span><span>HD</span></div>
          <p className="detail-synopsis">{movie.synopsis}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={`/watch/${movie.id}`}><span aria-hidden="true">▶</span> Xem ngay</Link>
            <WatchlistButton movieId={movie.id} initialSaved={saved} signInUrl={chatGPTSignInPath(`/title/${movie.id}`)} />
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
        {movie.series ? (
          <section className="episodes-section">
            <div className="section-heading"><div><p className="eyebrow">MÙA {movie.series.season}</p><h2>Danh sách tập</h2></div><span className="section-count">{movie.series.episodes} tập</span></div>
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
        ) : null}
        <MediaRail title="Có thể bạn cũng thích" movies={similar.length ? similar : movies.slice(0, 5)} />
      </div>
      <Footer />
    </main>
  );
}

function ImportedTitlePage({ movie, related }: { movie: ImportedMovie; related: ImportedMovie[] }) {
  return (
    <main>
      <SiteHeader />
      <section className="detail-hero external-detail-hero">
        {movie.backdropUrl || movie.posterUrl ? <img className="hero-image" src={movie.backdropUrl ?? movie.posterUrl ?? ""} alt="" /> : <div className="detail-placeholder-backdrop" />}
        <div className="detail-scrim" />
        <div className="page-shell detail-content">
          <Link className="back-link" href="/browse">← Trở lại thư viện</Link>
          <p className="hero-kicker"><span>TMDB</span> PHIM ĐANG ĐƯỢC QUAN TÂM</p>
          <h1>{movie.title}</h1>
          {movie.originalTitle !== movie.title ? <p className="hero-original">{movie.originalTitle}</p> : null}
          <div className="title-meta"><strong>★ {movie.voteAverage.toFixed(1)}/10</strong>{movie.year ? <span>{movie.year}</span> : null}<span className="maturity-badge">Metadata</span><span>{movie.trailerKey ? "Có trailer" : "Đang cập nhật trailer"}</span></div>
          <p className="detail-synopsis">{movie.overview || "Thông tin nội dung đang được cập nhật từ nhà cung cấp dữ liệu."}</p>
          <div className="hero-actions">
            <TrailerModal title={movie.title} youtubeKey={movie.trailerKey} />
            <a className="button button-secondary" href={`https://www.themoviedb.org/movie/${movie.providerId}`} target="_blank" rel="noreferrer">Thông tin trên TMDB ↗</a>
          </div>
        </div>
      </section>
      <div className="page-shell detail-body external-detail-body">
        <section className="rights-notice">
          <div><p className="eyebrow">MINH BẠCH BẢN QUYỀN</p><h2>Trailer và thông tin phim</h2></div>
          <p>CineWave chỉ hiển thị metadata và trailer được nhà cung cấp công bố. Phim đầy đủ chưa được phát nếu chưa có quyền phân phối.</p>
        </section>
        <section className="detail-facts" aria-label="Thông tin phim">
          <div><p>Nguồn dữ liệu</p><strong>TMDB</strong></div>
          <div><p>Tựa gốc</p><strong>{movie.originalTitle}</strong></div>
          <div><p>Năm phát hành</p><strong>{movie.year ?? "Đang cập nhật"}</strong></div>
          <div><p>Trailer</p><strong>{movie.trailerKey ? "YouTube chính thức/được công bố" : "Chưa khả dụng"}</strong></div>
        </section>
        <ImportedMovieRail movies={related} />
      </div>
      <Footer />
    </main>
  );
}
