"use client";

import type { ImportedMovie } from "@/lib/tmdb/types";
import { TrailerModal } from "./TrailerModal";

export function ImportedMovieRail({ movies }: { movies: ImportedMovie[] }) {
  if (movies.length === 0) return null;
  return (
    <section className="rail-section imported-section">
      <div className="section-heading">
        <div><p className="eyebrow">DỮ LIỆU CẬP NHẬT TỪ TMDB</p><h2>Trailer đang được quan tâm</h2></div>
        <span className="section-count">{movies.length} tựa phim</span>
      </div>
      <div className="imported-rail">
        {movies.map((movie) => (
          <article className="imported-card" key={movie.id}>
            <div className="imported-poster">
              {movie.posterUrl ? <img src={movie.posterUrl} alt={`Poster ${movie.title}`} loading="lazy" /> : <div className="poster-placeholder">CINEWAVE</div>}
              <div className="imported-overlay"><TrailerModal title={movie.title} youtubeKey={movie.trailerKey} compact /></div>
              <span className="rating-chip">★ {movie.voteAverage.toFixed(1)}</span>
            </div>
            <h3>{movie.title}</h3>
            <p>{movie.year ?? "Sắp công bố"} · {movie.trailerKey ? "Có trailer" : "Đang cập nhật"}</p>
          </article>
        ))}
      </div>
      <p className="tmdb-notice">Dữ liệu phim và trailer từ TMDB. CineWave không được TMDB chứng nhận hoặc bảo trợ.</p>
    </section>
  );
}
