import { env } from "cloudflare:workers";

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
      db.prepare("CREATE INDEX IF NOT EXISTS profiles_user_idx ON profiles(user_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS watchlist_user_created_idx ON watchlist(user_id, created_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS progress_user_updated_idx ON watch_progress(user_id, updated_at DESC)"),
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
