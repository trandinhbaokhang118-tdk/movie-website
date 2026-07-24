"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Movie } from "@/lib/catalog";
import { MediaCard } from "./MediaCard";

export function MediaRail({
  title,
  eyebrow,
  movies,
  progressById,
  watchDirectly = false,
  savedMovieIds = [],
}: {
  title: string;
  eyebrow?: string;
  movies: Movie[];
  progressById?: Record<string, number>;
  watchDirectly?: boolean;
  savedMovieIds?: string[];
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(6);
  const saved = useMemo(() => new Set(savedMovieIds), [savedMovieIds]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () => {
      const width = element.clientWidth;
      const cardWidth = width < 560 ? 148 : width < 900 ? 172 : 190;
      setPerPage(Math.max(2, Math.floor((width + 16) / (cardWidth + 16))));
    };
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
    <section className="rail-section" aria-labelledby={`rail-${title.replaceAll(" ", "-")}`}>
      <div className="section-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={`rail-${title.replaceAll(" ", "-")}`}>{title}</h2>
        </div>
        <span className="section-count">{movies.length} tựa phim</span>
      </div>
      <div className="paginated-rail" ref={viewport}>
        {pageCount > 1 ? <button className="rail-arrow rail-arrow-left" type="button" onClick={() => move(safePage - 1)} disabled={safePage === 0} aria-label={`Trang trước của ${title}`}>‹</button> : null}
        <div className="media-rail" style={{ "--rail-columns": Math.min(perPage, Math.max(1, pageMovies.length)) } as React.CSSProperties}>
        {pageMovies.map((movie) => (
          <MediaCard
            key={movie.id}
            movie={movie}
            progress={progressById?.[movie.id]}
            href={watchDirectly ? `/watch/${movie.id}` : undefined}
            initialSaved={saved.has(movie.id)}
          />
        ))}
        </div>
        {pageCount > 1 ? <button className="rail-arrow rail-arrow-right" type="button" onClick={() => move(safePage + 1)} disabled={safePage === pageCount - 1} aria-label={`Trang sau của ${title}`}>›</button> : null}
      </div>
      {pageCount > 1 ? (
        <nav className="rail-pagination" aria-label={`Phân trang ${title}`}>
          {Array.from({ length: pageCount }, (_, index) => (
            <button key={index} type="button" className={safePage === index ? "is-active" : ""} onClick={() => move(index)} aria-current={safePage === index ? "page" : undefined}>{index + 1}</button>
          ))}
        </nav>
      ) : null}
    </section>
  );
}
