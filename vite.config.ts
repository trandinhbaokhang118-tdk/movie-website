import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";
const E2E_DATABASE_ID = "00000000-0000-4000-8000-000000000001";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const isE2E = process.env.CINEWAVE_E2E === "1";
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

const localBindingConfig = {
  name: isE2E ? "cinewave-e2e" : "cinewave-local",
  main: "./worker/index.ts",
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: isE2E ? "cinewave-e2e" : "site-creator-d1",
          database_id: isE2E ? E2E_DATABASE_ID : SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
  vars: {
    // Local bootstrap only. Production authorization must be configured with
    // ADMIN_EMAILS in the Cloudflare Worker environment.
    ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "admin@cinewave.local",
    PAYMENT_BANK_CODE: process.env.PAYMENT_BANK_CODE ?? "",
    PAYMENT_BANK_ACCOUNT: process.env.PAYMENT_BANK_ACCOUNT ?? "",
    PAYMENT_ACCOUNT_NAME: process.env.PAYMENT_ACCOUNT_NAME ?? "",
    SEPAY_WEBHOOK_API_KEY: process.env.SEPAY_WEBHOOK_API_KEY ?? "",
    CINEWAVE_LOCAL_AUTH: process.env.CINEWAVE_LOCAL_AUTH ?? "0",
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY ?? TURNSTILE_TEST_SITE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY ?? TURNSTILE_TEST_SECRET_KEY,
    TURNSTILE_ALLOWED_HOSTNAMES: process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "",
    SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    ...(isE2E ? { CINEWAVE_E2E: "1", CINEWAVE_E2E_KEY: "cinewave-local-e2e" } : {}),
  },
};

export default defineConfig(async ({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";
  localBindingConfig.vars.CINEWAVE_LOCAL_AUTH = process.env.CINEWAVE_LOCAL_AUTH ?? (command === "serve" && !isE2E ? "1" : "0");

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
    const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      // Vite 8 enables browser-console forwarding automatically when it detects
      // an agent environment. During an HMR reconnect that forwarder can call
      // transport.send() before the WebSocket exists, recursively filling the
      // error overlay with "Cannot read ... send". HMR itself stays enabled.
      forwardConsole: false,
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
