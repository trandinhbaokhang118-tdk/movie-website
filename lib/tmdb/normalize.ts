import type { ImportedMovie, TmdbMovieSummary, TmdbVideo } from "./types";

const IMAGE_BASE = "https://image.tmdb.org/t/p";
const SAFE_YOUTUBE_KEY = /^[A-Za-z0-9_-]{6,20}$/;

export function chooseTrailer(videos: TmdbVideo[]) {
  return videos
    .filter((video) => video.site === "YouTube" && SAFE_YOUTUBE_KEY.test(video.key))
    .sort((left, right) => trailerScore(right) - trailerScore(left))[0] ?? null;
}

export function normalizeMovie(movie: TmdbMovieSummary, videos: TmdbVideo[]): ImportedMovie {
  const trailer = chooseTrailer(videos);
  return {
    id: `tmdb-${movie.id}`,
    providerId: movie.id,
    title: movie.title.trim() || movie.original_title,
    originalTitle: movie.original_title,
    year: parseYear(movie.release_date),
    overview: movie.overview.trim(),
    posterUrl: imageUrl(movie.poster_path, "w500"),
    backdropUrl: imageUrl(movie.backdrop_path, "w1280"),
    voteAverage: Number(movie.vote_average.toFixed(1)),
    popularity: movie.popularity,
    trailerKey: trailer?.key ?? null,
    trailerSite: trailer?.site ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function trailerScore(video: TmdbVideo) {
  const type = video.type === "Trailer" ? 40 : video.type === "Teaser" ? 20 : 0;
  const official = video.official ? 10 : 0;
  return type + official + Date.parse(video.published_at || "1970-01-01") / 1e13;
}

function imageUrl(path: string | null, size: "w500" | "w1280") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

function parseYear(releaseDate?: string) {
  const year = Number(releaseDate?.slice(0, 4));
  return Number.isInteger(year) && year > 1880 ? year : null;
}
