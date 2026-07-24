import { env } from "cloudflare:workers";
import { headers } from "next/headers";

type TurnstileEnv = {
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_ALLOWED_HOSTNAMES?: string;
  CINEWAVE_E2E?: string;
  CINEWAVE_LOCAL_AUTH?: string;
};

type TurnstileResult = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const E2E_TOKEN = "cinewave-e2e-turnstile";
const LOCAL_TOKEN = "cinewave-local-turnstile";

function bindings() {
  return env as unknown as TurnstileEnv;
}

export function getTurnstileSiteKey() {
  return bindings().TURNSTILE_SITE_KEY ?? "";
}

export function shouldRenderTurnstileChallenge() {
  const config = bindings();
  return config.CINEWAVE_E2E !== "1" && config.CINEWAVE_LOCAL_AUTH !== "1";
}

export async function verifyTurnstile(formData: FormData, expectedAction: "login" | "register") {
  const config = bindings();
  const token = String(formData.get("cf-turnstile-response") ?? "");
  if (config.CINEWAVE_E2E === "1" && (token === E2E_TOKEN || token === LOCAL_TOKEN)) return { ok: true as const };
  const requestHeaders = await headers();
  const requestHost = (requestHeaders.get("host") ?? "").split(":")[0].toLowerCase();
  const isLoopback = requestHost === "localhost" || requestHost === "127.0.0.1" || requestHost === "[::1]";
  if (config.CINEWAVE_LOCAL_AUTH === "1" && isLoopback && token === LOCAL_TOKEN) return { ok: true as const };
  if (!config.TURNSTILE_SECRET_KEY) return { ok: false as const, message: "Cloudflare Turnstile chưa được cấu hình." };
  if (!token || token.length > 2048) return { ok: false as const, message: "Vui lòng hoàn tất xác thực Cloudflare." };

  const payload = new URLSearchParams({ secret: config.TURNSTILE_SECRET_KEY, response: token });
  const remoteIp = requestHeaders.get("cf-connecting-ip");
  if (remoteIp) payload.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: payload,
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false as const, message: "Không thể xác thực Cloudflare lúc này." };
    const result = await response.json<TurnstileResult>();
    const allowedHosts = (config.TURNSTILE_ALLOWED_HOSTNAMES ?? "")
      .split(",").map((hostname) => hostname.trim().toLowerCase()).filter(Boolean);
    const actionMatches = !result.action || result.action === expectedAction;
    const hostnameMatches = allowedHosts.length === 0 || Boolean(result.hostname && allowedHosts.includes(result.hostname.toLowerCase()));
    return result.success && actionMatches && hostnameMatches
      ? { ok: true as const }
      : { ok: false as const, message: "Xác thực Cloudflare không hợp lệ hoặc đã hết hạn." };
  } catch {
    return { ok: false as const, message: "Không thể kết nối dịch vụ xác thực Cloudflare." };
  } finally {
    clearTimeout(timeout);
  }
}
