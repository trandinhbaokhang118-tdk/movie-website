import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const runtimeMetadata = sqliteTable("runtime_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash"),
    passwordSalt: text("password_salt"),
    activeProfileId: text("active_profile_id"),
    role: text("role").notNull().default("viewer"),
    status: text("status").notNull().default("active"),
    analyticsConsent: integer("analytics_consent", { mode: "boolean" }).notNull().default(false),
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
    avatarUrl: text("avatar_url"),
    theme: text("theme").notNull().default("cinewave"),
    maturity: text("maturity").notNull().default("T18"),
    isKids: integer("is_kids", { mode: "boolean" }).notNull().default(false),
    locale: text("locale").notNull().default("vi-VN"),
    subtitleLanguage: text("subtitle_language").notNull().default("vi"),
    autoplayNext: integer("autoplay_next", { mode: "boolean" }).notNull().default(true),
    autoplayPreviews: integer("autoplay_previews", { mode: "boolean" }).notNull().default(false),
    pinHash: text("pin_hash"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("profiles_user_name_uq").on(table.userId, table.name)],
);

export const watchlist = sqliteTable(
  "watchlist",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    profileId: text("profile_id").notNull(),
    movieId: text("movie_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("watchlist_profile_movie_uq").on(table.profileId, table.movieId),
    index("watchlist_profile_created_idx").on(table.userId, table.profileId, table.createdAt),
    index("watchlist_created_movie_idx").on(table.createdAt, table.movieId),
  ],
);

export const watchProgress = sqliteTable(
  "watch_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    profileId: text("profile_id").notNull(),
    movieId: text("movie_id").notNull(),
    positionSeconds: integer("position_seconds").notNull().default(0),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("progress_profile_movie_uq").on(table.profileId, table.movieId),
    index("progress_profile_updated_idx").on(table.userId, table.profileId, table.updatedAt),
  ],
);

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planCode: text("plan_code").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: text("current_period_end").notNull(),
  provider: text("provider").notNull().default("cinewave_sandbox"),
  providerCustomerId: text("provider_customer_id"),
  updatedAt: text("updated_at").notNull(),
});

export const paymentInvoices = sqliteTable(
  "payment_invoices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    planCode: text("plan_code").notNull(),
    amountVnd: integer("amount_vnd").notNull(),
    transferContent: text("transfer_content").notNull(),
    provider: text("provider").notNull().default("sepay"),
    status: text("status").notNull().default("pending"),
    providerTransactionId: text("provider_transaction_id"),
    referenceCode: text("reference_code"),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
    paidAt: text("paid_at"),
  },
  (table) => [uniqueIndex("payment_invoices_transfer_uq").on(table.transferContent)],
);

export const paymentEvents = sqliteTable(
  "payment_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerTransactionId: text("provider_transaction_id").notNull(),
    invoiceId: text("invoice_id"),
    amountVnd: integer("amount_vnd").notNull(),
    payloadJson: text("payload_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("payment_events_provider_tx_uq").on(table.provider, table.providerTransactionId)],
);

export const playbackSessions = sqliteTable(
  "playback_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    profileId: text("profile_id").notNull(),
    movieId: text("movie_id").notNull(),
    status: text("status").notNull().default("active"),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("playback_created_movie_idx").on(table.createdAt, table.movieId)],
);

export const titleReactions = sqliteTable(
  "title_reactions",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull(),
    movieId: text("movie_id").notNull(),
    reaction: text("reaction").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("reaction_profile_movie_uq").on(table.profileId, table.movieId),
    index("reactions_updated_movie_idx").on(table.updatedAt, table.movieId),
  ],
);

export const contentRights = sqliteTable("content_rights", {
  id: text("id").primaryKey(),
  movieId: text("movie_id").notNull(),
  territory: text("territory").notNull().default("VN"),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  status: text("status").notNull().default("approved"),
  licenseReference: text("license_reference").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(),
  profileId: text("profile_id"),
  eventName: text("event_name").notNull(),
  propertiesJson: text("properties_json").notNull().default("{}"),
  privacyClass: text("privacy_class").notNull().default("essential"),
  createdAt: text("created_at").notNull(),
});

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
  },
  (table) => [uniqueIndex("auth_sessions_token_uq").on(table.tokenHash)],
);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  createdAt: text("created_at").notNull(),
});

export const managedTitles = sqliteTable("managed_titles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  originalTitle: text("original_title").notNull(),
  releaseYear: integer("release_year").notNull(),
  contentType: text("content_type").notNull().default("movie"),
  genres: text("genres").notNull(),
  maturity: text("maturity").notNull().default("T13"),
  duration: text("duration").notNull(),
  synopsis: text("synopsis").notNull(),
  posterUrl: text("poster_url"),
  videoUrl: text("video_url"),
  licenseName: text("license_name").notNull(),
  licenseUrl: text("license_url").notNull(),
  status: text("status").notNull().default("draft"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  publishedAt: text("published_at"),
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
