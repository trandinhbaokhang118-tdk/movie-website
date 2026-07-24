import { env } from "cloudflare:workers";
import type { ImportedMovie } from "@/lib/tmdb/types";
import { findMovie, maturityAllows, movies, normalizeSearchText } from "@/lib/catalog";

let initialization: Promise<void> | null = null;
const RUNTIME_SCHEMA_VERSION = "7";

function database() {
  if (!env.DB) throw new Error("CineWave database binding is unavailable.");
  return env.DB;
}

async function runtimeSchemaIsCurrent(db: D1Database) {
  try {
    const row = await db.prepare(
      "SELECT value FROM runtime_metadata WHERE key = 'schema_version' LIMIT 1",
    ).first<{ value: string }>();
    return row?.value === RUNTIME_SCHEMA_VERSION;
  } catch {
    return false;
  }
}

const localDemoAccounts = [
  {
    id: "local-demo-user",
    email: "user@cinewave.local",
    displayName: "CineWave User",
    role: "viewer",
    passwordSalt: "8f5f98c15e6696816d0dedb79f4be086",
    passwordHash: "be406b229d5ff5cd077b39b6076aa19c74a8a1e6fa9daf971b1e8e77aec14a89",
  },
  {
    id: "local-demo-admin",
    email: "admin@cinewave.local",
    displayName: "CineWave Admin",
    role: "admin",
    passwordSalt: "63deb0252fbc9483ce78e0dcf8f235be",
    passwordHash: "2374ab5c3ccd1250d08103a191a135dce7976c638847af3cc8f1fed4745be2fe",
  },
] as const;

async function ensureLocalDemoAccounts(force = false) {
  const config = env as unknown as { CINEWAVE_LOCAL_AUTH?: string };
  if (!force && config.CINEWAVE_LOCAL_AUTH !== "1") return;
  const db = database();
  const now = new Date().toISOString();
  await db.batch(localDemoAccounts.map((account) => db.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
     ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name,
       password_hash = excluded.password_hash, password_salt = excluded.password_salt,
       role = excluded.role, status = 'active', updated_at = excluded.updated_at`,
  ).bind(account.id, account.email, account.displayName, account.passwordHash,
    account.passwordSalt, account.role, now, now)));
}

export function ensureDatabase() {
  if (initialization) return initialization;
  const db = database();
  initialization = (async () => {
    if (await runtimeSchemaIsCurrent(db)) {
      await ensureLocalDemoAccounts();
      return;
    }
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS runtime_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        password_hash TEXT,
        password_salt TEXT,
        active_profile_id TEXT,
        role TEXT NOT NULL DEFAULT 'viewer',
        status TEXT NOT NULL DEFAULT 'active',
        analytics_consent INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_color TEXT NOT NULL,
        avatar_url TEXT,
        theme TEXT NOT NULL DEFAULT 'cinewave',
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
      db.prepare(`CREATE TABLE IF NOT EXISTS managed_titles (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, original_title TEXT NOT NULL,
        release_year INTEGER NOT NULL, content_type TEXT NOT NULL DEFAULT 'movie',
        genres TEXT NOT NULL, maturity TEXT NOT NULL DEFAULT 'T13', duration TEXT NOT NULL,
        synopsis TEXT NOT NULL, poster_url TEXT, video_url TEXT,
        license_name TEXT NOT NULL, license_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft', created_by TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT
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
      db.prepare(`CREATE TABLE IF NOT EXISTS payment_invoices (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, plan_code TEXT NOT NULL,
        amount_vnd INTEGER NOT NULL, transfer_content TEXT NOT NULL UNIQUE,
        provider TEXT NOT NULL DEFAULT 'sepay', status TEXT NOT NULL DEFAULT 'pending',
        provider_transaction_id TEXT, reference_code TEXT, created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL, paid_at TEXT
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS payment_events (
        id TEXT PRIMARY KEY, provider TEXT NOT NULL, provider_transaction_id TEXT NOT NULL,
        invoice_id TEXT, amount_vnd INTEGER NOT NULL, payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL, UNIQUE(provider, provider_transaction_id)
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
      db.prepare(`CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL, created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL
        , user_agent TEXT, ip_address TEXT
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS profiles_user_idx ON profiles(user_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS watchlist_user_created_idx ON watchlist(user_id, created_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS watchlist_profile_created_idx ON watchlist(user_id, profile_id, created_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS progress_user_updated_idx ON watch_progress(user_id, updated_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS progress_profile_updated_idx ON watch_progress(user_id, profile_id, updated_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS imported_movies_popularity_idx ON imported_movies(popularity_x100 DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS catalog_sync_created_idx ON catalog_sync_runs(created_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions(user_id, updated_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS payment_invoices_user_idx ON payment_invoices(user_id, created_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS payment_invoices_status_idx ON payment_invoices(status, expires_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS playback_active_idx ON playback_sessions(user_id, status, expires_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS playback_created_movie_idx ON playback_sessions(created_at DESC, movie_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS watchlist_created_movie_idx ON watchlist(created_at DESC, movie_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS reactions_updated_movie_idx ON title_reactions(updated_at DESC, movie_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS rights_movie_idx ON content_rights(movie_id, territory, starts_at, ends_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS analytics_created_idx ON analytics_events(event_name, created_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id, expires_at DESC)"),
      db.prepare("CREATE INDEX IF NOT EXISTS managed_titles_status_idx ON managed_titles(status, updated_at DESC)"),
    ]);
      const ensureColumn = async (table: string, column: string, definition: string) => {
        const columns = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
        if (!columns.results.some((item) => item.name === column)) {
          await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
        }
      };
      await ensureColumn("users", "active_profile_id", "TEXT");
      await ensureColumn("users", "role", "TEXT NOT NULL DEFAULT 'viewer'");
      await ensureColumn("users", "status", "TEXT NOT NULL DEFAULT 'active'");
      await ensureColumn("users", "analytics_consent", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn("users", "password_hash", "TEXT");
      await ensureColumn("users", "password_salt", "TEXT");
      await ensureColumn("profiles", "maturity", "TEXT NOT NULL DEFAULT 'T18'");
      await ensureColumn("profiles", "is_kids", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn("profiles", "locale", "TEXT NOT NULL DEFAULT 'vi-VN'");
      await ensureColumn("profiles", "subtitle_language", "TEXT NOT NULL DEFAULT 'vi'");
      await ensureColumn("profiles", "autoplay_next", "INTEGER NOT NULL DEFAULT 1");
      await ensureColumn("profiles", "autoplay_previews", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn("profiles", "pin_hash", "TEXT");
      await ensureColumn("profiles", "avatar_url", "TEXT");
      await ensureColumn("profiles", "theme", "TEXT NOT NULL DEFAULT 'cinewave'");
      await ensureColumn("auth_sessions", "user_agent", "TEXT");
      await ensureColumn("auth_sessions", "ip_address", "TEXT");
      await ensureColumn("watchlist", "profile_id", "TEXT");
      await ensureColumn("watch_progress", "profile_id", "TEXT");
      await ensureLocalDemoAccounts();
      const now = new Date().toISOString();
      await db.prepare(
        `INSERT INTO runtime_metadata (key, value, updated_at) VALUES ('schema_version', ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      ).bind(RUNTIME_SCHEMA_VERSION, now).run();
  })().catch((error) => {
      initialization = null;
      throw error;
    });
  return initialization;
}

export type Viewer = { id: string; email: string; displayName: string };
export type ViewerCredentials = Viewer & { passwordHash: string | null; passwordSalt: string | null; status: string };
export type ViewerProfile = {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
  theme: string;
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

export async function registerViewer(
  email: string,
  displayName: string,
  passwordHash: string,
  passwordSalt: string,
): Promise<Viewer> {
  await ensureDatabase();
  const db = database();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.prepare(
    "SELECT id, password_hash AS passwordHash FROM users WHERE email = ? LIMIT 1",
  ).bind(normalizedEmail).first<{ id: string; passwordHash: string | null }>();
  if (existing?.passwordHash) throw new Error("EMAIL_ALREADY_REGISTERED");

  const now = new Date().toISOString();
  if (existing) {
    await db.prepare(
      "UPDATE users SET display_name = ?, password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?",
    ).bind(displayName, passwordHash, passwordSalt, now, existing.id).run();
  } else {
    await db.prepare(
      `INSERT INTO users (id, email, display_name, password_hash, password_salt, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), normalizedEmail, displayName, passwordHash, passwordSalt, now, now).run();
  }
  return ensureViewer(normalizedEmail, displayName);
}

export async function findViewerCredentials(email: string): Promise<ViewerCredentials | null> {
  await ensureDatabase();
  return database().prepare(
    `SELECT id, email, display_name AS displayName, password_hash AS passwordHash,
     password_salt AS passwordSalt, status FROM users WHERE email = ? LIMIT 1`,
  ).bind(email.trim().toLowerCase()).first<ViewerCredentials>();
}

export async function createAuthSession(userId: string, tokenHash: string, expiresAt: string, metadata?: { userAgent?: string; ipAddress?: string }) {
  await ensureDatabase();
  const now = new Date().toISOString();
  await database().prepare(
    `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(crypto.randomUUID(), userId, tokenHash, expiresAt, now, now, metadata?.userAgent?.slice(0, 500) ?? null, metadata?.ipAddress?.slice(0, 80) ?? null).run();
}

export async function findViewerBySession(tokenHash: string): Promise<Viewer | null> {
  await ensureDatabase();
  const db = database();
  const now = new Date().toISOString();
  const session = await db.prepare(
    `SELECT u.id, u.email, u.display_name AS displayName, s.last_seen_at AS lastSeenAt
     FROM auth_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active' LIMIT 1`,
  ).bind(tokenHash, now).first<Viewer & { lastSeenAt: string }>();
  if (!session) return null;
  const refreshBefore = Date.now() - 5 * 60 * 1000;
  if (Date.parse(session.lastSeenAt) < refreshBefore) {
    await db.prepare("UPDATE auth_sessions SET last_seen_at = ? WHERE token_hash = ?")
      .bind(now, tokenHash).run();
  }
  return { id: session.id, email: session.email, displayName: session.displayName };
}

export async function deleteAuthSession(tokenHash: string) {
  await ensureDatabase();
  await database().prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).run();
}

export async function deleteOtherAuthSessions(userId: string, currentTokenHash: string) {
  await ensureDatabase();
  await database().prepare("DELETE FROM auth_sessions WHERE user_id = ? AND token_hash <> ?")
    .bind(userId, currentTokenHash).run();
}

export type AuthSessionInfo = { id: string; tokenHash: string; createdAt: string; lastSeenAt: string; expiresAt: string; userAgent: string | null; ipAddress: string | null };

export async function listAuthSessions(userId: string): Promise<AuthSessionInfo[]> {
  await ensureDatabase();
  const db = database();
  const now = new Date().toISOString();
  await db.prepare("DELETE FROM auth_sessions WHERE user_id = ? AND expires_at <= ?").bind(userId, now).run();
  const result = await db.prepare(`SELECT id, token_hash AS tokenHash, created_at AS createdAt,
    last_seen_at AS lastSeenAt, expires_at AS expiresAt, user_agent AS userAgent, ip_address AS ipAddress
    FROM auth_sessions WHERE user_id = ? ORDER BY last_seen_at DESC`).bind(userId).all<AuthSessionInfo>();
  return result.results;
}

export async function deleteAuthSessionById(userId: string, sessionId: string) {
  await ensureDatabase();
  await database().prepare("DELETE FROM auth_sessions WHERE user_id = ? AND id = ?").bind(userId, sessionId).run();
}

export async function countActiveAuthSessions(userId: string) {
  await ensureDatabase();
  const row = await database().prepare(
    "SELECT COUNT(*) AS count FROM auth_sessions WHERE user_id = ? AND expires_at > ?",
  ).bind(userId, new Date().toISOString()).first<{ count: number }>();
  return row?.count ?? 0;
}

export async function getActiveProfile(userId: string): Promise<ViewerProfile> {
  await ensureDatabase();
  const db = database();
  let shouldPersistActiveProfile = false;
  let profile = await db.prepare(
    `SELECT p.id, p.name, p.avatar_color AS avatarColor, p.avatar_url AS avatarUrl, p.theme, p.maturity,
      p.is_kids AS isKids, p.locale, p.subtitle_language AS subtitleLanguage,
      p.autoplay_next AS autoplayNext, p.autoplay_previews AS autoplayPreviews
     FROM profiles p JOIN users u ON u.id = p.user_id
     WHERE u.id = ? AND p.id = u.active_profile_id LIMIT 1`,
  ).bind(userId).first<ViewerProfile>();
  if (!profile) {
    shouldPersistActiveProfile = true;
    profile = await db.prepare(
      `SELECT id, name, avatar_color AS avatarColor, avatar_url AS avatarUrl, theme, maturity, is_kids AS isKids,
       locale, subtitle_language AS subtitleLanguage, autoplay_next AS autoplayNext,
       autoplay_previews AS autoplayPreviews FROM profiles
       WHERE user_id = ? ORDER BY created_at ASC LIMIT 1`,
    ).bind(userId).first<ViewerProfile>();
  }
  if (!profile) {
    shouldPersistActiveProfile = true;
    await db.prepare(
      `INSERT OR IGNORE INTO profiles (id, user_id, name, avatar_color, maturity, is_kids, created_at)
       SELECT ?, id, 'Hồ sơ chính', '#ff5a5f', 'T18', 0, ? FROM users WHERE id = ?`,
    ).bind(crypto.randomUUID(), new Date().toISOString(), userId).run();
    profile = await db.prepare(
      `SELECT id, name, avatar_color AS avatarColor, avatar_url AS avatarUrl, theme, maturity, is_kids AS isKids,
       locale, subtitle_language AS subtitleLanguage, autoplay_next AS autoplayNext,
       autoplay_previews AS autoplayPreviews FROM profiles
       WHERE user_id = ? ORDER BY created_at ASC LIMIT 1`,
    ).bind(userId).first<ViewerProfile>();
  }
  if (!profile) throw new Error("Tài khoản chưa có hồ sơ người xem.");
  if (shouldPersistActiveProfile) {
    await db.prepare("UPDATE users SET active_profile_id = ? WHERE id = ?")
      .bind(profile.id, userId).run();
  }
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

export async function updateProfileLocale(userId: string, profileId: string, locale: string) {
  await ensureDatabase();
  const result = await database().prepare("UPDATE profiles SET locale = ? WHERE id = ? AND user_id = ?")
    .bind(locale, profileId, userId).run();
  if (!result.meta.changes) throw new Error("Không thể cập nhật ngôn ngữ hồ sơ.");
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

export async function updateProfileAppearance(userId: string, profileId: string, appearance: { avatarUrl: string | null; avatarColor: string; theme: string }) {
  await ensureDatabase();
  const themes = ["cinewave", "water", "wood", "fire", "earth", "metal"];
  const theme = themes.includes(appearance.theme) ? appearance.theme : "cinewave";
  const color = /^#[0-9a-f]{6}$/i.test(appearance.avatarColor) ? appearance.avatarColor : "#8b7cff";
  const result = await database().prepare(`UPDATE profiles SET avatar_url = ?, avatar_color = ?, theme = ? WHERE id = ? AND user_id = ?`)
    .bind(appearance.avatarUrl, color, theme, profileId, userId).run();
  if (!result.meta.changes) throw new Error("Không thể cập nhật giao diện hồ sơ.");
}

export async function listProfiles(userId: string) {
  await ensureDatabase();
  const result = await database()
    .prepare(
      `SELECT id, name, avatar_color AS avatarColor, avatar_url AS avatarUrl, theme, maturity, is_kids AS isKids
       FROM profiles WHERE user_id = ? ORDER BY created_at ASC`,
    )
    .bind(userId)
    .all<{ id: string; name: string; avatarColor: string; avatarUrl: string | null; theme: string; maturity: string; isKids: number }>();
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

export type ProfileReaction = { movieId: string; reaction: "like" | "love" | "not_for_me"; updatedAt: string };

export async function listProfileReactions(profileId: string) {
  await ensureDatabase();
  const result = await database().prepare(
    `SELECT movie_id AS movieId, reaction, updated_at AS updatedAt
     FROM title_reactions WHERE profile_id = ? ORDER BY updated_at DESC`,
  ).bind(profileId).all<ProfileReaction>();
  return result.results;
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
  const position = Math.max(0, Math.floor(positionSeconds));
  const updated = await database().prepare(
    `UPDATE watch_progress SET position_seconds = ?, updated_at = ?
     WHERE user_id = ? AND profile_id = ? AND movie_id = ?`,
  ).bind(position, now, userId, profileId, movieId).run();
  if (!updated.meta.changes) {
    await database().prepare(
      `INSERT INTO watch_progress (id, user_id, profile_id, movie_id, position_seconds, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), userId, profileId, movieId, position, now).run();
  }
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

export type PaymentInvoice = {
  id: string;
  userId: string;
  planCode: string;
  amountVnd: number;
  transferContent: string;
  provider: string;
  status: "pending" | "paid" | "expired" | "cancelled";
  providerTransactionId: string | null;
  referenceCode: string | null;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
};

const paymentInvoiceSelect = `SELECT id, user_id AS userId, plan_code AS planCode,
  amount_vnd AS amountVnd, transfer_content AS transferContent, provider, status,
  provider_transaction_id AS providerTransactionId, reference_code AS referenceCode,
  created_at AS createdAt, expires_at AS expiresAt, paid_at AS paidAt
  FROM payment_invoices`;

export async function createPaymentInvoice(userId: string, planCode: string, amountVnd: number) {
  if (!Object.hasOwn(planLimits, planCode) || planCode === "preview") throw new Error("INVALID_PAYMENT_PLAN");
  if (!Number.isInteger(amountVnd) || amountVnd < 1_000 || amountVnd > 999_999_999) throw new Error("INVALID_PAYMENT_AMOUNT");
  await ensureDatabase();
  const db = database();
  const now = new Date();
  const nowIso = now.toISOString();
  await db.prepare("UPDATE payment_invoices SET status = 'expired' WHERE status = 'pending' AND expires_at <= ?")
    .bind(nowIso).run();
  const reusable = await db.prepare(`${paymentInvoiceSelect}
    WHERE user_id = ? AND plan_code = ? AND amount_vnd = ? AND status = 'pending' AND expires_at > ?
    ORDER BY created_at DESC LIMIT 1`).bind(userId, planCode, amountVnd, nowIso).first<PaymentInvoice>();
  if (reusable) return reusable;

  const id = crypto.randomUUID();
  const transferContent = `CW${id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1_000).toISOString();
  await db.prepare(`INSERT INTO payment_invoices
    (id, user_id, plan_code, amount_vnd, transfer_content, provider, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, 'sepay', 'pending', ?, ?)`)
    .bind(id, userId, planCode, amountVnd, transferContent, nowIso, expiresAt).run();
  const invoice = await db.prepare(`${paymentInvoiceSelect} WHERE id = ? LIMIT 1`).bind(id).first<PaymentInvoice>();
  if (!invoice) throw new Error("PAYMENT_INVOICE_CREATE_FAILED");
  return invoice;
}

export async function getPaymentInvoiceForUser(invoiceId: string, userId: string) {
  await ensureDatabase();
  const db = database();
  const now = new Date().toISOString();
  await db.prepare("UPDATE payment_invoices SET status = 'expired' WHERE id = ? AND status = 'pending' AND expires_at <= ?")
    .bind(invoiceId, now).run();
  return db.prepare(`${paymentInvoiceSelect} WHERE id = ? AND user_id = ? LIMIT 1`)
    .bind(invoiceId, userId).first<PaymentInvoice>();
}

export async function getLatestPendingPaymentInvoice(userId: string) {
  await ensureDatabase();
  const db = database();
  const now = new Date().toISOString();
  await db.prepare("UPDATE payment_invoices SET status = 'expired' WHERE user_id = ? AND status = 'pending' AND expires_at <= ?")
    .bind(userId, now).run();
  return db.prepare(`${paymentInvoiceSelect} WHERE user_id = ? AND status = 'pending' AND expires_at > ? ORDER BY created_at DESC LIMIT 1`)
    .bind(userId, now).first<PaymentInvoice>();
}

export async function settlePaymentInvoice(input: {
  providerTransactionId: string;
  transferContent: string;
  amountVnd: number;
  referenceCode?: string | null;
  payload: unknown;
}) {
  await ensureDatabase();
  const db = database();
  const duplicate = await db.prepare("SELECT invoice_id AS invoiceId FROM payment_events WHERE provider = 'sepay' AND provider_transaction_id = ? LIMIT 1")
    .bind(input.providerTransactionId).first<{ invoiceId: string | null }>();
  if (duplicate) return { outcome: "duplicate" as const, invoiceId: duplicate.invoiceId };

  const invoice = await db.prepare(`${paymentInvoiceSelect} WHERE transfer_content = ? LIMIT 1`)
    .bind(input.transferContent.toUpperCase()).first<PaymentInvoice>();
  if (!invoice) return { outcome: "not_found" as const, invoiceId: null };
  if (invoice.status === "paid") return { outcome: "already_paid" as const, invoiceId: invoice.id };
  if (invoice.status !== "pending" || Date.parse(invoice.expiresAt) <= Date.now()) {
    await db.prepare("UPDATE payment_invoices SET status = 'expired' WHERE id = ? AND status = 'pending'").bind(invoice.id).run();
    return { outcome: "expired" as const, invoiceId: invoice.id };
  }
  if (invoice.amountVnd !== input.amountVnd) return { outcome: "amount_mismatch" as const, invoiceId: invoice.id };

  const now = new Date();
  const paidAt = now.toISOString();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  await db.batch([
    db.prepare(`INSERT INTO payment_events
      (id, provider, provider_transaction_id, invoice_id, amount_vnd, payload_json, created_at)
      VALUES (?, 'sepay', ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), input.providerTransactionId, invoice.id, input.amountVnd, JSON.stringify(input.payload), paidAt),
    db.prepare(`UPDATE payment_invoices SET status = 'paid', provider_transaction_id = ?,
      reference_code = ?, paid_at = ? WHERE id = ? AND status = 'pending'`)
      .bind(input.providerTransactionId, input.referenceCode ?? null, paidAt, invoice.id),
    db.prepare("UPDATE subscriptions SET status = 'superseded' WHERE user_id = ? AND status = 'active'").bind(invoice.userId),
    db.prepare(`INSERT INTO subscriptions
      (id, user_id, plan_code, status, current_period_end, provider, provider_customer_id, updated_at)
      VALUES (?, ?, ?, 'active', ?, 'sepay', ?, ?)`)
      .bind(crypto.randomUUID(), invoice.userId, invoice.planCode, periodEnd.toISOString(), invoice.id, paidAt),
  ]);
  return { outcome: "paid" as const, invoiceId: invoice.id };
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
  const managed = movie ? null : await findManagedTitle(movieId);
  if (!movie && !managed) throw new Error("TITLE_NOT_FOUND");
  if (movie && (!movie.source || !movie.video)) throw new Error("RIGHTS_NOT_AVAILABLE");
  if (managed && !managed.videoUrl) throw new Error("RIGHTS_NOT_AVAILABLE");
  const profile = await getActiveProfile(userId);
  const allowed = movie ? maturityAllows(movie, profile.maturity) : maturityRank(managed!.maturity) <= maturityRank(profile.maturity);
  if (!allowed) throw new Error("PROFILE_RESTRICTED");
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
    ).bind(crypto.randomUUID(), movieId, movie?.source?.licenseUrl ?? managed!.licenseUrl, nowIso).run();
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
  await recordAnalytics(profile.id, "playback.started", { movieId }, "essential");
  return { sessionId, profile, expiresAt };
}

function maturityRank(value: string) {
  return ({ P: 0, K: 7, T13: 13, T16: 16, T18: 18 } as Record<string, number>)[value] ?? 18;
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

export type TrendPeriod = "hour" | "day" | "week";
export type TrendRankingEntry = {
  movieId: string;
  views: number;
  score: number;
  trendPercent: number;
  forecast: string;
};
export type TrendSnapshot = {
  period: TrendPeriod;
  ranking: TrendRankingEntry[];
  hotTags: { label: string; signals: number }[];
  totalSignals: number;
};

const trendWindows: Record<TrendPeriod, number> = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
};

type TrendAccumulator = { current: number; previous: number; views: number; saves: number; reactions: number; searches: number };

type TrendSignalRows = {
  searchEvents: { propertiesJson: string; createdAt: string }[];
  sessions: { movieId: string; createdAt: string }[];
  savedRows: { movieId: string; createdAt: string }[];
  reactionRows: { movieId: string; reaction: string; createdAt: string }[];
};

export async function getTrendSnapshots(periods: TrendPeriod[] = ["hour", "day", "week"]) {
  await ensureDatabase();
  const now = Date.now();
  const longestWindow = Math.max(...periods.map((period) => trendWindows[period]));
  const previousStart = new Date(now - longestWindow * 2).toISOString();
  const db = database();
  const [searchEvents, sessions, savedRows, reactionRows] = await Promise.all([
    db.prepare(
      `SELECT properties_json AS propertiesJson, created_at AS createdAt
       FROM analytics_events WHERE event_name = 'search.submitted' AND created_at >= ?
       ORDER BY created_at DESC LIMIT 5000`,
    ).bind(previousStart).all<{ propertiesJson: string; createdAt: string }>(),
    db.prepare(
      `SELECT movie_id AS movieId, created_at AS createdAt FROM playback_sessions
       WHERE created_at >= ? ORDER BY created_at DESC LIMIT 5000`,
    ).bind(previousStart).all<{ movieId: string; createdAt: string }>(),
    db.prepare(
      `SELECT movie_id AS movieId, created_at AS createdAt FROM watchlist
       WHERE created_at >= ? ORDER BY created_at DESC LIMIT 5000`,
    ).bind(previousStart).all<{ movieId: string; createdAt: string }>(),
    db.prepare(
      `SELECT movie_id AS movieId, reaction, updated_at AS createdAt FROM title_reactions
       WHERE updated_at >= ? ORDER BY updated_at DESC LIMIT 5000`,
    ).bind(previousStart).all<{ movieId: string; reaction: string; createdAt: string }>(),
  ]);
  const rows: TrendSignalRows = {
    searchEvents: searchEvents.results,
    sessions: sessions.results,
    savedRows: savedRows.results,
    reactionRows: reactionRows.results,
  };
  return Object.fromEntries(periods.map((period) => [period, buildTrendSnapshot(period, now, rows)])) as Record<TrendPeriod, TrendSnapshot>;
}

export async function getTrendSnapshot(period: TrendPeriod): Promise<TrendSnapshot> {
  return (await getTrendSnapshots([period]))[period];
}

function buildTrendSnapshot(period: TrendPeriod, now: number, rows: TrendSignalRows): TrendSnapshot {
  const windowMs = trendWindows[period];
  const currentStart = new Date(now - windowMs).toISOString();
  const scoreByMovie = new Map<string, TrendAccumulator>();
  const tagScores = new Map<string, number>();
  const ensureMovie = (movieId: string) => {
    const existing = scoreByMovie.get(movieId);
    if (existing) return existing;
    const created = { current: 0, previous: 0, views: 0, saves: 0, reactions: 0, searches: 0 };
    scoreByMovie.set(movieId, created);
    return created;
  };
  const add = (movieId: string, createdAt: string, weight: number, field: "views" | "saves" | "reactions" | "searches") => {
    if (!findMovie(movieId)) return;
    const item = ensureMovie(movieId);
    const isCurrent = createdAt >= currentStart;
    if (isCurrent) {
      item.current += weight;
      item[field] += 1;
    } else {
      item.previous += weight;
    }
  };

  rows.sessions.forEach((row) => add(row.movieId, row.createdAt, 1, "views"));
  rows.savedRows.forEach((row) => add(row.movieId, row.createdAt, 3, "saves"));
  rows.reactionRows.forEach((row) => add(row.movieId, row.createdAt, row.reaction === "love" ? 4 : row.reaction === "like" ? 2 : -2, "reactions"));
  rows.searchEvents.forEach((row) => {
    let properties: { query?: string; resultIds?: string[] } = {};
    try { properties = JSON.parse(row.propertiesJson) as typeof properties; } catch { return; }
    if (row.createdAt >= currentStart && properties.query?.trim()) {
      const label = properties.query.trim().slice(0, 32);
      tagScores.set(label, (tagScores.get(label) ?? 0) + 3);
    }
    (properties.resultIds ?? []).slice(0, 5).forEach((movieId, index) => add(movieId, row.createdAt, Math.max(.6, 2.2 - index * .3), "searches"));
  });

  const ranking = movies.map((movie) => {
    const signals = scoreByMovie.get(movie.id) ?? { current: 0, previous: 0, views: 0, saves: 0, reactions: 0, searches: 0 };
    const editorialPrior = (movie.trending ? 10 : 0) + Math.max(0, movie.match - 88) * .35;
    const score = signals.current + editorialPrior;
    const organicDelta = signals.previous > 0 ? Math.round(((signals.current - signals.previous) / signals.previous) * 100) : signals.current > 0 ? 100 : 0;
    const predictedDelta = organicDelta || (movie.trending ? Math.max(4, Math.round((movie.match - 86) * .7)) : 0);
    const velocity = signals.current - signals.previous;
    const forecast = velocity >= 6 ? "Dự báo bứt phá" : velocity > 0 ? "Đang tăng tốc" : movie.trending ? "Tiếp tục được chú ý" : "Xu hướng ổn định";
    return { movieId: movie.id, views: signals.views, score, trendPercent: Math.max(-99, Math.min(999, predictedDelta)), forecast };
  }).sort((a, b) => b.score - a.score).slice(0, 8);

  ranking.forEach((entry, index) => {
    const movie = findMovie(entry.movieId);
    if (!movie) return;
    const item = scoreByMovie.get(entry.movieId);
    const interactionWeight = (item?.views ?? 0) + (item?.saves ?? 0) * 2 + (item?.reactions ?? 0) * 2 + (item?.searches ?? 0) * 2;
    const fallback = Math.max(1, 5 - index);
    tagScores.set(movie.title, (tagScores.get(movie.title) ?? 0) + interactionWeight + fallback);
    movie.genres.slice(0, 2).forEach((genre) => tagScores.set(genre, (tagScores.get(genre) ?? 0) + Math.max(1, interactionWeight / 2)));
  });

  const hotTags = [...tagScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, signals]) => ({ label, signals: Math.round(signals) }));
  const totalSignals = rows.sessions.filter((row) => row.createdAt >= currentStart).length
    + rows.savedRows.filter((row) => row.createdAt >= currentStart).length
    + rows.reactionRows.filter((row) => row.createdAt >= currentStart).length
    + rows.searchEvents.filter((row) => row.createdAt >= currentStart).length;

  return { period, ranking, hotTags, totalSignals };
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

export type ManagedTitle = {
  id: string;
  title: string;
  originalTitle: string;
  releaseYear: number;
  contentType: "movie" | "series";
  genres: string;
  maturity: string;
  duration: string;
  synopsis: string;
  posterUrl: string | null;
  videoUrl: string | null;
  licenseName: string;
  licenseUrl: string;
  status: "draft" | "published" | "hidden";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

const managedTitleSelect = `SELECT id, title, original_title AS originalTitle,
  release_year AS releaseYear, content_type AS contentType, genres, maturity, duration,
  synopsis, poster_url AS posterUrl, video_url AS videoUrl, license_name AS licenseName,
  license_url AS licenseUrl, status, created_by AS createdBy, created_at AS createdAt,
  updated_at AS updatedAt, published_at AS publishedAt FROM managed_titles`;

export async function listManagedTitles(options: { publishedOnly?: boolean; query?: string } = {}) {
  await ensureDatabase();
  const clauses: string[] = [];
  const values: string[] = [];
  if (options.publishedOnly) clauses.push("status = 'published'");
  if (options.query?.trim()) {
    clauses.push("(LOWER(title) LIKE ? OR LOWER(original_title) LIKE ? OR LOWER(genres) LIKE ?)");
    const like = `%${options.query.trim().toLowerCase()}%`;
    values.push(like, like, like);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  const result = await database().prepare(`${managedTitleSelect}${where} ORDER BY updated_at DESC`)
    .bind(...values).all<ManagedTitle>();
  return result.results;
}

export async function findManagedTitle(id: string, includeUnpublished = false) {
  await ensureDatabase();
  const suffix = includeUnpublished ? "" : " AND status = 'published'";
  return database().prepare(`${managedTitleSelect} WHERE id = ?${suffix} LIMIT 1`)
    .bind(id).first<ManagedTitle>();
}

export type ManagedTitleInput = Omit<ManagedTitle, "id" | "status" | "createdBy" | "createdAt" | "updatedAt" | "publishedAt">;

export async function createManagedTitle(input: ManagedTitleInput, actorEmail: string) {
  await ensureDatabase();
  const id = `cms-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await database().prepare(
    `INSERT INTO managed_titles (id, title, original_title, release_year, content_type, genres,
      maturity, duration, synopsis, poster_url, video_url, license_name, license_url, status,
      created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`,
  ).bind(id, input.title, input.originalTitle, input.releaseYear, input.contentType, input.genres,
    input.maturity, input.duration, input.synopsis, input.posterUrl, input.videoUrl,
    input.licenseName, input.licenseUrl, actorEmail, now, now).run();
  await recordAudit(actorEmail, "content.created", id);
  return id;
}

export async function updateManagedTitle(id: string, input: ManagedTitleInput, actorEmail: string) {
  await ensureDatabase();
  const result = await database().prepare(
    `UPDATE managed_titles SET title = ?, original_title = ?, release_year = ?, content_type = ?,
      genres = ?, maturity = ?, duration = ?, synopsis = ?, poster_url = ?, video_url = ?,
      license_name = ?, license_url = ?, updated_at = ? WHERE id = ?`,
  ).bind(input.title, input.originalTitle, input.releaseYear, input.contentType, input.genres,
    input.maturity, input.duration, input.synopsis, input.posterUrl, input.videoUrl,
    input.licenseName, input.licenseUrl, new Date().toISOString(), id).run();
  if (!result.meta.changes) throw new Error("TITLE_NOT_FOUND");
  await recordAudit(actorEmail, "content.updated", id);
}

export async function setManagedTitleStatus(id: string, status: "draft" | "published" | "hidden", actorEmail: string) {
  await ensureDatabase();
  const now = new Date().toISOString();
  const title = await findManagedTitle(id, true);
  if (!title) throw new Error("TITLE_NOT_FOUND");
  if (status === "published" && (!title.videoUrl || !title.licenseName || !title.licenseUrl)) {
    throw new Error("PUBLISH_REQUIRES_MEDIA_AND_LICENSE");
  }
  await database().prepare(
    "UPDATE managed_titles SET status = ?, updated_at = ?, published_at = CASE WHEN ? = 'published' THEN ? ELSE published_at END WHERE id = ?",
  ).bind(status, now, status, now, id).run();
  await recordAudit(actorEmail, `content.${status}`, id);
}

export async function deleteManagedTitle(id: string, actorEmail: string) {
  await ensureDatabase();
  const title = await findManagedTitle(id, true);
  if (!title || title.status === "published") throw new Error("TITLE_MUST_BE_UNPUBLISHED");
  await database().prepare("DELETE FROM managed_titles WHERE id = ?").bind(id).run();
  await recordAudit(actorEmail, "content.deleted", `${id}:${title.title}`);
}

export type AdminAccount = {
  id: string; email: string; displayName: string; role: string; status: string;
  createdAt: string; profileCount: number;
};

export async function listAdminAccounts() {
  await ensureDatabase();
  const result = await database().prepare(
    `SELECT u.id, u.email, u.display_name AS displayName, u.role, u.status,
      u.created_at AS createdAt, COUNT(p.id) AS profileCount
     FROM users u LEFT JOIN profiles p ON p.user_id = u.id
     GROUP BY u.id ORDER BY u.created_at DESC LIMIT 100`,
  ).all<AdminAccount>();
  return result.results;
}

export async function setAccountStatus(userId: string, status: "active" | "locked", actorEmail: string) {
  await ensureDatabase();
  const target = await database().prepare("SELECT email, role FROM users WHERE id = ? LIMIT 1")
    .bind(userId).first<{ email: string; role: string }>();
  if (!target) throw new Error("USER_NOT_FOUND");
  if (target.email.toLowerCase() === actorEmail.toLowerCase()) throw new Error("CANNOT_LOCK_SELF");
  await database().prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, new Date().toISOString(), userId).run();
  if (status === "locked") await database().prepare("DELETE FROM auth_sessions WHERE user_id = ?").bind(userId).run();
  await recordAudit(actorEmail, `account.${status}`, `${userId}:${target.email}`);
}

export type AuditEvent = { id: string; actorEmail: string; action: string; target: string; createdAt: string };

export async function listAuditEvents(limit = 100) {
  await ensureDatabase();
  const result = await database().prepare(
    `SELECT id, actor_email AS actorEmail, action, target, created_at AS createdAt
     FROM audit_events ORDER BY created_at DESC LIMIT ?`,
  ).bind(Math.min(200, Math.max(1, limit))).all<AuditEvent>();
  return result.results;
}

function requireE2EMode() {
  if ((env as unknown as { CINEWAVE_E2E?: string }).CINEWAVE_E2E !== "1") throw new Error("E2E_DISABLED");
}

export async function resetE2EState() {
  requireE2EMode();
  await ensureDatabase();
  const tables = [
    "auth_sessions", "playback_sessions", "title_reactions", "watch_progress", "watchlist", "payment_events", "payment_invoices",
    "analytics_events", "content_rights", "catalog_sync_runs", "imported_movies", "audit_events",
    "managed_titles", "subscriptions", "profiles", "users",
  ];
  await database().batch(tables.map((table) => database().prepare(`DELETE FROM ${table}`)));
  // The E2E database can share Miniflare persistence with localhost on Windows.
  // Restore local-only demo credentials immediately so test cleanup never removes them.
  await ensureLocalDemoAccounts(true);
}

export async function setE2EUserRole(email: string, role: "viewer" | "admin") {
  requireE2EMode();
  await ensureDatabase();
  await database().prepare("UPDATE users SET role = ?, updated_at = ? WHERE email = ?")
    .bind(role, new Date().toISOString(), email.trim().toLowerCase()).run();
}
