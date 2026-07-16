"use client";

import type { ImportedMovie } from "@/lib/tmdb/types";
import { ImportedMovieCard } from "./ImportedMovieCard";

export function ImportedMovieRail({ movies }: { movies: ImportedMovie[] }) {
  if (movies.length === 0) return null;
  return (
    <section className="rail-section imported-section">
      <div className="section-heading">
        <div><p className="eyebrow">DỮ LIỆU CẬP NHẬT TỪ TMDB</p><h2>Trailer đang được quan tâm</h2></div>
        <span className="section-count">{movies.length} tựa phim</span>
      </div>
      <div className="imported-rail">
        {movies.map((movie) => <ImportedMovieCard key={movie.id} movie={movie} />)}
      </div>
      <p className="tmdb-notice">Dữ liệu phim và trailer từ TMDB. CineWave không được TMDB chứng nhận hoặc bảo trợ.</p>
    </section>
  );
}
