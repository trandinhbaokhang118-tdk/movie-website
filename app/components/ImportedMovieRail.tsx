"use client";

import { useEffect, useRef, useState } from "react";
import type { ImportedMovie } from "@/lib/tmdb/types";
import { ImportedMovieCard } from "./ImportedMovieCard";

export function ImportedMovieRail({ movies }: { movies: ImportedMovie[] }) {
  if (movies.length === 0) return null;
  return <ImportedMovieRailContent movies={movies} />;
}

function ImportedMovieRailContent({ movies }: { movies: ImportedMovie[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(6);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () => setPerPage(Math.max(2, Math.floor((element.clientWidth + 16) / ((element.clientWidth < 560 ? 148 : element.clientWidth < 900 ? 172 : 190) + 16))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const pageCount = Math.max(1, Math.ceil(movies.length / perPage));
  const safePage = Math.min(page, pageCount - 1);
  const pageMovies = movies.slice(safePage * perPage, (safePage + 1) * perPage);
  const move = (nextPage: number) => {
    setPage(Math.min(pageCount - 1, Math.max(0, nextPage)));
    viewport.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  return (
    <section className="rail-section imported-section">
      <div className="section-heading">
        <div><p className="eyebrow">DỮ LIỆU CẬP NHẬT TỪ TMDB</p><h2>Trailer đang được quan tâm</h2></div>
        <span className="section-count">{movies.length} tựa phim</span>
      </div>
      <div className="paginated-rail" ref={viewport}>
        {pageCount > 1 ? <button className="rail-arrow rail-arrow-left" type="button" onClick={() => move(safePage - 1)} disabled={safePage === 0} aria-label="Trang trailer trước">‹</button> : null}
        <div className="imported-rail" style={{ "--rail-columns": Math.min(perPage, Math.max(1, pageMovies.length)) } as React.CSSProperties}>
          {pageMovies.map((movie) => <ImportedMovieCard key={movie.id} movie={movie} />)}
        </div>
        {pageCount > 1 ? <button className="rail-arrow rail-arrow-right" type="button" onClick={() => move(safePage + 1)} disabled={safePage === pageCount - 1} aria-label="Trang trailer sau">›</button> : null}
      </div>
      {pageCount > 1 ? <nav className="rail-pagination" aria-label="Phân trang trailer">{Array.from({ length: pageCount }, (_, index) => <button key={index} type="button" className={safePage === index ? "is-active" : ""} onClick={() => move(index)} aria-current={safePage === index ? "page" : undefined}>{index + 1}</button>)}</nav> : null}
      <p className="tmdb-notice">Dữ liệu phim và trailer từ TMDB. CineWave không được TMDB chứng nhận hoặc bảo trợ.</p>
    </section>
  );
}
