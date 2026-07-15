import { env } from "cloudflare:workers";
import { listImportedMovies, saveImportedMovies } from "@/db/runtime";
import { TmdbClient } from "./client";
import { normalizeMovie } from "./normalize";
import type { ImportedMovie, TmdbCredential } from "./types";

type CatalogSyncResult = {
  imported: number;
  trailerCount: number;
  movies: ImportedMovie[];
};

export async function syncTmdbCatalog(limit = 18): Promise<CatalogSyncResult> {
  const credential = tmdbCredential();
  if (!credential) {
    throw new Error("TMDB chưa được cấu hình. Hãy thêm TMDB_ACCESS_TOKEN hoặc TMDB_API_KEY.");
  }

  const client = new TmdbClient(credential);
  const discovery = await client.discoverMovies(1);
  const candidates = discovery.results.filter((movie) => !movie.adult).slice(0, clamp(limit, 1, 20));
  const movies = await mapWithConcurrency(candidates, 4, async (movie) => {
    const videos = await client.movieVideos(movie.id);
    return normalizeMovie(movie, videos);
  });
  await saveImportedMovies(movies);
  return {
    imported: movies.length,
    trailerCount: movies.filter((movie) => movie.trailerKey).length,
    movies,
  };
}

export async function importedMoviesForHome() {
  const saved = await listImportedMovies(14);
  if (saved.length > 0 || !tmdbCredential()) return saved;
  try {
    return (await syncTmdbCatalog(14)).movies;
  } catch {
    return [];
  }
}

export function tmdbCredential(): TmdbCredential | null {
  const runtime = env as unknown as {
    TMDB_ACCESS_TOKEN?: string;
    TMDB_API_KEY?: string;
  };
  const token = runtime.TMDB_ACCESS_TOKEN?.trim();
  if (token) return { kind: "bearer", value: token };
  const apiKey = runtime.TMDB_API_KEY?.trim();
  return apiKey ? { kind: "api-key", value: apiKey } : null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const output = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return output;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(value)));
}
