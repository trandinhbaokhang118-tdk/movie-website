import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CinematicDepth } from "../../components/CinematicDepth";
import { Footer } from "../../components/Footer";
import { ImportedMovieRail } from "../../components/ImportedMovieRail";
import { MediaRail } from "../../components/MediaRail";
import { MoviePreviewStage } from "../../components/MoviePreviewStage";
import { ReactionBar } from "../../components/ReactionBar";
import { RightsTransparency } from "../../components/RightsTransparency";
import { SiteHeader } from "../../components/SiteHeader";
import { TrailerModal } from "../../components/TrailerModal";
import { WatchlistButton } from "../../components/WatchlistButton";
import { getCurrentUser, signInPath } from "../../auth";
import { ensureViewer, findImportedMovie, findManagedTitle, getActiveProfile, isInWatchlist, listImportedMovies, listWatchlist, type ManagedTitle } from "@/db/runtime";
import { findMovie, licensedCatalogInfo, maturityAllows, movies } from "@/lib/catalog";
import type { ImportedMovie } from "@/lib/tmdb/types";

export const dynamic = "force-dynamic";

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = findMovie(id);
  if (!movie) {
    const managed = await findManagedTitle(id);
    if (managed) return <ManagedTitlePage title={managed} />;
    const imported = await findImportedMovie(id);
    if (!imported) notFound();
    const related = (await listImportedMovies(12)).filter((item) => item.id !== imported.id).slice(0, 8);
    return <ImportedTitlePage movie={imported} related={related} />;
  }

  const user = await getCurrentUser();
  const viewerState = user ? await (async () => {
    const viewer = await ensureViewer(user.email, user.displayName);
    const profile = await getActiveProfile(viewer.id);
    const savedIds = await listWatchlist(viewer.id, profile.id);
    return { profile, savedIds };
  })() : null;
  if (viewerState && !maturityAllows(movie, viewerState.profile.maturity)) notFound();
  const saved = viewerState?.savedIds.includes(movie.id) ?? false;
  const similar = movies.filter((item) => item.id !== movie.id && item.genres.some((genre) => movie.genres.includes(genre)));

  return (
    <main className="title-experience">
      <SiteHeader />
      <section className="detail-hero detail-hero-premium" style={{ "--hero-accent": movie.accent } as React.CSSProperties}>
        <Image className="hero-image" src={movie.backdrop} alt="" fill priority sizes="100vw" />
        <div className="detail-scrim" />
        <div className="page-shell detail-premium-grid">
          <div className="detail-content">
            <Link className="back-link" href="/browse">← Trở lại thư viện</Link>
            <p className="hero-kicker"><span>CINEWAVE</span> TUYỂN CHỌN ĐÊM NAY</p>
            <h1>{movie.title}</h1>
            {movie.originalTitle ? <p className="hero-original">{movie.originalTitle}</p> : null}
            <div className="title-meta"><strong>{movie.match}% phù hợp</strong><span>{movie.year}</span><span className="maturity-badge">{movie.maturity}</span><span>{movie.duration}</span><span>4K · HDR</span></div>
            <p className="detail-synopsis">{movie.synopsis}</p>
            <div className="hero-actions">
              {movie.source && movie.video ? <Link className="button button-cinema" href={`/watch/${movie.id}`}><span aria-hidden="true">▶</span> Xem phim</Link> : <span className="button button-secondary" aria-disabled="true">Chưa có quyền phát</span>}
              <WatchlistButton movieId={movie.id} initialSaved={saved} signInUrl={signInPath(`/title/${movie.id}`)} />
              {movie.video ? <TrailerModal title={movie.title} videoSrc={movie.video.src} triggerLabel="Xem trailer 60 giây" videoStartSeconds={105} maxPreviewSeconds={60} /> : null}
              <a className="round-action" href="#movie-information" aria-label="Xem thông tin phim">↓</a>
            </div>
          </div>
          <aside className="detail-poster-card detail-preview-card">
            <MoviePreviewStage title={movie.title} poster={movie.poster} backdrop={movie.backdrop} scenes={movie.id === "ia-sprite-fright-2021" ? ["/media/artwork/sprite-fright-mushrooms.jpg", "/media/artwork/sprite-fright-night.jpg"] : [movie.backdrop, movie.poster]} videoSrc={movie.video?.src} previewStartSeconds={movie.id === "ia-sprite-fright-2021" ? 168 : 5} />
            <div className="detail-score"><div><small>Điểm phù hợp</small><strong>{movie.match}</strong></div><span>Top picks<br />cho hồ sơ này</span></div>
          </aside>
        </div>
      </section>

      <div id="movie-information" className="page-shell detail-body detail-bento-body">
        <section className="detail-command-bento" aria-label="Tương tác với phim">
          <article className="command-feature"><span>✦</span><div><p className="eyebrow">CẢM NHẬN CỦA BẠN</p><h2>Phim này có hợp gu?</h2><p>Đánh giá giúp CineWave tuyển chọn chính xác hơn cho những đêm tiếp theo.</p></div></article>
          <ReactionBar movieId={movie.id} />
        </section>

        <section className="detail-facts detail-facts-bento" aria-label="Thông tin phim">
          <div className="fact-lead"><p>Đạo diễn</p><strong>{movie.director}</strong><span>Một tác phẩm tuyển chọn bởi CineWave</span></div>
          <div><p>Diễn viên</p><strong>{movie.cast.join(", ")}</strong></div>
          <div><p>Thể loại</p><strong>{movie.genres.join(", ")}</strong></div>
          <div><p>Âm thanh & hình ảnh</p><strong>Tiếng Việt · English<br />4K · HDR · Spatial audio</strong></div>
        </section>

        {movie.source ? <RightsTransparency title={movie.title} source={movie.source} importedAt={licensedCatalogInfo.generatedAt} /> : null}

        {movie.series ? (
          <section className="episodes-section">
            <div className="section-heading editorial-heading"><div><p className="eyebrow">MÙA {movie.series.season}</p><h2>Danh sách tập</h2></div><span className="section-count">{movie.series.episodes} tập</span></div>
            <div className="episode-list">
              {Array.from({ length: movie.series.episodes }, (_, index) => (
                <Link href={`/watch/${movie.id}?episode=${index + 1}`} key={index} className="episode-row">
                  <span className="episode-number">{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>Tập {index + 1}: {index === 0 ? "Cánh cửa mở ra" : "Dấu vết còn lại"}</h3><p>48 phút · HD</p></div><span aria-hidden="true">▶</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <MediaRail title="Có thể bạn cũng thích" movies={similar.length ? similar : movies.slice(0, 5)} savedMovieIds={viewerState?.savedIds ?? []} />
      </div>
      <Footer />
    </main>
  );
}

async function ManagedTitlePage({ title }: { title: ManagedTitle }) {
  const user = await getCurrentUser();
  const saved = user ? await ensureViewer(user.email, user.displayName).then(async (viewer) => {
    const profile = await getActiveProfile(viewer.id);
    return isInWatchlist(viewer.id, profile.id, title.id);
  }) : false;
  const safePoster = title.posterUrl?.replace(/["'()\\]/g, (character) => encodeURIComponent(character));
  return <main className="title-experience"><SiteHeader /><section className="detail-hero managed-detail-hero detail-hero-premium" style={safePoster ? { backgroundImage: `linear-gradient(90deg, rgba(5,4,11,.98) 0%, rgba(5,4,11,.72) 48%, rgba(5,4,11,.35)), url("${safePoster}")` } : undefined}><CinematicDepth /><div className="page-shell detail-content"><Link className="back-link" href="/browse">← Trở lại thư viện</Link><p className="hero-kicker"><span>CINEWAVE</span> CMS PUBLISHED</p><h1>{title.title}</h1><p className="hero-original">{title.originalTitle}</p><div className="title-meta"><strong>Đã kiểm duyệt</strong><span>{title.releaseYear}</span><span className="maturity-badge">{title.maturity}</span><span>{title.duration}</span><span>{title.contentType === "series" ? "Series" : "Phim lẻ"}</span></div><p className="detail-synopsis">{title.synopsis}</p><div className="hero-actions">{title.videoUrl ? <Link className="button button-cinema" href={`/watch/${title.id}`}><span aria-hidden="true">▶</span> Xem phim</Link> : <span className="button button-secondary" aria-disabled="true">Đang xử lý media</span>}<WatchlistButton movieId={title.id} initialSaved={saved} signInUrl={signInPath(`/title/${title.id}`)} /></div></div></section><div className="page-shell detail-body detail-bento-body"><section className="detail-facts detail-facts-bento" aria-label="Thông tin phim"><div><p>Thể loại</p><strong>{title.genres}</strong></div><div><p>Phân loại</p><strong>{title.maturity}</strong></div><div><p>Nguồn phát</p><strong>{title.videoUrl ? "Media đã đăng ký" : "Đang xử lý"}</strong></div><div><p>Trạng thái</p><strong>Published</strong></div></section><section className="rights-notice"><div><p className="eyebrow">MINH BẠCH BẢN QUYỀN</p><h2>{title.licenseName}</h2></div><p>Bản ghi được tạo bởi {title.createdBy}. <a className="text-link" href={title.licenseUrl} target="_blank" rel="noreferrer">Xem giấy phép nguồn ↗</a></p></section></div><Footer /></main>;
}

function ImportedTitlePage({ movie, related }: { movie: ImportedMovie; related: ImportedMovie[] }) {
  return (
    <main className="title-experience"><SiteHeader /><section className="detail-hero external-detail-hero detail-hero-premium">{movie.backdropUrl || movie.posterUrl ? <Image className="hero-image" src={movie.backdropUrl ?? movie.posterUrl ?? ""} alt="" fill priority sizes="100vw" /> : <div className="detail-placeholder-backdrop" />}<div className="detail-scrim" /><CinematicDepth accent="#62e7e2" /><div className="page-shell detail-content"><Link className="back-link" href="/browse">← Trở lại thư viện</Link><p className="hero-kicker"><span>TMDB</span> ĐANG ĐƯỢC QUAN TÂM</p><h1>{movie.title}</h1>{movie.originalTitle !== movie.title ? <p className="hero-original">{movie.originalTitle}</p> : null}<div className="title-meta"><strong>★ {movie.voteAverage.toFixed(1)}/10</strong>{movie.year ? <span>{movie.year}</span> : null}<span className="maturity-badge">Metadata</span><span>{movie.trailerKey ? "Có trailer" : "Đang cập nhật trailer"}</span></div><p className="detail-synopsis">{movie.overview || "Thông tin nội dung đang được cập nhật từ nhà cung cấp dữ liệu."}</p><div className="hero-actions"><TrailerModal title={movie.title} youtubeKey={movie.trailerKey} /><a className="button button-glass" href={`https://www.themoviedb.org/movie/${movie.providerId}`} target="_blank" rel="noreferrer">Thông tin trên TMDB ↗</a></div></div></section><div className="page-shell detail-body detail-bento-body"><section className="rights-notice"><div><p className="eyebrow">MINH BẠCH BẢN QUYỀN</p><h2>Trailer và thông tin phim</h2></div><p>CineWave chỉ hiển thị metadata và trailer được công bố. Phim đầy đủ không được phát nếu chưa có quyền phân phối.</p></section><section className="detail-facts detail-facts-bento" aria-label="Thông tin phim"><div><p>Nguồn dữ liệu</p><strong>TMDB</strong></div><div><p>Tựa gốc</p><strong>{movie.originalTitle}</strong></div><div><p>Năm phát hành</p><strong>{movie.year ?? "Đang cập nhật"}</strong></div><div><p>Trailer</p><strong>{movie.trailerKey ? "YouTube chính thức/được công bố" : "Chưa khả dụng"}</strong></div></section><ImportedMovieRail movies={related} /></div><Footer /></main>
  );
}
