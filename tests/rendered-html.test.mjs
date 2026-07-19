import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("CineWave production identity replaces every starter marker", async () => {
  const [layout, home, packageJson] = await Promise.all([
    read("app/layout.tsx"),
    read("app/page.tsx"),
    read("package.json"),
  ]);
  assert.match(layout, /CineWave — Những câu chuyện thức giấc về đêm/);
  assert.match(layout, /lang="vi"/);
  assert.match(home, /Dư Âm Ngày Mai|featuredMovie/);
  assert.match(home, /<SiteHeader \/>/);
  assert.doesNotMatch(`${layout}${home}${packageJson}`, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  await assert.rejects(access(new URL("app/_sites-preview/SkeletonPreview.tsx", root)));
});

test("all critical product routes and persistence contracts exist", async () => {
  const required = [
    "app/page.tsx",
    "app/browse/page.tsx",
    "app/search/page.tsx",
    "app/title/[id]/page.tsx",
    "app/watch/[id]/page.tsx",
    "app/my-list/page.tsx",
    "app/history/page.tsx",
    "app/profiles/page.tsx",
    "app/account/page.tsx",
    "app/admin/page.tsx",
    "app/api/watchlist/route.ts",
    "app/api/progress/route.ts",
    "db/schema.ts",
    "db/runtime.ts",
    "drizzle/0000_sloppy_blob.sql",
    ".openai/hosting.json",
  ];
  await Promise.all(required.map((path) => access(new URL(path, root))));
  const [hosting, schema, runtime] = await Promise.all([
    read(".openai/hosting.json"),
    read("db/schema.ts"),
    read("db/runtime.ts"),
  ]);
  assert.match(hosting, /"d1": "DB"/);
  for (const table of ["users", "profiles", "watchlist", "watch_progress", "audit_events", "imported_movies", "catalog_sync_runs"]) {
    assert.match(`${schema}\n${runtime}`, new RegExp(table));
  }
  assert.match(runtime, /prepare\(/);
  assert.doesNotMatch(runtime, /localStorage|sessionStorage/);
});

test("viewing activity supports resume, continue watching, and privacy deletion", async () => {
  const [home, history, player, progressRoute, runtime, header] = await Promise.all([
    read("app/page.tsx"),
    read("app/history/page.tsx"),
    read("app/components/Player.tsx"),
    read("app/api/progress/route.ts"),
    read("db/runtime.ts"),
    read("app/components/SiteHeader.tsx"),
  ]);
  assert.match(home, /Tiếp tục xem/);
  assert.match(home, /listViewingActivity/);
  assert.match(history, /ClearViewingHistory/);
  assert.match(history, /RemoveHistoryItem/);
  assert.match(player, /resumeAt/);
  assert.match(player, /visibilitychange/);
  assert.match(progressRoute, /export async function DELETE/);
  assert.match(runtime, /deleteViewingActivity/);
  assert.match(runtime, /getWatchProgress/);
  assert.match(header, /href="\/history"/);
});

test("licensed catalog data powers real legal playback and typo-tolerant search", async () => {
  const [catalog, watch, player, crawler] = await Promise.all([
    read("lib/catalog.ts"),
    read("app/watch/[id]/page.tsx"),
    read("app/components/Player.tsx"),
    read("tools/crawl_movies.py"),
  ]);
  assert.match(catalog, /licensed_catalog\.json/);
  assert.match(catalog, /normalizeSearchText/);
  assert.doesNotMatch(catalog, /\.pipe\(/);
  assert.match(watch, /movieVideo\(movie\)/);
  assert.match(player, /sourceType/);
  assert.match(crawler, /creative-commons-or-public-domain-only/);
  assert.match(crawler, /never downloads or republishes commercial movie files/i);
});

test("storefront ships required accessibility and playback affordances", async () => {
  const [css, player, header, catalog] = await Promise.all([
    read("app/globals.css"),
    read("app/components/Player.tsx"),
    read("app/components/SiteHeader.tsx"),
    read("lib/catalog.ts"),
  ]);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /--focus: #62e7e2/);
  assert.match(player, /<video/);
  assert.match(player, /aria-live="polite"/);
  assert.match(header, /aria-label="Điều hướng chính"/);
  assert.match(catalog, /BigBuckBunny\.mp4/);
});

test("production controls isolate profiles and authorize playback on the server", async () => {
  const [schema, runtime, watch, admin, adminRoute, migration] = await Promise.all([
    read("db/schema.ts"), read("db/runtime.ts"), read("app/watch/[id]/page.tsx"),
    read("app/admin/page.tsx"), read("app/api/admin/catalog-sync/route.ts"),
    read("drizzle/0002_dusty_maelstrom.sql"),
  ]);
  assert.match(schema, /profileId: text\("profile_id"\)\.notNull/);
  assert.match(schema, /subscriptions|playbackSessions|contentRights|titleReactions/);
  assert.match(runtime, /authorizePlayback/);
  assert.match(runtime, /PROFILE_RESTRICTED|SUBSCRIPTION_REQUIRED|STREAM_LIMIT_REACHED|RIGHTS_NOT_AVAILABLE/);
  assert.match(watch, /requireChatGPTUser/);
  assert.match(watch, /authorizePlayback/);
  assert.match(admin, /isAdmin/);
  assert.match(adminRoute, /status: 403/);
  assert.match(migration, /UPDATE `watch_progress` SET `profile_id`/);
});

test("Midnight Mystique experience includes plans, privacy, reactions, and Night Compass", async () => {
  const [css, plans, night, privacy, reaction, health, worker] = await Promise.all([
    read("app/globals.css"), read("app/plans/page.tsx"), read("app/night/page.tsx"),
    read("app/actions/privacy.ts"), read("app/components/ReactionBar.tsx"),
    read("app/api/health/route.ts"), read("worker/index.ts"),
  ]);
  assert.match(css, /--bg: #05040b/);
  assert.match(css, /--brand: #8b7cff/);
  assert.match(plans, /Moon|Eclipse|Constellation/);
  assert.match(plans, /chế độ sandbox/);
  assert.match(night, /Night Compass|NIGHT COMPASS/);
  assert.match(privacy, /updateAnalyticsConsent/);
  assert.match(reaction, /not_for_me|love/);
  assert.match(health, /status: "ready"/);
  assert.match(worker, /content-security-policy/);
});

test("licensed catalog importer and interaction-gated trailers are wired", async () => {
  const [client, sync, modal, home, adminRoute] = await Promise.all([
    read("lib/tmdb/client.ts"),
    read("lib/tmdb/sync.ts"),
    read("app/components/TrailerModal.tsx"),
    read("app/page.tsx"),
    read("app/api/admin/catalog-sync/route.ts"),
  ]);
  assert.match(client, /api\.themoviedb\.org\/3/);
  assert.match(client, /AbortController/);
  assert.match(sync, /saveImportedMovies/);
  assert.match(sync, /TMDB_ACCESS_TOKEN|TMDB_API_KEY/);
  assert.match(modal, /youtube-nocookie\.com\/embed/);
  assert.match(modal, /open && playable/);
  assert.match(home, /ImportedMovieRail/);
  assert.match(adminRoute, /getChatGPTUser/);
});

test("imported titles flow through browse, search, and detail routes", async () => {
  const [browse, search, detail, card, runtime] = await Promise.all([
    read("app/browse/page.tsx"),
    read("app/search/page.tsx"),
    read("app/title/[id]/page.tsx"),
    read("app/components/ImportedMovieCard.tsx"),
    read("db/runtime.ts"),
  ]);
  assert.match(browse, /listImportedMovies/);
  assert.match(search, /searchImportedMovies/);
  assert.match(detail, /findImportedMovie/);
  assert.match(detail, /MINH BẠCH BẢN QUYỀN/);
  assert.match(detail, /TrailerModal/);
  assert.match(card, /\/title\/\$\{movie\.id\}/);
  assert.match(runtime, /\^tmdb-/);
});
