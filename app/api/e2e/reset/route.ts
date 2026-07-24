import { env } from "cloudflare:workers";
import { registerWithPassword } from "../../../auth";
import { resetE2EState, setE2EUserRole } from "@/db/runtime";

export async function POST(request: Request) {
  const bindings = env as unknown as { CINEWAVE_E2E?: string; CINEWAVE_E2E_KEY?: string };
  if (bindings.CINEWAVE_E2E !== "1") return new Response("Not found", { status: 404 });
  if (request.headers.get("x-e2e-key") !== bindings.CINEWAVE_E2E_KEY) return new Response("Forbidden", { status: 403 });
  await resetE2EState();
  await registerWithPassword({ email: "user.e2e@cinewave.local", displayName: "E2E Viewer", password: "ViewerE2E!2026" });
  await registerWithPassword({ email: "admin.e2e@cinewave.local", displayName: "E2E Admin", password: "AdminE2E!2026" });
  await setE2EUserRole("admin.e2e@cinewave.local", "admin");
  return Response.json({ ok: true });
}
