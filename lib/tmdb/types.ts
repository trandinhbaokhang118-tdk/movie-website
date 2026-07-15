export type TmdbCredential =
  | { kind: "bearer"; value: string }
  | { kind: "api-key"; value: string };

export type TmdbMovieSummary = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  popularity: number;
  adult: boolean;
};

export type TmdbDiscoverResponse = {
  page: number;
  total_pages: number;
  results: TmdbMovieSummary[];
};

export type TmdbVideo = {
  id: string;
  key: string;
  name: string;
  official: boolean;
  published_at: string;
  site: string;
  type: string;
};

export type TmdbVideosResponse = { id: number; results: TmdbVideo[] };

export type ImportedMovie = {
  id: string;
  providerId: number;
  title: string;
  originalTitle: string;
  year: number | null;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  voteAverage: number;
  popularity: number;
  trailerKey: string | null;
  trailerSite: string | null;
  updatedAt: string;
};
