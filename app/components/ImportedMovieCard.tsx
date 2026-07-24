import Link from "next/link";
import Image from "next/image";
import type { ImportedMovie } from "@/lib/tmdb/types";
import { TrailerModal } from "./TrailerModal";

export function ImportedMovieCard({ movie, priority = false }: { movie: ImportedMovie; priority?: boolean }) {
  return (
    <article className="imported-card">
      <div className="imported-card-stage">
      <div className="imported-poster">
        {movie.posterUrl ? (
          <Image src={movie.posterUrl} alt={`Poster ${movie.title}`} fill priority={priority} sizes="(max-width: 760px) 44vw, 220px" />
        ) : (
          <div className="poster-placeholder">CINEWAVE</div>
        )}
        <div className="imported-overlay">
          <div className="imported-preview-heading"><strong>{movie.title}</strong><span>★ {movie.voteAverage.toFixed(1)}</span></div>
          <p>{movie.year ?? "Sắp công bố"} · {movie.trailerKey ? "Có trailer" : "Đang cập nhật"}</p>
          <div className="imported-preview-actions"><TrailerModal title={movie.title} youtubeKey={movie.trailerKey} compact /><Link className="imported-details-link" href={`/title/${movie.id}`}>ⓘ Chi tiết</Link></div>
        </div>
        <span className="rating-chip">★ {movie.voteAverage.toFixed(1)}</span>
      </div>
      </div>
      <Link className="imported-card-copy" href={`/title/${movie.id}`}>
        <h3>{movie.title}</h3>
        <p>{movie.year ?? "Sắp công bố"} · {movie.trailerKey ? "Có trailer" : "Đang cập nhật"}</p>
      </Link>
    </article>
  );
}
