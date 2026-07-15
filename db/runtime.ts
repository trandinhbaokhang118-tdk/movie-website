import { env } from "cloudflare:workers";
import type { ImportedMovie } from "@/lib/tmdb/types";

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
        created_at TEXT NOT NULL,
        UNIQUE(user_id, name)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        movie_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, movie_id)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS watch_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        movie_id TEXT NOT NULL,
        position_seconds INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, movie_id)
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
      db.prepare("CREATE INDEX IF NOT EXISTS profiles_user_idx ON profiles(user_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS watchlist_user_created_idx ON watchlist(user_id, created_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS progress_user_updated_idx ON watch_progress(user_id, updated_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS imported_movies_popularity_idx ON imported_movies(popularity_x100 DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS catalog_sync_created_idx ON catalog_sync_runs(created_at DESC)"),
    ])
    .then(() => undefined)
    .catch((error) => {
      initialization = null;
      throw error;
    });
  return initialization;
}

export type Viewer = { id: string; email: string; displayName: string };

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
  return user;
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

export async function listWatchlist(userId: string) {
  await ensureDatabase();
  const result = await database()
    .prepare("SELECT movie_id AS movieId FROM watchlist WHERE user_id = ? ORDER BY created_at DESC")
    .bind(userId)
    .all<{ movieId: string }>();
  return result.results.map((row) => row.movieId);
}

export async function isInWatchlist(userId: string, movieId: string) {
  await ensureDatabase();
  return Boolean(
    await database()
      .prepare("SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?")
      .bind(userId, movieId)
      .first(),
  );
}

export async function setWatchlist(userId: string, movieId: string, enabled: boolean) {
  await ensureDatabase();
  if (enabled) {
    await database()
      .prepare("INSERT OR IGNORE INTO watchlist (id, user_id, movie_id, created_at) VALUES (?, ?, ?, ?)")
      .bind(crypto.randomUUID(), userId, movieId, new Date().toISOString())
      .run();
  } else {
    await database()
      .prepare("DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?")
      .bind(userId, movieId)
      .run();
  }
}

export async function saveProgress(userId: string, movieId: string, positionSeconds: number) {
  await ensureDatabase();
  const now = new Date().toISOString();
  await database()
    .prepare(
      `INSERT INTO watch_progress (id, user_id, movie_id, position_seconds, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, movie_id) DO UPDATE SET
         position_seconds = MAX(watch_progress.position_seconds, excluded.position_seconds),
         updated_at = excluded.updated_at`,
    )
    .bind(crypto.randomUUID(), userId, movieId, Math.max(0, Math.floor(positionSeconds)), now)
    .run();
}

export async function getAccountStats(userId: string) {
  await ensureDatabase();
  const [profiles, saved, progress] = await Promise.all([
    database().prepare("SELECT COUNT(*) AS count FROM profiles WHERE user_id = ?").bind(userId).first<{ count: number }>(),
    database().prepare("SELECT COUNT(*) AS count FROM watchlist WHERE user_id = ?").bind(userId).first<{ count: number }>(),
    database().prepare("SELECT COUNT(*) AS count FROM watch_progress WHERE user_id = ?").bind(userId).first<{ count: number }>(),
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
