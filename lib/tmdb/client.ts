import type {
  TmdbCredential,
  TmdbDiscoverResponse,
  TmdbVideosResponse,
} from "./types";

const API_BASE = "https://api.themoviedb.org/3";

export class TmdbClientError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "TmdbClientError";
  }
}

export class TmdbClient {
  constructor(private readonly credential: TmdbCredential) {}

  discoverMovies(page = 1) {
    return this.get<TmdbDiscoverResponse>("/discover/movie", {
      page: String(page),
      language: "vi-VN",
      include_adult: "false",
      include_video: "false",
      sort_by: "popularity.desc",
      "vote_count.gte": "100",
    });
  }

  async movieVideos(movieId: number) {
    const localized = await this.get<TmdbVideosResponse>(`/movie/${movieId}/videos`, {
      language: "vi-VN",
    });
    if (localized.results.length > 0) return localized.results;
    const fallback = await this.get<TmdbVideosResponse>(`/movie/${movieId}/videos`, {
      language: "en-US",
    });
    return fallback.results;
  }

  private async get<T>(pathname: string, parameters: Record<string, string>): Promise<T> {
    const url = new URL(`${API_BASE}${pathname}`);
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));

    const headers = new Headers({ accept: "application/json" });
    if (this.credential.kind === "bearer") {
      headers.set("Authorization", `Bearer ${this.credential.value}`);
    } else {
      url.searchParams.set("api_key", this.credential.value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      if (!response.ok) {
        throw new TmdbClientError(`TMDB phản hồi mã ${response.status}.`, response.status);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof TmdbClientError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new TmdbClientError("Kết nối TMDB quá thời gian cho phép.");
      }
      throw new TmdbClientError("Không thể kết nối đến TMDB.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
