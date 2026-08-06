import type { Movie } from "../catalog";

export const HYBRID_MODEL_VERSION = "cinewave-hybrid-tfidf-v1.0.0";
export const BASELINE_MODEL_VERSION = "cinewave-baseline-v1.0.0";

export type RecommendationReasonCode =
  | "similar_content"
  | "positive_reaction"
  | "watch_completion"
  | "saved_preference"
  | "trending_now"
  | "new_release"
  | "explore_something_new"
  | "popular_on_cinewave";

export type RecommendationItem = {
  movieId: string;
  rank: number;
  score: number;
  modelVersion: string;
  reasonCodes: RecommendationReasonCode[];
  isExploration: boolean;
};

export type WatchSignal = {
  movieId: string;
  positionSeconds: number;
  updatedAt: string;
};

export type ReactionSignal = {
  movieId: string;
  reaction: "like" | "love" | "not_for_me";
  updatedAt: string;
};

export type HybridRecommendationInput = {
  candidates: Movie[];
  watchHistory?: WatchSignal[];
  savedMovieIds?: string[];
  reactions?: ReactionSignal[];
  trendScores?: ReadonlyMap<string, number>;
  now?: Date;
  limit?: number;
  modelVersion?: string;
};

export type RecommenderMode = "off" | "shadow" | "canary" | "active";

export type RecommendationResult = {
  mode: RecommenderMode;
  servedModelVersion: string;
  items: RecommendationItem[];
  shadowItems?: RecommendationItem[];
};

type SparseVector = Map<string, number>;

type ScoredCandidate = {
  movie: Movie;
  score: number;
  contentScore: number;
  trendScore: number;
  noveltyScore: number;
  reasonCodes: RecommendationReasonCode[];
  isExploration: boolean;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function uniqueMovies(candidates: Movie[]) {
  const byId = new Map<string, Movie>();
  for (const movie of candidates) {
    const movieId = movie.id.trim();
    if (movieId && !byId.has(movieId)) byId.set(movieId, movie);
  }
  return [...byId.values()];
}

function tokenize(movie: Movie) {
  return [movie.title, movie.originalTitle ?? "", movie.synopsis, movie.director, ...movie.genres, ...movie.cast]
    .join(" ")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .match(/[a-z0-9]{2,}/g) ?? [];
}

function buildTfidf(movies: Movie[]) {
  const tokensByMovie = new Map(movies.map((movie) => [movie.id, tokenize(movie)]));
  const documentFrequency = new Map<string, number>();
  for (const tokens of tokensByMovie.values()) {
    for (const token of new Set(tokens)) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
  }
  const vectors = new Map<string, SparseVector>();
  for (const movie of movies) {
    const counts = new Map<string, number>();
    for (const token of tokensByMovie.get(movie.id) ?? []) counts.set(token, (counts.get(token) ?? 0) + 1);
    const vector: SparseVector = new Map();
    for (const [token, count] of counts) {
      const idf = Math.log((movies.length + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1;
      vector.set(token, (1 + Math.log(count)) * idf);
    }
    vectors.set(movie.id, normalizeVector(vector));
  }
  return vectors;
}

function normalizeVector(vector: SparseVector) {
  const magnitude = Math.sqrt([...vector.values()].reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return new Map([...vector].map(([token, value]) => [token, value / magnitude]));
}

function addWeighted(target: SparseVector, source: SparseVector | undefined, weight: number) {
  if (!source || weight === 0) return;
  for (const [token, value] of source) target.set(token, (target.get(token) ?? 0) + value * weight);
}

function cosine(left: SparseVector, right: SparseVector | undefined) {
  if (!right || !left.size) return 0;
  let score = 0;
  for (const [token, value] of left) score += value * (right.get(token) ?? 0);
  return clamp01(score);
}

function recencyWeight(timestamp: string, now: Date, halfLifeDays = 45) {
  const ageMs = Math.max(0, now.getTime() - new Date(timestamp).getTime());
  const ageDays = Number.isFinite(ageMs) ? ageMs / 86_400_000 : halfLifeDays;
  return Math.exp((-Math.log(2) * ageDays) / halfLifeDays);
}

function genreOverlap(left: Movie, right: Movie) {
  const a = new Set(left.genres);
  const b = new Set(right.genres);
  const intersection = [...a].filter((genre) => b.has(genre)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function reasonCodesFor(candidate: Omit<ScoredCandidate, "reasonCodes" | "isExploration">, input: {
  positiveReactionIds: Set<string>;
  watchedIds: Set<string>;
  savedIds: Set<string>;
}) {
  const reasons: RecommendationReasonCode[] = [];
  if (candidate.contentScore >= 0.12) reasons.push("similar_content");
  if (input.positiveReactionIds.size && candidate.contentScore >= 0.2) reasons.push("positive_reaction");
  if (input.watchedIds.size && candidate.contentScore >= 0.16) reasons.push("watch_completion");
  if (input.savedIds.size && candidate.contentScore >= 0.16) reasons.push("saved_preference");
  if (candidate.trendScore >= 0.45) reasons.push("trending_now");
  if (candidate.movie.newRelease) reasons.push("new_release");
  if (!reasons.length) reasons.push("popular_on_cinewave");
  return reasons.slice(0, 3);
}

export function rankHybridRecommendations(input: HybridRecommendationInput): RecommendationItem[] {
  const movies = uniqueMovies(input.candidates);
  const limit = Math.min(50, Math.max(1, Math.floor(input.limit ?? 8)));
  if (!movies.length) return [];

  const now = input.now ?? new Date();
  const movieById = new Map(movies.map((movie) => [movie.id, movie]));
  const vectors = buildTfidf(movies);
  const savedIds = new Set((input.savedMovieIds ?? []).filter((movieId) => movieById.has(movieId)));
  const reactionById = new Map((input.reactions ?? []).map((signal) => [signal.movieId, signal]));
  const rejectedIds = new Set([...reactionById.values()].filter((signal) => signal.reaction === "not_for_me").map((signal) => signal.movieId));
  const positiveReactionIds = new Set([...reactionById.values()].filter((signal) => signal.reaction !== "not_for_me").map((signal) => signal.movieId));
  const watchById = new Map((input.watchHistory ?? []).filter((signal) => movieById.has(signal.movieId)).map((signal) => [signal.movieId, signal]));
  const watchedIds = new Set(watchById.keys());

  const profileVector: SparseVector = new Map();
  for (const [movieId, signal] of watchById) {
    const movie = movieById.get(movieId)!;
    const duration = Math.max(1, movie.video?.durationSeconds ?? movie.durationSeconds ?? 1);
    const completion = clamp01(signal.positionSeconds / duration);
    addWeighted(profileVector, vectors.get(movieId), (0.25 + completion * 0.9) * recencyWeight(signal.updatedAt, now));
  }
  for (const movieId of savedIds) addWeighted(profileVector, vectors.get(movieId), 0.8);
  for (const signal of reactionById.values()) {
    if (signal.reaction === "not_for_me") continue;
    addWeighted(profileVector, vectors.get(signal.movieId), (signal.reaction === "love" ? 1.5 : 0.95) * recencyWeight(signal.updatedAt, now, 90));
  }
  const normalizedProfile = normalizeVector(profileVector);

  const maximumTrend = Math.max(1, ...movies.map((movie) => input.trendScores?.get(movie.id) ?? 0));
  const currentYear = now.getUTCFullYear();
  const scored: ScoredCandidate[] = [];
  for (const movie of movies) {
    if (rejectedIds.has(movie.id)) continue;
    const watch = watchById.get(movie.id);
    const duration = Math.max(1, movie.video?.durationSeconds ?? movie.durationSeconds ?? 1);
    const completion = watch ? clamp01(watch.positionSeconds / duration) : 0;
    const recentlyCompleted = Boolean(watch && completion >= 0.9 && recencyWeight(watch.updatedAt, now, 21) >= 0.5);
    if (recentlyCompleted) continue;

    const contentScore = cosine(normalizedProfile, vectors.get(movie.id));
    const trendScore = clamp01((input.trendScores?.get(movie.id) ?? 0) / maximumTrend);
    const freshnessScore = movie.newRelease ? 1 : movie.year >= currentYear ? 0.85 : movie.year === currentYear - 1 ? 0.55 : 0.12;
    const noveltyScore = watch ? clamp01(1 - completion) * 0.35 : savedIds.has(movie.id) ? 0.3 : 1;
    const editorialScore = clamp01(movie.match / 100);
    const score = contentScore * 0.52 + trendScore * 0.17 + freshnessScore * 0.1 + noveltyScore * 0.11 + editorialScore * 0.1;
    const candidate = { movie, score, contentScore, trendScore, noveltyScore };
    scored.push({
      ...candidate,
      reasonCodes: reasonCodesFor(candidate, { positiveReactionIds, watchedIds, savedIds }),
      isExploration: false,
    });
  }

  const remaining = scored.sort((a, b) => b.score - a.score || a.movie.id.localeCompare(b.movie.id));
  const selected: ScoredCandidate[] = [];
  while (remaining.length && selected.length < limit) {
    let bestIndex = 0;
    let bestDiversifiedScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const overlapPenalty = selected.length ? Math.max(...selected.map((item) => genreOverlap(candidate.movie, item.movie))) * 0.16 : 0;
      const primaryGenreAlreadyUsed = selected.some((item) => item.movie.genres[0] && item.movie.genres[0] === candidate.movie.genres[0]);
      const diversifiedScore = candidate.score - overlapPenalty + (primaryGenreAlreadyUsed ? 0 : 0.025);
      if (diversifiedScore > bestDiversifiedScore) {
        bestDiversifiedScore = diversifiedScore;
        bestIndex = index;
      }
    }
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  if (limit >= 5 && selected.length >= 5) {
    const topScore = selected[0]?.score ?? 0;
    const exploration = remaining.find((candidate) =>
      candidate.noveltyScore >= 0.9
      && candidate.score >= topScore * 0.42
      && (!normalizedProfile.size || candidate.contentScore >= 0.04)
      && selected.every((item) => item.movie.id !== candidate.movie.id),
    );
    if (exploration) {
      exploration.isExploration = true;
      const explorationReason: RecommendationReasonCode = "explore_something_new";
      exploration.reasonCodes = [explorationReason, ...exploration.reasonCodes].slice(0, 3);
      selected[selected.length - 1] = exploration;
    }
  }

  const modelVersion = input.modelVersion ?? HYBRID_MODEL_VERSION;
  return selected.map((candidate, index) => ({
    movieId: candidate.movie.id,
    rank: index + 1,
    score: Number(candidate.score.toFixed(6)),
    modelVersion,
    reasonCodes: candidate.reasonCodes,
    isExploration: candidate.isExploration,
  }));
}

export function rankBaselineRecommendations(input: HybridRecommendationInput): RecommendationItem[] {
  const movies = uniqueMovies(input.candidates);
  const limit = Math.min(50, Math.max(1, Math.floor(input.limit ?? 8)));
  const rejectedIds = new Set((input.reactions ?? []).filter((signal) => signal.reaction === "not_for_me").map((signal) => signal.movieId));
  const maximumTrend = Math.max(1, ...movies.map((movie) => input.trendScores?.get(movie.id) ?? 0));
  return movies
    .filter((movie) => !rejectedIds.has(movie.id))
    .map((movie) => {
      const trendScore = clamp01((input.trendScores?.get(movie.id) ?? 0) / maximumTrend);
      return { movie, score: clamp01(movie.match / 100) * 0.72 + trendScore * 0.28, trendScore };
    })
    .sort((a, b) => b.score - a.score || a.movie.id.localeCompare(b.movie.id))
    .slice(0, limit)
    .map(({ movie, score, trendScore }, index) => ({
      movieId: movie.id,
      rank: index + 1,
      score: Number(score.toFixed(6)),
      modelVersion: BASELINE_MODEL_VERSION,
      reasonCodes: [trendScore >= 0.45 ? "trending_now" : "popular_on_cinewave"],
      isExploration: false,
    }));
}

function rolloutBucket(profileKey: string) {
  let hash = 2166136261;
  for (const character of profileKey) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

export function recommendMovies(
  input: HybridRecommendationInput,
  rollout: { mode?: RecommenderMode; profileKey: string; canaryPercent?: number },
): RecommendationResult {
  const mode = rollout.mode ?? "off";
  const baseline = rankBaselineRecommendations(input);
  if (mode === "off") return { mode, servedModelVersion: BASELINE_MODEL_VERSION, items: baseline };

  const hybrid = rankHybridRecommendations(input);
  if (mode === "shadow") {
    return { mode, servedModelVersion: BASELINE_MODEL_VERSION, items: baseline, shadowItems: hybrid };
  }
  if (mode === "canary") {
    const canaryPercent = Math.min(100, Math.max(0, rollout.canaryPercent ?? 10));
    if (rolloutBucket(rollout.profileKey) >= canaryPercent) {
      return { mode, servedModelVersion: BASELINE_MODEL_VERSION, items: baseline, shadowItems: hybrid };
    }
  }
  return { mode, servedModelVersion: HYBRID_MODEL_VERSION, items: hybrid };
}

export function parseRecommenderMode(value: string | undefined): RecommenderMode {
  return value === "active" || value === "canary" || value === "shadow" ? value : "off";
}

export function recommendationReasonLabel(reasonCode: RecommendationReasonCode) {
  const labels: Record<RecommendationReasonCode, string> = {
    similar_content: "Vì hợp với nội dung bạn quan tâm",
    positive_reaction: "Dựa trên phim bạn đã thích",
    watch_completion: "Dựa trên cách bạn xem phim",
    saved_preference: "Dựa trên Tủ phim của bạn",
    trending_now: "Đang được quan tâm trên CineWave",
    new_release: "Phim mới phù hợp với bạn",
    explore_something_new: "Khám phá có kiểm soát",
    popular_on_cinewave: "Phổ biến trên CineWave",
  };
  return labels[reasonCode];
}
