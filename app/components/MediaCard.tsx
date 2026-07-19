import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/lib/catalog";

export function MediaCard({
  movie,
  priority = false,
  progress,
  href,
}: {
  movie: Movie;
  priority?: boolean;
  progress?: number;
  href?: string;
}) {
  return (
    <article className="media-card">
      <Link href={href ?? `/title/${movie.id}`} className="media-card-link">
        <div className="poster-wrap" style={{ "--card-accent": movie.accent } as React.CSSProperties}>
          <Image
            src={movie.poster}
            alt=""
            width="360"
            height="540"
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
        <div className="media-card-copy">
          <h3>{movie.title}</h3>
          <p>
            {movie.year} <span>•</span> {movie.maturity}
          </p>
        </div>
      </Link>
    </article>
  );
}
