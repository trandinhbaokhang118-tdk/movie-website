import { env } from "cloudflare:workers";
import { paymentConfigurationStatus } from "./payment-config";

type RuntimeEnv = {
  ADMIN_EMAILS?: string;
  TMDB_ACCESS_TOKEN?: string;
  TMDB_API_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  MEDIA?: R2Bucket;
};

export function runtimeConfigurationStatus() {
  const config = env as unknown as RuntimeEnv;
  const turnstileSiteKey = (config.TURNSTILE_SITE_KEY ?? "").trim();
  const turnstileSecret = (config.TURNSTILE_SECRET_KEY ?? "").trim();
  const usesTurnstileTestKey = turnstileSiteKey.startsWith("1x000000") || turnstileSecret.startsWith("1x000000");
  return {
    payment: paymentConfigurationStatus(),
    turnstileReady: Boolean(turnstileSiteKey && turnstileSecret && !usesTurnstileTestKey),
    catalogImportReady: Boolean((config.TMDB_ACCESS_TOKEN ?? "").trim() || (config.TMDB_API_KEY ?? "").trim()),
    bootstrapAdminsConfigured: Boolean((config.ADMIN_EMAILS ?? "").trim()),
    mediaStorageReady: Boolean(config.MEDIA),
  };
}
