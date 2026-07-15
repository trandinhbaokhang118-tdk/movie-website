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
  assert.match(layout, /CineWave — Những câu chuyện đáng nhớ/);
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

test("storefront ships required accessibility and playback affordances", async () => {
  const [css, player, header, catalog] = await Promise.all([
    read("app/globals.css"),
    read("app/components/Player.tsx"),
    read("app/components/SiteHeader.tsx"),
    read("lib/catalog.ts"),
  ]);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /--focus: #67e8f9/);
  assert.match(player, /<video/);
  assert.match(player, /aria-live="polite"/);
  assert.match(header, /aria-label="Điều hướng chính"/);
  assert.match(catalog, /BigBuckBunny\.mp4/);
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
