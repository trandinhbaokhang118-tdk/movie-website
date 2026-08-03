import { expect, type BrowserContext, type Page } from "@playwright/test";

export const accounts = {
  viewer: { email: "user.e2e@cinewave.local", password: "ViewerE2E!2026" },
  admin: { email: "admin.e2e@cinewave.local", password: "AdminE2E!2026" },
};

export async function blockImages(context: BrowserContext) {
  const transparentPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+Xw5nAAAAAElFTkSuQmCC", "base64");
  await context.route("**/*", (route) => route.request().resourceType() === "image"
    ? route.fulfill({ status: 200, contentType: "image/png", body: transparentPixel })
    : route.continue());
}

export async function login(page: Page, account: keyof typeof accounts, returnTo = "/") {
  await page.goto(`/login?return_to=${encodeURIComponent(returnTo)}`);
  await page.getByLabel("Email").fill(accounts[account].email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(accounts[account].password);
  await injectTurnstileToken(page);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${returnTo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
}

export async function injectTurnstileToken(page: Page) {
  const existingToken = page.locator('input[name="cf-turnstile-response"]');
  if (await existingToken.count()) return;
  await page.locator("form.auth-form").evaluate((form) => {
    form.querySelectorAll('input[name="cf-turnstile-response"]').forEach((input) => input.remove());
    const token = document.createElement("input");
    token.type = "hidden";
    token.name = "cf-turnstile-response";
    token.value = "cinewave-e2e-turnstile";
    form.appendChild(token);
  });
}
