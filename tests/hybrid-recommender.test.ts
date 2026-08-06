import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { Movie } from "../lib/catalog.ts";
import {
  BASELINE_MODEL_VERSION,
  HYBRID_MODEL_VERSION,
  parseRecommenderMode,
  rankHybridRecommendations,
  recommendMovies,
  type HybridRecommendationInput,
} from "../lib/recommendation/hybrid.ts";

const movie = (id: string, genres: string[], synopsis: string, options: Partial<Movie> = {}): Movie => ({
  id,
  title: id,
  year: 2025,
  duration: "100 phút",
  durationSeconds: 6000,
  maturity: "T13",
  match: 80,
  genres,
  synopsis,
  director: "CineWave Studio",
  cast: [],
  poster: `/${id}.jpg`,
  backdrop: `/${id}-backdrop.jpg`,
  accent: "#8b7cff",
  ...options,
});

const catalog: Movie[] = [
  movie("space-origin", ["Khoa học viễn tưởng", "Phiêu lưu"], "phi hành gia thám hiểm sao Hỏa và tín hiệu ngoài không gian"),
  movie("space-return", ["Khoa học viễn tưởng", "Phiêu lưu"], "phi hành gia trở lại sao Hỏa trong nhiệm vụ giải cứu ngoài không gian", { newRelease: true, match: 77 }),
  movie("romance-rain", ["Tình cảm", "Chính kịch"], "hai người trú mưa và tìm thấy tình yêu trong hiệu sách"),
  movie("romance-letters", ["Tình cảm", "Chính kịch"], "những lá thư tình bị bỏ quên kết nối hai người xa lạ", { match: 76 }),
  movie("nature-ocean", ["Tài liệu", "Thiên nhiên"], "hành trình bảo tồn đại dương và sinh vật biển"),
  movie("nature-forest", ["Tài liệu", "Thiên nhiên"], "nhà bảo tồn bảo vệ rừng và hệ sinh thái hoang dã", { match: 75 }),
  movie("crime-city", ["Tội phạm", "Neo-noir"], "điều tra bí mật tội phạm trong thành phố đêm"),
  movie("crime-night", ["Tội phạm", "Neo-noir"], "thám tử truy tìm đường dây bí mật giữa thành phố", { match: 79 }),
];

type GroundTruthCase = Omit<HybridRecommendationInput, "candidates" | "now" | "limit"> & {
  profileId: string;
  relevantMovieIds: string[];
  blockedMovieIds: string[];
};

async function groundTruthCases() {
  const raw = await readFile(new URL("./fixtures/recommendation-ground-truth.json", import.meta.url), "utf8");
  return (JSON.parse(raw) as { cases: GroundTruthCase[] }).cases;
}

test("hybrid ranker uses movie_id, deduplicates candidates, versions output, and enforces negative guardrails", () => {
  const input: HybridRecommendationInput = {
    candidates: [...catalog, catalog[1]],
    watchHistory: [{ movieId: "space-origin", positionSeconds: 5400, updatedAt: "2026-08-01T00:00:00.000Z" }],
    reactions: [
      { movieId: "space-origin", reaction: "love", updatedAt: "2026-08-01T00:00:00.000Z" },
      { movieId: "crime-city", reaction: "not_for_me", updatedAt: "2026-08-02T00:00:00.000Z" },
    ],
    trendScores: new Map([["crime-city", 100], ["space-return", 20]]),
    now: new Date("2026-08-04T00:00:00.000Z"),
    limit: 6,
  };
  const result = rankHybridRecommendations(input);
  assert.equal(result[0].movieId, "space-return");
  assert.equal(new Set(result.map((item) => item.movieId)).size, result.length);
  assert.ok(result.every((item) => item.modelVersion === HYBRID_MODEL_VERSION));
  assert.ok(result.every((item) => item.reasonCodes.length > 0));
  assert.ok(!result.some((item) => item.movieId === "crime-city"));
});

test("offline ground truth reaches the minimum Recall@3 gate", async () => {
  const cases = await groundTruthCases();
  let hits = 0;
  let labels = 0;
  for (const evaluationCase of cases) {
    const result = rankHybridRecommendations({
      candidates: catalog,
      watchHistory: evaluationCase.watchHistory,
      savedMovieIds: evaluationCase.savedMovieIds,
      reactions: evaluationCase.reactions,
      now: new Date("2026-08-04T00:00:00.000Z"),
      limit: 3,
    });
    const recommended = new Set(result.map((item) => item.movieId));
    hits += evaluationCase.relevantMovieIds.filter((movieId) => recommended.has(movieId)).length;
    labels += evaluationCase.relevantMovieIds.length;
    assert.ok(evaluationCase.blockedMovieIds.every((movieId) => !recommended.has(movieId)), `${evaluationCase.profileId} leaked a blocked movie_id`);
  }
  assert.ok(labels > 0);
  assert.ok(hits / labels >= 0.8, `Recall@3 ${(hits / labels).toFixed(3)} is below 0.8`);
});

test("off, shadow, canary, and active modes provide a deterministic kill switch", () => {
  const input: HybridRecommendationInput = { candidates: catalog, limit: 4 };
  const off = recommendMovies(input, { mode: "off", profileKey: "profile-a" });
  const shadow = recommendMovies(input, { mode: "shadow", profileKey: "profile-a" });
  const active = recommendMovies(input, { mode: "active", profileKey: "profile-a" });
  assert.equal(off.servedModelVersion, BASELINE_MODEL_VERSION);
  assert.equal(shadow.servedModelVersion, BASELINE_MODEL_VERSION);
  assert.ok(shadow.shadowItems?.every((item) => item.modelVersion === HYBRID_MODEL_VERSION));
  assert.equal(active.servedModelVersion, HYBRID_MODEL_VERSION);
  assert.deepEqual(
    recommendMovies(input, { mode: "canary", profileKey: "profile-a", canaryPercent: 100 }).items,
    active.items,
  );
  assert.equal(parseRecommenderMode("unexpected"), "off");
});
