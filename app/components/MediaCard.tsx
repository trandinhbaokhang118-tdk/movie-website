import Link from "next/link";
import type { Movie } from "@/lib/catalog";
import { QuickSaveButton } from "./QuickSaveButton";
import { PosterArtwork } from "./PosterArtwork";

export function MediaCard({
  movie,
  priority = false,
  progress,
  href,
  initialSaved = false,
}: {
  movie: Movie;
  priority?: boolean;
  progress?: number;
  href?: string;
  initialSaved?: boolean;
}) {
  const detailHref = `/title/${movie.id}`;
  const watchHref = movie.video ? `/watch/${movie.id}` : detailHref;
  return (
    <article className="media-card">
      <div className="media-card-stage" style={{ "--card-accent": movie.accent } as React.CSSProperties}>
      <QuickSaveButton movieId={movie.id} initialSaved={initialSaved} compact />
      <Link href={href ?? detailHref} className="media-card-link" aria-label={`Xem thông tin ${movie.title}`}>
        <div className="poster-wrap" style={{ "--card-accent": movie.accent } as React.CSSProperties}>
          <PosterArtwork
            src={movie.poster}
            title={movie.title}
            alt=""
            priority={priority}
            sizes="(max-width: 760px) 42vw, 220px"
          />
          <div className="poster-overlay">
            <span className="card-play" aria-hidden="true">▶</span>
            <span className="card-match">{movie.match}% phù hợp</span>
          </div>
          {typeof progress === "number" && (
            <div className="progress-track" aria-label={`Đã xem ${progress}%`}>
              <span style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </Link>
      <div className="media-card-preview" aria-label={`Xem nhanh ${movie.title}`}>
        <div className="media-preview-heading">
          <div><strong>{movie.title}</strong>{movie.originalTitle ? <small>{movie.originalTitle}</small> : null}</div>
          <span>{movie.match}%</span>
        </div>
        <div className="media-preview-actions">
          <Link className="media-preview-play" href={watchHref}><span aria-hidden="true">▶</span> {movie.video ? "Xem phim" : "Xem ngay"}</Link>
          <Link className="media-preview-detail" href={detailHref}><span aria-hidden="true">ⓘ</span> Chi tiết</Link>
        </div>
        <div className="media-preview-meta"><span>{movie.year}</span><span>{movie.maturity}</span><span>{movie.duration}</span></div>
        <div className="media-preview-genres">{movie.genres.slice(0, 3).map((genre) => <span key={genre}>{genre}</span>)}</div>
      </div>
      </div>
      <Link href={href ?? detailHref} className="media-card-copy">
          <h3>{movie.title}</h3>
          <p>
            {movie.year} <span>•</span> {movie.maturity}
          </p>
      </Link>
    </article>
  );
}
