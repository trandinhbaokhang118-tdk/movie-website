import { request, type FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) throw new Error("E2E baseURL is missing.");
  const context = await request.newContext({ baseURL });
  const response = await context.post("/api/e2e/reset", { headers: { "x-e2e-key": "cinewave-local-e2e" } });
  if (!response.ok()) throw new Error(`Unable to reset E2E database: ${response.status()} ${await response.text()}`);
  await context.dispose();
}
