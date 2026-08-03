export function isTrustedMutation(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || requestUrl.host;
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || requestUrl.protocol.replace(":", "");
    return new URL(origin).origin === `${forwardedProto}://${forwardedHost}`;
  } catch {
    return false;
  }
}

export async function readJsonBody<T>(request: Request, maxBytes = 32 * 1024): Promise<{ ok: true; value: T } | { ok: false; status: number; error: string }> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413, error: "PAYLOAD_TOO_LARGE" };
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) return { ok: false, status: 413, error: "PAYLOAD_TOO_LARGE" };
    return { ok: true, value: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 400, error: "INVALID_JSON" };
  }
}
