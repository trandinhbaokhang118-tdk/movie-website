import { env } from "cloudflare:workers";
import type { ImportedMovie } from "@/lib/tmdb/types";
import { findMovie, maturityAllows, normalizeSearchText } from "@/lib/catalog";

let initialization: Promise<void> | null = null;

function database() {
  if (!env.DB) throw new Error("CineWave database binding is unavailable.");
  return env.DB;
}

export function ensureDatabase() {
  if (initialization) return initialization;
  const db = database();
  initialization = db
    .batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        active_profile_id TEXT,
        role TEXT NOT NULL DEFAULT 'viewer',
        analytics_consent INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_color TEXT NOT NULL,
        maturity TEXT NOT NULL DEFAULT 'T18',
        is_kids INTEGER NOT NULL DEFAULT 0,
        locale TEXT NOT NULL DEFAULT 'vi-VN',
        subtitle_language TEXT NOT NULL DEFAULT 'vi',
        autoplay_next INTEGER NOT NULL DEFAULT 1,
        autoplay_previews INTEGER NOT NULL DEFAULT 0,
        pin_hash TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, name)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        movie_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(profile_id, movie_id)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS watch_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        movie_id TEXT NOT NULL,
        position_seconds INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        UNIQUE(profile_id, movie_id)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        actor_email TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS imported_movies (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL DEFAULT 'tmdb',
        provider_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        original_title TEXT NOT NULL,
        release_year INTEGER,
        overview TEXT NOT NULL,
        poster_url TEXT,
        backdrop_url TEXT,
        vote_average_x10 INTEGER NOT NULL DEFAULT 0,
        popularity_x100 INTEGER NOT NULL DEFAULT 0,
        trailer_key TEXT,
        trailer_site TEXT,
        updated_at TEXT NOT NULL,
        UNIQUE(provider, provider_id)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS catalog_sync_runs (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        actor_email TEXT NOT NULL,
        status TEXT NOT NULL,
        imported_count INTEGER NOT NULL DEFAULT 0,
        trailer_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        created_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, plan_code TEXT NOT NULL,
        status TEXT NOT NULL, current_period_end TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'cinewave_sandbox', provider_customer_id TEXT,
        updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS playback_sessions (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, profile_id TEXT NOT NULL,
        movie_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
        expires_at TEXT NOT NULL, created_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS title_reactions (
        id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, movie_id TEXT NOT NULL,
        reaction TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(profile_id, movie_id)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS content_rights (
        id TEXT PRIMARY KEY, movie_id TEXT NOT NULL, territory TEXT NOT NULL DEFAULT 'VN',
        starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'approved',
        license_reference TEXT NOT NULL, updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS analytics_events (
        id TEXT PRIMARY KEY, profile_id TEXT, event_name TEXT NOT NULL,
        properties_json TEXT NOT NULL DEFAULT '{}', privacy_class TEXT NOT NULL DEFAULT 'essential',
        created_at TEXT NOT NULL
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS profiles_user_idx ON profiles(user_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS watchlist_user_created_idx ON watchlist(user_id, created_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS progress_user_updated_idx ON watch_progress(user_id, updated_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS imported_movies_popularity_idx ON imported_movies(popularity_x100 DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS catalog_sync_created_idx ON catalog_sync_runs(created_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions(user_id, updated_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS playback_active_idx ON playback_sessions(user_id, status, expires_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS rights_movie_idx ON content_rights(movie_id, territory, starts_at, ends_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS analytics_created_idx ON analytics_events(event_name, created_at DESC)"),
    ])
    .then(() => undefined)
    .catch((error) => {
      initialization = null;
      throw error;
    });
  return initialization;
}

export type Viewer = { id: string; email: string; displayName: string };
export type ViewerProfile = {
  id: string;
  name: string;
  avatarColor: string;
  maturity: string;
  isKids: number;
  locale: string;
  subtitleLanguage: string;
  autoplayNext: number;
  autoplayPreviews: number;
};

export async function ensureViewer(email: string, displayName: string): Promise<Viewer> {
  await ensureDatabase();
  const db = database();
  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO users (id, email, display_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at`,
    )
    .bind(userId, email.toLowerCase(), displayName, now, now)
    .run();
  const user = await db
    .prepare("SELECT id, email, display_name AS displayName FROM users WHERE email = ?")
    .bind(email.toLowerCase())
    .first<Viewer>();
  if (!user) throw new Error("Unable to provision CineWave viewer.");
  await db
    .prepare(
      `INSERT OR IGNORE INTO profiles (id, user_id, name, avatar_color, maturity, is_kids, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), user.id, "Hồ sơ chính", "#ff5a5f", "T18", 0, now)
    .run();
  const firstProfile = await db
    .prepare("SELECT id FROM profiles WHERE user_id = ? ORDER BY created_at ASC LIMIT 1")
    .bind(user.id)
    .first<{ id: string }>();
  if (firstProfile) {
    await db.prepare("UPDATE users SET active_profile_id = COALESCE(active_profile_id, ?) WHERE id = ?")
      .bind(firstProfile.id, user.id).run();
  }
  await db.prepare(
    `INSERT INTO subscriptions (id, user_id, plan_code, status, current_period_end, provider, updated_at)
     SELECT ?, ?, 'preview', 'active', ?, 'cinewave_sandbox', ?
     WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = ?)`,
  ).bind(crypto.randomUUID(), user.id, "2099-12-31T23:59:59.000Z", now, user.id).run();
  return user;
}

export async function getActiveProfile(userId: string): Promise<ViewerProfile> {
  await ensureDatabase();
  const db = database();
  let profile = await db.prepare(
    `SELECT p.id, p.name, p.avatar_color AS avatarColor, p.maturity,
      p.is_kids AS isKids, p.locale, p.subtitle_language AS subtitleLanguage,
      p.autoplay_next AS autoplayNext, p.autoplay_previews AS autoplayPreviews
     FROM profiles p JOIN users u ON u.id = p.user_id
     WHERE u.id = ? AND p.id = u.active_profile_id LIMIT 1`,
  ).bind(userId).first<ViewerProfile>();
  if (!profile) {
    profile = await db.prepare(
      `SELECT id, name, avatar_color AS avatarColor, maturity, is_kids AS isKids,
       locale, subtitle_language AS subtitleLanguage, autoplay_next AS autoplayNext,
       autoplay_previews AS autoplayPreviews FROM profiles
       WHERE user_id = ? ORDER BY created_at ASC LIMIT 1`,
    ).bind(userId).first<ViewerProfile>();
  }
  if (!profile) throw new Error("Tài khoản chưa có hồ sơ người xem.");
  return profile;
}

export async function setActiveProfile(userId: string, profileId: string) {
  await ensureDatabase();
  const owned = await database().prepare("SELECT id FROM profiles WHERE id = ? AND user_id = ?")
    .bind(profileId, userId).first();
  if (!owned) throw new Error("Hồ sơ không thuộc tài khoản này.");
  await database().prepare("UPDATE users SET active_profile_id = ?, updated_at = ? WHERE id = ?")
    .bind(profileId, new Date().toISOString(), userId).run();
}

export async function getAnalyticsConsent(userId: string) {
  await ensureDatabase();
  const row = await database().prepare("SELECT analytics_consent AS consent FROM users WHERE id = ?")
    .bind(userId).first<{ consent: number }>();
  return Boolean(row?.consent);
}

export async function updateAnalyticsConsent(userId: string, consent: boolean) {
  await ensureDatabase();
  await database().prepare("UPDATE users SET analytics_consent = ?, updated_at = ? WHERE id = ?")
    .bind(consent ? 1 : 0, new Date().toISOString(), userId).run();
}

export async function updateProfilePreferences(
  userId: string,
  profileId: string,
  preferences: { maturity: string; subtitleLanguage: string; autoplayNext: boolean; autoplayPreviews: boolean },
) {
  await ensureDatabase();
  const maturity = ["P", "K", "T13", "T16", "T18"].includes(preferences.maturity) ? preferences.maturity : "T18";
  const subtitleLanguage = ["vi", "en", "off"].includes(preferences.subtitleLanguage) ? preferences.subtitleLanguage : "vi";
  const result = await database().prepare(
    `UPDATE profiles SET maturity = ?, subtitle_language = ?, autoplay_next = ?, autoplay_previews = ?
     WHERE id = ? AND user_id = ?`,
  ).bind(maturity, subtitleLanguage, preferences.autoplayNext ? 1 : 0, preferences.autoplayPreviews ? 1 : 0, profileId, userId).run();
  if (!result.meta.changes) throw new Error("Không thể cập nhật hồ sơ này.");
}

export async function listProfiles(userId: string) {
  await ensureDatabase();
  const result = await database()
    .prepare(
      `SELECT id, name, avatar_color AS avatarColor, maturity, is_kids AS isKids
       FROM profiles WHERE user_id = ? ORDER BY created_at ASC`,
    )
    .bind(userId)
    .all<{ id: string; name: string; avatarColor: string; maturity: string; isKids: number }>();
  return result.results;
}

export async function createProfile(userId: string, name: string, isKids: boolean) {
  await ensureDatabase();
  const count = await database()
    .prepare("SELECT COUNT(*) AS count FROM profiles WHERE user_id = ?")
    .bind(userId)
    .first<{ count: number }>();
  if ((count?.count ?? 0) >= 5) throw new Error("Mỗi tài khoản có tối đa 5 hồ sơ.");
  const colors = ["#6d8cff", "#a78bfa", "#34d399", "#f59e0b"];
  await database()
    .prepare(
      `INSERT INTO profiles (id, user_id, name, avatar_color, maturity, is_kids, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      userId,
      name.slice(0, 30),
      colors[Math.floor(Math.random() * colors.length)],
      isKids ? "P" : "T18",
      isKids ? 1 : 0,
      new Date().toISOString(),
    )
    .run();
}

export async function listWatchlist(userId: string, profileId: string) {
  await ensureDatabase();
  const result = await database()
    .prepare("SELECT movie_id AS movieId FROM watchlist WHERE user_id = ? AND profile_id = ? ORDER BY created_at DESC")
    .bind(userId, profileId)
    .all<{ movieId: string }>();
  return result.results.map((row) => row.movieId);
}

export async function isInWatchlist(userId: string, profileId: string, movieId: string) {
  await ensureDatabase();
  return Boolean(
    await database()
      .prepare("SELECT id FROM watchlist WHERE user_id = ? AND profile_id = ? AND movie_id = ?")
      .bind(userId, profileId, movieId)
      .first(),
  );
}

export async function setWatchlist(userId: string, profileId: string, movieId: string, enabled: boolean) {
  await ensureDatabase();
  if (enabled) {
    await database()
      .prepare("INSERT OR IGNORE INTO watchlist (id, user_id, profile_id, movie_id, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), userId, profileId, movieId, new Date().toISOString())
      .run();
  } else {
    await database()
      .prepare("DELETE FROM watchlist WHERE user_id = ? AND profile_id = ? AND movie_id = ?")
      .bind(userId, profileId, movieId)
      .run();
  }
}

export async function saveProgress(userId: string, profileId: string, movieId: string, positionSeconds: number) {
  await ensureDatabase();
  const now = new Date().toISOString();
  await database()
    .prepare(
      `INSERT INTO watch_progress (id, user_id, profile_id, movie_id, position_seconds, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(profile_id, movie_id) DO UPDATE SET
         position_seconds = excluded.position_seconds,
         updated_at = excluded.updated_at`,
    )
    .bind(crypto.randomUUID(), userId, profileId, movieId, Math.max(0, Math.floor(positionSeconds)), now)
    .run();
}

export type ViewingActivity = {
  movieId: string;
  positionSeconds: number;
  updatedAt: string;
};

export async function getWatchProgress(userId: string, profileId: string, movieId: string) {
  await ensureDatabase();
  const progress = await database()
    .prepare(
      `SELECT movie_id AS movieId, position_seconds AS positionSeconds, updated_at AS updatedAt
       FROM watch_progress WHERE user_id = ? AND profile_id = ? AND movie_id = ? LIMIT 1`,
    )
    .bind(userId, profileId, movieId)
    .first<ViewingActivity>();
  return progress ?? null;
}

export async function listViewingActivity(userId: string, profileId: string, limit = 50) {
  await ensureDatabase();
  const result = await database()
    .prepare(
      `SELECT movie_id AS movieId, position_seconds AS positionSeconds, updated_at AS updatedAt
       FROM watch_progress WHERE user_id = ? AND profile_id = ? AND position_seconds > 0
       ORDER BY updated_at DESC LIMIT ?`,
    )
    .bind(userId, profileId, Math.min(100, Math.max(1, Math.floor(limit))))
    .all<ViewingActivity>();
  return result.results;
}

export async function deleteViewingActivity(userId: string, profileId: string, movieId?: string) {
  await ensureDatabase();
  if (movieId) {
    await database()
      .prepare("DELETE FROM watch_progress WHERE user_id = ? AND profile_id = ? AND movie_id = ?")
      .bind(userId, profileId, movieId)
      .run();
    return;
  }
  await database().prepare("DELETE FROM watch_progress WHERE user_id = ? AND profile_id = ?").bind(userId, profileId).run();
}

export async function getAccountStats(userId: string, profileId: string) {
  await ensureDatabase();
  const [profiles, saved, progress] = await Promise.all([
    database().prepare("SELECT COUNT(*) AS count FROM profiles WHERE user_id = ?").bind(userId).first<{ count: number }>(),
    database().prepare("SELECT COUNT(*) AS count FROM watchlist WHERE user_id = ? AND profile_id = ?").bind(userId, profileId).first<{ count: number }>(),
    database().prepare("SELECT COUNT(*) AS count FROM watch_progress WHERE user_id = ? AND profile_id = ?").bind(userId, profileId).first<{ count: number }>(),
  ]);
  return { profiles: profiles?.count ?? 0, saved: saved?.count ?? 0, progress: progress?.count ?? 0 };
}

export async function recordAudit(actorEmail: string, action: string, target: string) {
  await ensureDatabase();
  await database()
    .prepare("INSERT INTO audit_events (id, actor_email, action, target, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), actorEmail, action, target, new Date().toISOString())
    .run();
}

const planLimits: Record<string, number> = { preview: 1, moon: 1, eclipse: 2, constellation: 4 };

export async function getSubscription(userId: string) {
  await ensureDatabase();
  return database().prepare(
    `SELECT plan_code AS planCode, status, current_period_end AS currentPeriodEnd, provider
     FROM subscriptions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
  ).bind(userId).first<{ planCode: string; status: string; currentPeriodEnd: string; provider: string }>();
}

export async function activateSandboxPlan(userId: string, planCode: string) {
  if (!Object.hasOwn(planLimits, planCode) || planCode === "preview") throw new Error("Gói dịch vụ không hợp lệ.");
  await ensureDatabase();
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  await database().prepare("UPDATE subscriptions SET status = 'superseded' WHERE user_id = ? AND status = 'active'")
    .bind(userId).run();
  await database().prepare(
    `INSERT INTO subscriptions (id, user_id, plan_code, status, current_period_end, provider, updated_at)
     VALUES (?, ?, ?, 'active', ?, 'cinewave_sandbox', ?)`,
  ).bind(crypto.randomUUID(), userId, planCode, end.toISOString(), now.toISOString()).run();
}

export async function isAdmin(userId: string, email: string) {
  await ensureDatabase();
  const row = await database().prepare("SELECT role FROM users WHERE id = ?").bind(userId).first<{ role: string }>();
  const configured = ((env as unknown as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? "")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return row?.role === "admin" || configured.includes(email.toLowerCase());
}

export type PlaybackGrant = { sessionId: string; profile: ViewerProfile; expiresAt: string };

export async function authorizePlayback(userId: string, movieId: string): Promise<PlaybackGrant> {
  await ensureDatabase();
  const movie = findMovie(movieId);
  if (!movie) throw new Error("TITLE_NOT_FOUND");
  if (!movie.source || !movie.video) throw new Error("RIGHTS_NOT_AVAILABLE");
  const profile = await getActiveProfile(userId);
  if (!maturityAllows(movie, profile.maturity)) throw new Error("PROFILE_RESTRICTED");
  const subscription = await getSubscription(userId);
  if (!subscription || subscription.status !== "active" || Date.parse(subscription.currentPeriodEnd) <= Date.now()) {
    throw new Error("SUBSCRIPTION_REQUIRED");
  }
  const maxStreams = planLimits[subscription.planCode] ?? 1;
  const nowIso = new Date().toISOString();
  await database().prepare("UPDATE playback_sessions SET status = 'expired' WHERE status = 'active' AND expires_at <= ?")
    .bind(nowIso).run();
  await database().prepare("UPDATE playback_sessions SET status = 'replaced' WHERE user_id = ? AND profile_id = ? AND movie_id = ? AND status = 'active'")
    .bind(userId, profile.id, movieId).run();
  const rights = await database().prepare(
    `SELECT id FROM content_rights WHERE movie_id = ? AND territory IN ('VN', 'GLOBAL')
     AND status = 'approved' AND starts_at <= ? AND ends_at > ? LIMIT 1`,
  ).bind(movieId, nowIso, nowIso).first();
  if (!rights) {
    await database().prepare(
      `INSERT INTO content_rights (id, movie_id, territory, starts_at, ends_at, status, license_reference, updated_at)
       VALUES (?, ?, 'GLOBAL', '1970-01-01T00:00:00.000Z', '2099-12-31T23:59:59.000Z', 'approved', ?, ?)`,
    ).bind(crypto.randomUUID(), movieId, movie.source.licenseUrl, nowIso).run();
  }
  const active = await database().prepare(
    "SELECT COUNT(*) AS count FROM playback_sessions WHERE user_id = ? AND status = 'active' AND expires_at > ?",
  ).bind(userId, nowIso).first<{ count: number }>();
  if ((active?.count ?? 0) >= maxStreams) throw new Error("STREAM_LIMIT_REACHED");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
  const sessionId = crypto.randomUUID();
  await database().prepare(
    `INSERT INTO playback_sessions (id, user_id, profile_id, movie_id, status, expires_at, created_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`,
  ).bind(sessionId, userId, profile.id, movieId, expiresAt, now.toISOString()).run();
  return { sessionId, profile, expiresAt };
}

export async function closePlaybackSession(userId: string, sessionId: string) {
  await ensureDatabase();
  await database().prepare("UPDATE playback_sessions SET status = 'closed' WHERE id = ? AND user_id = ?")
    .bind(sessionId, userId).run();
}

export async function setReaction(profileId: string, movieId: string, reaction: "like" | "love" | "not_for_me") {
  await ensureDatabase();
  await database().prepare(
    `INSERT INTO title_reactions (id, profile_id, movie_id, reaction, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(profile_id, movie_id) DO UPDATE SET reaction = excluded.reaction, updated_at = excluded.updated_at`,
  ).bind(crypto.randomUUID(), profileId, movieId, reaction, new Date().toISOString()).run();
}

export async function recordAnalytics(profileId: string | null, eventName: string, properties: Record<string, unknown>, privacyClass = "essential") {
  await ensureDatabase();
  const safeProperties = JSON.stringify(properties).slice(0, 2000);
  await database().prepare(
    "INSERT INTO analytics_events (id, profile_id, event_name, properties_json, privacy_class, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), profileId, eventName.slice(0, 80), safeProperties, privacyClass, new Date().toISOString()).run();
}

export async function saveImportedMovies(movies: ImportedMovie[]) {
  if (movies.length === 0) return;
  await ensureDatabase();
  const statements = movies.map((movie) =>
    database()
      .prepare(
        `INSERT INTO imported_movies (
          id, provider, provider_id, title, original_title, release_year, overview,
          poster_url, backdrop_url, vote_average_x10, popularity_x100,
          trailer_key, trailer_site, updated_at
        ) VALUES (?, 'tmdb', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(provider, provider_id) DO UPDATE SET
          title = excluded.title,
          original_title = excluded.original_title,
          release_year = excluded.release_year,
          overview = excluded.overview,
          poster_url = excluded.poster_url,
          backdrop_url = excluded.backdrop_url,
          vote_average_x10 = excluded.vote_average_x10,
          popularity_x100 = excluded.popularity_x100,
          trailer_key = excluded.trailer_key,
          trailer_site = excluded.trailer_site,
          updated_at = excluded.updated_at`,
      )
      .bind(
        movie.id,
        movie.providerId,
        movie.title,
        movie.originalTitle,
        movie.year,
        movie.overview,
        movie.posterUrl,
        movie.backdropUrl,
        Math.round(movie.voteAverage * 10),
        Math.round(movie.popularity * 100),
        movie.trailerKey,
        movie.trailerSite,
        movie.updatedAt,
      ),
  );
  await database().batch(statements);
}

export async function listImportedMovies(limit = 14): Promise<ImportedMovie[]> {
  await ensureDatabase();
  const result = await database()
    .prepare(
      `SELECT id, provider_id AS providerId, title, original_title AS originalTitle,
        release_year AS year, overview, poster_url AS posterUrl, backdrop_url AS backdropUrl,
        vote_average_x10 AS voteAverageX10, popularity_x100 AS popularityX100,
        trailer_key AS trailerKey, trailer_site AS trailerSite, updated_at AS updatedAt
       FROM imported_movies ORDER BY popularity_x100 DESC LIMIT ?`,
    )
    .bind(Math.min(40, Math.max(1, Math.floor(limit))))
    .all<{
      id: string;
      providerId: number;
      title: string;
      originalTitle: string;
      year: number | null;
      overview: string;
      posterUrl: string | null;
      backdropUrl: string | null;
      voteAverageX10: number;
      popularityX100: number;
      trailerKey: string | null;
      trailerSite: string | null;
      updatedAt: string;
    }>();
  return result.results.map((movie) => ({
    ...movie,
    voteAverage: movie.voteAverageX10 / 10,
    popularity: movie.popularityX100 / 100,
  }));
}

export async function findImportedMovie(id: string): Promise<ImportedMovie | null> {
  if (!/^tmdb-\d+$/.test(id)) return null;
  await ensureDatabase();
  const movie = await database()
    .prepare(
      `SELECT id, provider_id AS providerId, title, original_title AS originalTitle,
        release_year AS year, overview, poster_url AS posterUrl, backdrop_url AS backdropUrl,
        vote_average_x10 AS voteAverageX10, popularity_x100 AS popularityX100,
        trailer_key AS trailerKey, trailer_site AS trailerSite, updated_at AS updatedAt
       FROM imported_movies WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<{
      id: string;
      providerId: number;
      title: string;
      originalTitle: string;
      year: number | null;
      overview: string;
      posterUrl: string | null;
      backdropUrl: string | null;
      voteAverageX10: number;
      popularityX100: number;
      trailerKey: string | null;
      trailerSite: string | null;
      updatedAt: string;
    }>();
  return movie
    ? { ...movie, voteAverage: movie.voteAverageX10 / 10, popularity: movie.popularityX100 / 100 }
    : null;
}

export async function searchImportedMovies(query: string, limit = 40) {
  const movies = await listImportedMovies(limit);
  const normalized = normalizeSearchText(query);
  if (!normalized) return movies;
  return movies.filter((movie) =>
    normalizeSearchText([movie.title, movie.originalTitle, movie.overview].join(" "))
      .includes(normalized),
  );
}

export async function recordCatalogSync(
  actorEmail: string,
  status: "success" | "failed",
  importedCount: number,
  trailerCount: number,
  errorMessage?: string,
) {
  await ensureDatabase();
  await database()
    .prepare(
      `INSERT INTO catalog_sync_runs
       (id, provider, actor_email, status, imported_count, trailer_count, error_message, created_at)
       VALUES (?, 'tmdb', ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      actorEmail,
      status,
      importedCount,
      trailerCount,
      errorMessage?.slice(0, 300) ?? null,
      new Date().toISOString(),
    )
    .run();
}

export async function getImportedCatalogStats() {
  await ensureDatabase();
  const [movies, trailers, lastSync] = await Promise.all([
    database().prepare("SELECT COUNT(*) AS count FROM imported_movies").first<{ count: number }>(),
    database()
      .prepare("SELECT COUNT(*) AS count FROM imported_movies WHERE trailer_key IS NOT NULL")
      .first<{ count: number }>(),
    database()
      .prepare(
        `SELECT status, imported_count AS importedCount, trailer_count AS trailerCount,
          created_at AS createdAt FROM catalog_sync_runs ORDER BY created_at DESC LIMIT 1`,
      )
      .first<{ status: string; importedCount: number; trailerCount: number; createdAt: string }>(),
  ]);
  return { movies: movies?.count ?? 0, trailers: trailers?.count ?? 0, lastSync: lastSync ?? null };
}
