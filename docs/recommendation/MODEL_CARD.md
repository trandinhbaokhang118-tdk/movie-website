# Model card — CineWave Hybrid TF-IDF v1

## Identification

- Model version: `cinewave-hybrid-tfidf-v1.0.0`
- Baseline: `cinewave-baseline-v1.0.0`
- Artifact type: deterministic in-process ranker; no serialized user data
- Identity contract: every input signal and every output item uses `movie_id`
- Default rollout: `off`; allowed states are `off`, `shadow`, `canary`, and `active`

## Intended use

The ranker orders an already-authorized, maturity-filtered CineWave catalog for the “Dự đoán hợp gu tối nay” rail. It is suitable for MVP validation and shadow/canary experiments. It is not evidence of production recommendation quality at scale.

It must not decide content rights, age eligibility, payment entitlement, or account access. Those guardrails run before ranking.

## Features and ranking

The ranker combines:

- TF-IDF similarity across title metadata, synopsis, genres, director and cast;
- explicit reactions (`like`, `love`, `not_for_me`);
- watch completion and exponentially decayed interaction recency;
- saved titles, trend score, editorial match and release freshness;
- novelty and MMR-style genre diversity;
- one bounded exploration slot when the candidate clears a relative-score threshold.

`not_for_me` is a hard exclusion. Recently completed titles are suppressed. Candidate rows are deduplicated by `movie_id`. Each result includes `model_version`, numeric score, rank, `reason_codes`, and an exploration flag.

## Offline evaluation

- Dataset: `tests/fixtures/recommendation-ground-truth.json`
- Current gate: Recall@3 >= 0.80, zero blocked-title leakage, deterministic output and unique IDs
- Test command: `npm run test:recommendation`

The current labels are a small synthetic regression set. Before a production claim, replace or extend them with consented, time-split interaction data; report Recall@K, NDCG@K, coverage, intra-list diversity, novelty, calibration and subgroup analysis. Synthetic labels prevent regressions but do not establish user value.

## Rollout and rollback

- `CINEWAVE_RECOMMENDER_MODE=off` is the kill switch and serves the baseline.
- `shadow` serves baseline and computes hybrid output without exposing it.
- `canary` deterministically assigns profiles by stable hash and rollout percentage.
- `active` serves hybrid output.
- Supabase stores the model registry, impression schema and feedback schema. The app must connect impression writes through a trusted server path before claiming a live online experiment.

Promotion requires approved offline metrics, clean migration/RLS CI, a shadow comparison window, an agreed canary KPI/guardrail dashboard, and a tested rollback to `off`.

## Limitations and risk controls

- No learned collaborative model or large-scale embedding generation job is included.
- pgvector storage is present, but no ANN index is created until recall/latency/memory benchmarks justify it.
- Popularity and recency can amplify short-term trends; diversity and exploration reduce but do not eliminate this bias.
- Sparse histories produce baseline-heavy results.
- Reason codes explain dominant feature families, not causal explanations.
- User analytics consent and retention rules must be enforced before behavioral data is used outside essential product behavior.

## Ownership

- Product owner approves KPI and experiment scope.
- ML/recommendation owner signs off model version, dataset and metrics.
- Security/data owner approves event fields, consent, retention and access.
- On-call operator owns kill-switch execution during a canary.
