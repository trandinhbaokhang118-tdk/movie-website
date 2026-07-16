import type { Movie } from "@/lib/catalog";
import { MediaCard } from "./MediaCard";

export function MediaRail({
  title,
  eyebrow,
  movies,
  progressById,
  watchDirectly = false,
}: {
  title: string;
  eyebrow?: string;
  movies: Movie[];
  progressById?: Record<string, number>;
  watchDirectly?: boolean;
}) {
  return (
    <section className="rail-section" aria-labelledby={`rail-${title.replaceAll(" ", "-")}`}>
      <div className="section-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={`rail-${title.replaceAll(" ", "-")}`}>{title}</h2>
        </div>
        <span className="section-count">{movies.length} tựa phim</span>
      </div>
      <div className="media-rail">
        {movies.map((movie) => (
          <MediaCard
            key={movie.id}
            movie={movie}
            progress={progressById?.[movie.id]}
            href={watchDirectly ? `/watch/${movie.id}` : undefined}
          />
        ))}
      </div>
    </section>
  );
}
