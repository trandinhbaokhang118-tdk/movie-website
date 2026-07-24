import { expect, test } from "./fixtures";
import { blockImages, login } from "./helpers";

test.beforeEach(async ({ context, page }) => {
  await blockImages(context);
  await login(page, "viewer", "/browse");
});

test("header mở menu tài khoản, tải app và chọn đúng gói VIP", async ({ page }) => {
  const account = page.locator(".profile-popover");
  await account.hover();
  await expect(account.getByRole("menuitem", { name: "Đăng xuất" })).toBeVisible();

  const app = page.locator(".app-popover");
  await app.hover();
  await expect(app.locator(".app-dropdown")).toBeVisible();
  await expect(app.getByAltText("Mã QR mở CineWave trên điện thoại")).toHaveAttribute("src", /^data:image\/(?:gif|png)/);

  await page.locator(".vip-trigger").click();
  const dialog = page.getByRole("dialog", { name: "Chọn trải nghiệm CineWave" });
  await expect(dialog).toBeVisible();
  await dialog.locator('[data-plan="constellation"]').click();
  await expect(dialog.locator('input[name="planCode"]')).toHaveValue("constellation");
  await expect(dialog.locator(".vip-modal-footer form > span")).toHaveText("219.000đ");
  await expect(dialog.locator(".vip-benefit-strip")).toContainText("4K HDR · 4 thiết bị");
});
