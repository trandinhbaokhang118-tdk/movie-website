import { expect, test } from "./fixtures";
import { blockImages, injectTurnstileToken } from "./helpers";

test.beforeEach(async ({ context }) => blockImages(context));

test("khách xem landing, FAQ và đi tới đăng ký bằng email", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Phim thật để xem/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đang thịnh hành" })).toBeVisible();
  await page.waitForTimeout(500);
  await page.getByText("Phim có xem thật được không?").click();
  await expect(page.getByText(/tệp MP4 thật/)).toBeVisible();
  await page.locator("#landing-email").fill("new.viewer@cinewave.local");
  await page.getByRole("button", { name: /Bắt đầu/ }).click();
  await expect(page).toHaveURL(/\/register\?email=new\.viewer%40cinewave\.local/);
  await expect(page.getByLabel("Email")).toHaveValue("new.viewer@cinewave.local");
});

test("route riêng tư chuyển khách tới đăng nhập và từ chối mật khẩu sai", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?return_to=%2Faccount/);
  await page.getByLabel("Email").fill("user.e2e@cinewave.local");
  await page.getByLabel("Mật khẩu").fill("not-the-password");
  await injectTurnstileToken(page);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Email hoặc mật khẩu không đúng");
});

test("tài khoản user localhost vẫn đăng nhập được sau khi reset dữ liệu kiểm thử", async ({ page }) => {
  await page.goto("/login?return_to=%2Fbrowse");
  await page.getByLabel("Email").fill("user@cinewave.local");
  await page.getByLabel("Mật khẩu").fill("CineWaveUser@2026");
  await injectTurnstileToken(page);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/browse$/);
  await page.locator(".profile-popover").hover();
  await expect(page.getByRole("menuitem", { name: "Đăng xuất" })).toBeVisible();
});

test("tìm kiếm trên header bung sang trái và giữ từ khóa trên một hàng", async ({ page }) => {
  await page.goto("/title/ia-sprite-fright-2021");
  const header = page.locator(".header-inner");
  const initialHeight = await header.evaluate((element) => element.getBoundingClientRect().height);
  await page.getByRole("button", { name: "Mở tìm kiếm" }).click();
  const input = page.getByRole("searchbox", { name: "Tìm phim, series hoặc diễn viên" });
  await expect(input).toBeVisible();
  await input.fill("Sprite Fright");
  await expect(header).toHaveCSS("height", `${initialHeight}px`);
  await input.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=Sprite\+Fright$/);
  await expect(page.getByRole("heading", { name: /Kết quả cho/ })).toBeVisible();
  await expect(page.locator(".search-form")).toHaveCount(0);
  await page.getByRole("button", { name: "Mở tìm kiếm" }).click();
  await expect(page.getByRole("searchbox", { name: "Tìm phim, series hoặc diễn viên" })).toHaveValue("Sprite Fright");
});
