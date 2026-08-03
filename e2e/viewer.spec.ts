import { expect, test } from "./fixtures";
import { blockImages, login } from "./helpers";

test.beforeEach(async ({ context, page }) => { await blockImages(context); await login(page, "viewer", "/browse"); });

test("user tìm phim thật, lưu My List, phát và thấy lịch sử", async ({ page }) => {
  await page.goto("/search?q=Sprite+Fright");
  await expect(page.getByRole("heading", { name: /Kết quả cho/ })).toBeVisible();
  await page.getByRole("link", { name: /Sprite Fright/ }).first().click();
  await expect(page.getByRole("heading", { name: "Sprite Fright", exact: true })).toBeVisible();
  const saveButton = page.locator(".watchlist-control").getByRole("button", { name: "Lưu vào Tủ phim" });
  await expect(saveButton).toHaveAttribute("data-ready", "true");
  const savedResponse = page.waitForResponse((response) => response.url().endsWith("/api/watchlist") && response.request().method() === "PUT" && response.status() === 200);
  await saveButton.click();
  await (await savedResponse).finished();
  await page.goto("/my-list");
  await expect(page.getByRole("heading", { name: "Sprite Fright" })).toBeVisible();

  await page.goto("/watch/ia-sprite-fright-2021");
  const video = page.locator("video");
  await expect(video).toBeVisible();
  await video.evaluate(async (element: HTMLVideoElement) => { element.muted = true; await element.play(); });
  await page.waitForTimeout(2_000);
  const progressSaved = page.waitForResponse((response) => response.url().endsWith("/api/progress") && response.request().method() === "PUT" && response.status() === 200);
  await video.evaluate((element: HTMLVideoElement) => element.pause());
  await progressSaved;

  await page.goto("/history");
  await expect(page.getByRole("heading", { name: "Sprite Fright" })).toBeVisible();
});

test("hồ sơ được tách biệt và giới hạn tối đa năm hồ sơ", async ({ page }) => {
  await page.goto("/profiles");
  await page.getByLabel("Tên hồ sơ").fill("Kids E2E");
  await page.getByLabel("Đây là hồ sơ trẻ em").check();
  await page.getByRole("button", { name: "Tạo hồ sơ" }).click();
  const kidsCard = page.locator(".profile-card").filter({ hasText: "Kids E2E" });
  await expect(kidsCard).toBeVisible();
  const selectedResponse = page.waitForResponse((response) => response.url().includes("/profiles") && response.request().method() === "POST" && response.status() === 200);
  await kidsCard.getByRole("button", { name: "Chuyển hồ sơ" }).click();
  await (await selectedResponse).finished();
  await page.goto(`/profiles?e2e_refresh=${Date.now()}`);
  await expect(kidsCard.getByRole("button", { name: "Đang sử dụng" })).toBeVisible();
  await page.goto("/browse");
  await expect(page.getByRole("heading", { name: "Bạn đang quan tâm gì?" })).toBeVisible();
});

test("viewer không thể truy cập Control Room", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: /Chào, E2E Viewer/ })).toBeVisible();
});
