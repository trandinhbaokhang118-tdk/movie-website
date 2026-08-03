import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const readBinary = (path) => readFile(new URL(path, root));

test("CineWave production identity replaces every starter marker", async () => {
  const [layout, home, packageJson] = await Promise.all([
    read("app/layout.tsx"),
    read("app/page.tsx"),
    read("package.json"),
  ]);
  assert.match(layout, /CineWave — Những câu chuyện thức giấc về đêm/);
  assert.match(layout, /lang=(?:"vi"|\{locale\})/);
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
    "app/login/page.tsx",
    "app/register/page.tsx",
    "app/auth.ts",
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
  for (const table of ["users", "profiles", "watchlist", "watch_progress", "audit_events", "imported_movies", "catalog_sync_runs", "auth_sessions"]) {
    assert.match(`${schema}\n${runtime}`, new RegExp(table));
  }
  assert.match(runtime, /prepare\(/);
  assert.doesNotMatch(runtime, /localStorage|sessionStorage/);
});

test("viewing activity supports resume, continue watching, and privacy deletion", async () => {
  const [home, history, player, progressRoute, runtime, headerNav] = await Promise.all([
    read("app/page.tsx"),
    read("app/history/page.tsx"),
    read("app/components/Player.tsx"),
    read("app/api/progress/route.ts"),
    read("db/runtime.ts"),
    read("app/components/HeaderNav.tsx"),
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
  assert.match(headerNav, /href: "\/history"/);
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

test("search, 3D preview, and expanded playable catalog keep their interaction contracts", async () => {
  const [header, preview, depth, css, catalogSource] = await Promise.all([
    read("app/components/HeaderSearch.tsx"),
    read("app/components/MoviePreviewStage.tsx"),
    read("app/components/CinematicDepth.tsx"),
    read("app/globals.css"),
    read("data/licensed_catalog.json"),
  ]);
  assert.match(header, /header-search-submit/);
  assert.match(css, /\.header-search-form[^}]*border: 1px solid transparent/);
  assert.match(css, /\.header-search-submit[^}]*border: 0[^}]*background: transparent/);
  assert.match(css, /\.header-search-submit[^}]*position: absolute[^}]*right: 0/);
  assert.doesNotMatch(css, /\.header-search-submit:active[^}]*transform/);
  assert.match(preview, /waitForMetadata/);
  assert.match(preview, /poster=\{backdrop\}/);
  assert.match(depth, /window\.addEventListener\("pointermove"/);
  assert.match(css, /\.cinematic-depth[^}]*pointer-events: none/);

  const catalog = JSON.parse(catalogSource);
  assert.equal(catalog.items.length, 11);
  assert.ok(catalog.items.every((movie) => movie.video?.src && movie.poster && movie.backdrop));
  for (const title of ["Spring", "Wing It!", "Hero", "Caminandes 2: Gran Dillama", "Caminandes 3: Llamigos"]) {
    assert.ok(catalog.items.some((movie) => movie.title === title), `${title} should be playable`);
  }
});

test("language selection is global, profile-aware, and available on landing and settings", async () => {
  const [layout, landing, account, switcher, translator, localeAction, profileAction, runtime, config] = await Promise.all([
    read("app/layout.tsx"), read("app/components/LandingPage.tsx"), read("app/account/page.tsx"),
    read("app/components/LocaleSwitcher.tsx"), read("app/components/GlobalTranslator.tsx"),
    read("app/actions/locale.ts"), read("app/actions/profiles.ts"), read("db/runtime.ts"), read("app/i18n/config.ts"),
  ]);
  assert.match(layout, /GlobalTranslator/);
  assert.match(landing, /LocaleSwitcher locale=\{locale\} compact/);
  assert.match(account, /language-panel/);
  assert.match(switcher, /updateLocaleAction/);
  assert.match(translator, /MutationObserver/);
  assert.match(localeAction, /LOCALE_COOKIE/);
  assert.match(profileAction, /selectedProfile\.locale/);
  assert.match(runtime, /updateProfileLocale/);
  for (const locale of ["vi-VN", "en-US", "fr-FR", "ja-JP", "ko-KR", "zh-CN"]) assert.match(config, new RegExp(locale));
});

test("Sprite Fright ships as a verified local MP4 with a remote fallback", async () => {
  const [catalog, video] = await Promise.all([
    read("data/licensed_catalog.json"), readBinary("public/media/sprite-fright-2021.mp4"),
  ]);
  assert.equal(video.byteLength, 60_602_625);
  assert.equal(createHash("sha1").update(video).digest("hex"), "b1ff951fbf2af55ee8d6ef0ed4879219be230e6e");
  assert.match(catalog, /"src": "\/media\/sprite-fright-2021\.mp4"/);
  assert.match(catalog, /"fallbackSrc": "https:\/\/archive\.org\/download\/sprite-fright-2021/);
});

test("storefront ships required accessibility and playback affordances", async () => {
  const [css, player, headerNav, catalog] = await Promise.all([
    read("app/globals.css"),
    read("app/components/Player.tsx"),
    read("app/components/HeaderNav.tsx"),
    read("lib/catalog.ts"),
  ]);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /--focus: #62e7e2/);
  assert.match(player, /<video/);
  assert.match(player, /aria-live="polite"/);
  assert.match(headerNav, /aria-label="Điều hướng chính"/);
  assert.match(catalog, /BigBuckBunny\.mp4/);
});

test("production controls isolate profiles and authorize playback on the server", async () => {
  const [schema, runtime, watch, adminLayout, adminAccess, adminRoute, migration] = await Promise.all([
    read("db/schema.ts"), read("db/runtime.ts"), read("app/watch/[id]/page.tsx"),
    read("app/admin/layout.tsx"), read("app/admin/access.ts"), read("app/api/admin/catalog-sync/route.ts"),
    read("drizzle/0002_dusty_maelstrom.sql"),
  ]);
  assert.match(schema, /profileId: text\("profile_id"\)\.notNull/);
  assert.match(schema, /subscriptions|playbackSessions|contentRights|titleReactions/);
  assert.match(runtime, /authorizePlayback/);
  assert.match(runtime, /PROFILE_RESTRICTED|SUBSCRIPTION_REQUIRED|STREAM_LIMIT_REACHED|RIGHTS_NOT_AVAILABLE/);
  assert.match(watch, /requireUser/);
  assert.match(watch, /authorizePlayback/);
  assert.match(`${adminLayout}\n${adminAccess}`, /getAdminRole/);
  assert.match(`${adminLayout}\n${adminAccess}`, /adminRoleCan|requireAdminCapability/);
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
  assert.match(plans, /membershipPlans/);
  assert.match(plans, /Tạo QR thanh toán/);
  assert.match(night, /Night Compass|NIGHT COMPASS/);
  assert.match(privacy, /updateAnalyticsConsent/);
  assert.match(reaction, /not_for_me|love/);
  assert.match(health, /status: "ready"/);
  assert.match(worker, /content-security-policy/);
  assert.match(worker, /env\.ASSETS \? env\.ASSETS\.fetch\(assetRequest\) : fetch\(assetRequest\)/);
  assert.match(worker, /\.\.\.\(images \? \{/);
});

test("VietQR invoices use server-side prices and authenticated idempotent SePay settlement", async () => {
  const [schema, runtime, billing, plans, checkout, config, webhook, worker] = await Promise.all([
    read("db/schema.ts"), read("db/runtime.ts"), read("app/actions/billing.ts"),
    read("app/plans/page.tsx"), read("app/checkout/[id]/page.tsx"), read("app/payment-config.ts"),
    read("app/api/webhooks/sepay/route.ts"), read("worker/index.ts"),
  ]);
  for (const table of ["payment_invoices", "payment_events"]) assert.match(`${schema}\n${runtime}`, new RegExp(table));
  assert.match(schema, /payment_events_provider_tx_uq/);
  assert.match(billing, /findMembershipPlan/);
  assert.doesNotMatch(billing, /formData\.get\("amount/);
  assert.match(plans, /createPaymentInvoiceAction/);
  assert.match(checkout, /vietQrImageUrl/);
  assert.match(config, /img\.vietqr\.io\/image/);
  assert.match(config, /compact2\.png/);
  assert.match(webhook, /Apikey/);
  assert.match(webhook, /constantTimeEqual/);
  assert.match(runtime, /invoice\.amountVnd !== input\.amountVnd/);
  assert.match(runtime, /provider_transaction_id/);
  assert.match(worker, /img\.vietqr\.io/);
});

test("payment countdown is protected from DOM translation overwrites", async () => {
  const paymentClient = await read("app/components/PaymentInvoiceClient.tsx");
  assert.match(paymentClient, /setInterval\(\(\) => setRemaining\(formatRemaining\(expiresAt\)\), 1_000\)/);
  assert.match(paymentClient, /<span data-no-translate suppressHydrationWarning>/);
});

test("licensed titles expose a complete rights transparency record", async () => {
  const [component, detail, catalog] = await Promise.all([
    read("app/components/RightsTransparency.tsx"),
    read("app/title/[id]/page.tsx"),
    read("data/licensed_catalog.json"),
  ]);
  for (const field of ["Tác giả/chủ sở hữu", "Nguồn gốc", "Giấy phép", "Bằng chứng tại ngày nhập", "Phạm vi lãnh thổ", "Quyền sử dụng thương mại", "Checksum file video", "TASL"]) {
    assert.match(component, new RegExp(field));
  }
  assert.match(detail, /RightsTransparency/);
  assert.match(catalog, /"checksumAlgorithm": "SHA-1"/);
  assert.match(catalog, /"creditLine"/);
  assert.match(catalog, /"evidenceCapturedAt"/);
});

test("local auth uses hashed database sessions and server-validated Cloudflare Turnstile", async () => {
  const [auth, actions, login, register, experience, turnstile, worker, runtime, sourceFiles] = await Promise.all([
    read("app/auth.ts"), read("app/actions/auth.ts"), read("app/login/page.tsx"),
    read("app/register/page.tsx"), read("app/components/AuthExperience.tsx"),
    read("app/turnstile.ts"), read("worker/index.ts"), read("db/runtime.ts"),
    Promise.all(["app/page.tsx", "app/components/SiteHeader.tsx", "README.md"].map(read)).then((items) => items.join("\n")),
  ]);
  assert.match(auth, /PBKDF2/);
  assert.match(auth, /httpOnly: true/);
  assert.match(auth, /SESSION_COOKIE/);
  assert.match(actions, /authenticateWithPassword|registerWithPassword/);
  assert.match(`${login}${register}${experience}`, /email|Email/);
  assert.match(actions, /verifyTurnstile/);
  assert.match(turnstile, /turnstile\/v0\/siteverify|cf-turnstile-response/);
  assert.match(worker, /challenges\.cloudflare\.com/);
  assert.match(runtime, /auth_sessions/);
  assert.match(runtime, /user@cinewave\.local/);
  assert.match(runtime, /ensureLocalDemoAccounts\(true\)/);
  assert.doesNotMatch(`${auth}${actions}${sourceFiles}`, /signin-with-chatgpt|getChatGPTUser|chatgpt\.site/i);
});

test("Vietnamese authentication copy remains valid UTF-8", async () => {
  const authExperience = await read("app/components/AuthExperience.tsx");
  assert.match(authExperience, /Đăng nhập/);
  assert.match(authExperience, /Mật khẩu/);
  assert.match(authExperience, /Cloudflare đang xác minh kết nối an toàn/);
  assert.doesNotMatch(authExperience, /Ã|Ä|áº|á»|â†|ï¼/);
});

test("public landing page includes cinematic discovery, benefits, FAQ, and signup CTAs", async () => {
  const [home, landing, css] = await Promise.all([
    read("app/page.tsx"), read("app/components/LandingPage.tsx"), read("app/globals.css"),
  ]);
  assert.match(home, /<LandingPage/);
  for (const section of ["landing-hero", "ranking-row", "benefit-grid", "faq-list", "landing-final-cta"]) {
    assert.match(`${landing}\n${css}`, new RegExp(section));
  }
  assert.match(landing, /Creative Commons|phim mở|nguồn lậu/i);
  assert.doesNotMatch(landing, /Netflix|không giới hạn|tải ngoại tuyến/i);
});

test("account switching prevents misleading admin 404 responses", async () => {
  const [login, experience, actions, adminLayout] = await Promise.all([
    read("app/login/page.tsx"), read("app/components/AuthExperience.tsx"), read("app/actions/auth.ts"), read("app/admin/layout.tsx"),
  ]);
  assert.match(`${login}${experience}`, /currentEmail|chuyển tài khoản/i);
  assert.match(actions, /await endSession\(\);\s*await startSession/);
  assert.match(adminLayout, /if \(!role\) redirect\("\/account"\)/);
  assert.doesNotMatch(adminLayout, /notFound\(/);
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
  assert.match(adminRoute, /getCurrentUser/);
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

test("admin MVP persists content workflow, account locks, and audit visibility", async () => {
  const [adminPages, actions, runtime, schema, browse, search, detail, watch] = await Promise.all([
    Promise.all(["app/admin/page.tsx", "app/admin/content/page.tsx", "app/admin/accounts/page.tsx", "app/admin/configuration/page.tsx", "app/admin/permissions/page.tsx"].map(read)).then((items) => items.join("\n")), read("app/actions/admin.ts"), read("db/runtime.ts"),
    read("db/schema.ts"), read("app/browse/page.tsx"), read("app/search/page.tsx"),
    read("app/title/[id]/page.tsx"), read("app/watch/[id]/page.tsx"),
  ]);
  assert.match(`${schema}\n${runtime}`, /managed_titles|managedTitles/);
  for (const action of ["createManagedTitle", "updateManagedTitle", "setManagedTitleStatus", "deleteManagedTitle", "setAccountStatus", "listAuditEvents"]) {
    assert.match(`${actions}\n${runtime}`, new RegExp(action));
  }
  assert.match(adminPages, /CONTENT STUDIO/);
  assert.match(adminPages, /USER OPERATIONS/);
  assert.match(adminPages, /Cấu hình & nhật ký/);
  assert.match(actions, /confirmation/);
  assert.match(`${actions}\n${runtime}\n${adminPages}`, /setAccountRole|account\.role_changed/);
  assert.match(runtime, /DELETE FROM auth_sessions WHERE user_id/);
  assert.match(runtime, /PUBLISH_REQUIRES_MEDIA_AND_LICENSE/);
  assert.match(`${browse}\n${search}\n${detail}\n${watch}`, /ManagedTitle|managed|findManagedTitle/);
});

test("production hardening includes rate limits, same-origin mutations, secure cookies, R2 media, HLS and user data controls", async () => {
  const [auth, authActions, requestSecurity, runtime, schema, worker, player, account, exportRoute, payment, hosting] = await Promise.all([
    read("app/auth.ts"), read("app/actions/auth.ts"), read("app/lib/request-security.ts"), read("db/runtime.ts"), read("db/schema.ts"),
    read("worker/index.ts"), read("app/components/Player.tsx"), read("app/account/page.tsx"), read("app/api/account/export/route.ts"),
    read("app/payment-config.ts"), read(".openai/hosting.json"),
  ]);
  assert.match(auth, /shouldUseSecureCookies/);
  assert.match(`${authActions}\n${runtime}\n${schema}`, /consumeRateLimit|rate_limits|rateLimits/);
  assert.match(requestSecurity, /isTrustedMutation|PAYLOAD_TOO_LARGE/);
  assert.match(worker, /strict-transport-security|form-action 'self'|env\.MEDIA\.get/);
  assert.match(`${runtime}\n${schema}\n${hosting}`, /media_assets|mediaAssets|"r2": "MEDIA"/);
  assert.match(player, /hls\.js|Hls\.isSupported|<track/);
  assert.match(`${account}\n${exportRoute}\n${authActions}`, /Tải dữ liệu của tôi|getUserDataExport|anonymizeViewerAccount/);
  assert.doesNotMatch(payment, /36345057|TRAN TAN PHONG/);
});

test("Playwright E2E covers public, viewer, playback, and admin workflows safely", async () => {
  const [pkg, config, publicSpec, viewerSpec, adminSpec, resetRoute, runtime] = await Promise.all([
    read("package.json"), read("playwright.config.ts"), read("e2e/public.spec.ts"),
    read("e2e/viewer.spec.ts"), read("e2e/admin.spec.ts"),
    read("app/api/e2e/reset/route.ts"), read("db/runtime.ts"),
  ]);
  assert.match(pkg, /"test:e2e": "playwright test"/);
  assert.match(config, /workers: 1|CINEWAVE_E2E/);
  assert.match(publicSpec, /landing|mật khẩu sai/);
  assert.match(viewerSpec, /api\/progress|Sprite Fright|Control Room/);
  assert.match(adminSpec, /Tạo bản nháp|Xuất bản|Xóa vĩnh viễn|account\.locked/);
  assert.match(`${resetRoute}\n${runtime}`, /CINEWAVE_E2E|resetE2EState|E2E_DISABLED/);
});

test("trend ranking refreshes near-realtime from authenticated interaction signals", async () => {
  const [trendUi, trendRoute, quickSave, reactions, runtime] = await Promise.all([
    read("app/components/TrendDiscovery.tsx"), read("app/api/trends/route.ts"),
    read("app/components/QuickSaveButton.tsx"), read("app/components/ReactionBar.tsx"),
    read("db/runtime.ts"),
  ]);
  assert.match(trendUi, /setInterval[\s\S]*10_000/);
  assert.match(trendUi, /visibilitychange|cinewave:trend-signal/);
  assert.match(trendUi, /LIVE · 10 giây|Mất kết nối/);
  assert.match(trendRoute, /cache-control[\s\S]*no-store/);
  assert.match(trendRoute, /filterMoviesForMaturity/);
  assert.match(`${quickSave}\n${reactions}`, /CustomEvent\("cinewave:trend-signal"/);
  assert.match(runtime, /search\.submitted|playback\.started|title_reactions|watchlist/);
});
