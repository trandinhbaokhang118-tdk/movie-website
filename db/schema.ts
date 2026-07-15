import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("users_email_uq").on(table.email)],
);

export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    avatarColor: text("avatar_color").notNull(),
    maturity: text("maturity").notNull().default("T18"),
    isKids: integer("is_kids", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("profiles_user_name_uq").on(table.userId, table.name)],
);

export const watchlist = sqliteTable(
  "watchlist",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    movieId: text("movie_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("watchlist_user_movie_uq").on(table.userId, table.movieId)],
);

export const watchProgress = sqliteTable(
  "watch_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    movieId: text("movie_id").notNull(),
    positionSeconds: integer("position_seconds").notNull().default(0),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("progress_user_movie_uq").on(table.userId, table.movieId)],
);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  createdAt: text("created_at").notNull(),
});

export const importedMovies = sqliteTable(
  "imported_movies",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull().default("tmdb"),
    providerId: integer("provider_id").notNull(),
    title: text("title").notNull(),
    originalTitle: text("original_title").notNull(),
    releaseYear: integer("release_year"),
    overview: text("overview").notNull(),
    posterUrl: text("poster_url"),
    backdropUrl: text("backdrop_url"),
    voteAverage: integer("vote_average_x10").notNull().default(0),
    popularity: integer("popularity_x100").notNull().default(0),
    trailerKey: text("trailer_key"),
    trailerSite: text("trailer_site"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("imported_movies_provider_uq").on(table.provider, table.providerId)],
);

export const catalogSyncRuns = sqliteTable("catalog_sync_runs", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  actorEmail: text("actor_email").notNull(),
  status: text("status").notNull(),
  importedCount: integer("imported_count").notNull().default(0),
  trailerCount: integer("trailer_count").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
});
