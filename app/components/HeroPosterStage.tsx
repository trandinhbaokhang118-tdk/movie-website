"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

type StageMovie = {
  id: string;
  poster: string;
  title: string;
};

export function HeroPosterStage({ movies }: { movies: StageMovie[] }) {
  const posterRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const selectPosterAtPointer = (clientX: number, clientY: number) => {
    const candidates = posterRefs.current.flatMap((poster, index) => {
      if (!poster) return [];
      const rect = poster.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return [];
      const distance = Math.hypot(
        (clientX - (rect.left + rect.width / 2)) / rect.width,
        (clientY - (rect.top + rect.height / 2)) / rect.height,
      );
      return [{ index, distance }];
    });
    if (candidates.length) setActiveIndex(candidates.reduce((closest, candidate) => candidate.distance < closest.distance ? candidate : closest).index);
  };

  return (
    <aside
      className="hero-poster-stage"
      aria-label="Tựa phim nổi bật"
      onPointerMove={(event) => selectPosterAtPointer(event.clientX, event.clientY)}
      onPointerLeave={() => setActiveIndex(null)}
    >
      {movies.map((movie, index) => (
        <Link
          key={movie.id}
          ref={(element) => { posterRefs.current[index] = element; }}
          href={`/title/${movie.id}`}
          className={`stage-poster stage-poster-${index + 1}${activeIndex === index ? " is-active" : ""}`}
          aria-label={`Xem chi tiết ${movie.title}`}
          onFocus={() => setActiveIndex(index)}
          onBlur={() => setActiveIndex(null)}
        >
          <Image src={movie.poster} alt="" width={260} height={390} sizes="220px" unoptimized />
          {index === 0 ? <span>Đang nổi bật</span> : null}
        </Link>
      ))}
    </aside>
  );
}
