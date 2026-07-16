import type { ImportedMovie } from "@/lib/tmdb/types";
import { ImportedMovieCard } from "./ImportedMovieCard";

export function ImportedCatalog({ movies, priorityCount = 0 }: { movies: ImportedMovie[]; priorityCount?: number }) {
  if (movies.length === 0) return null;
  return (
    <>
      <div className="imported-catalog-grid">
        {movies.map((movie, index) => <ImportedMovieCard key={movie.id} movie={movie} priority={index < priorityCount} />)}
      </div>
      <p className="tmdb-notice">Dữ liệu phim và trailer từ TMDB. CineWave không được TMDB chứng nhận hoặc bảo trợ.</p>
    </>
  );
}
