import { expect, test } from "./fixtures";
import { blockImages, login } from "./helpers";

test.beforeEach(async ({ context }) => blockImages(context));

test("admin CRUD, xuất bản/ẩn nội dung, quản lý user và audit", async ({ page }) => {
  await login(page, "admin", "/admin");
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
  await page.goto("/admin/content");

  const create = page.locator(".admin-create-v2");
  await create.getByLabel("Tên hiển thị").fill("E2E Midnight Film");
  await create.getByLabel("Tên gốc").fill("E2E Midnight Film");
  await create.getByLabel("Năm phát hành").fill("2026");
  await create.getByLabel("Thể loại").fill("Hoạt hình, Kiểm thử");
  await create.getByLabel("Thời lượng").fill("10 phút");
  await create.getByLabel("Poster URL").fill("https://archive.org/download/sprite-fright-2021/__ia_thumb.jpg");
  await create.getByLabel("Media URL").fill("/media/sprite-fright-2021.mp4");
  await create.getByLabel("Tên giấy phép").fill("Creative Commons Attribution 4.0");
  await create.getByLabel("URL giấy phép").fill("https://creativecommons.org/licenses/by/4.0/");
  await create.getByLabel("Mô tả").fill("Nội dung kiểm thử E2E cho workflow xuất bản CineWave.");
  await create.getByRole("button", { name: "Lưu bản nháp phim" }).click();

  const title = page.locator(".managed-title-v2").filter({ hasText: "E2E Midnight Film" });
  await expect(title).toContainText("Bản nháp");
  const publishedResponse = page.waitForResponse((response) => response.url().includes("/admin") && response.request().method() === "POST" && response.status() === 200);
  await title.getByRole("button", { name: "Xuất bản" }).click();
  await (await publishedResponse).finished();
  await page.goto(`/admin/content?e2e_refresh=${Date.now()}`);
  await expect(title).toContainText("Đã xuất bản");

  await page.goto("/search?q=E2E+Midnight+Film");
  await page.getByRole("link", { name: /E2E Midnight Film/ }).click();
  await expect(page.getByRole("heading", { name: "E2E Midnight Film", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Xem phim/ })).toBeVisible();

  await page.goto(`/admin/accounts?e2e_refresh=${Date.now()}`);
  const account = page.locator(".admin-table-row").filter({ hasText: "user.e2e@cinewave.local" });
  const locked = page.waitForResponse((response) => response.url().includes("/admin") && response.request().method() === "POST" && response.status() === 200);
  await account.getByRole("button", { name: "Khóa" }).click();
  await (await locked).finished();
  await page.goto(`/admin/accounts?e2e_refresh=${Date.now()}`);
  await expect(account).toContainText("locked");
  const unlocked = page.waitForResponse((response) => response.url().includes("/admin") && response.request().method() === "POST" && response.status() === 200);
  await account.getByRole("button", { name: "Mở khóa" }).click();
  await (await unlocked).finished();
  await page.goto("/admin/accounts");
  await expect(account).toContainText("active");

  await page.goto("/admin/content");
  const managed = page.locator(".managed-title-v2").filter({ hasText: "E2E Midnight Film" });
  const hidden = page.waitForResponse((response) => response.url().includes("/admin") && response.request().method() === "POST" && response.status() === 200);
  await managed.getByRole("button", { name: "Ẩn phim" }).click();
  await (await hidden).finished();
  await page.goto(`/admin/content?e2e_refresh=${Date.now()}`);
  await expect(managed).toContainText("Đã ẩn");
  await managed.getByLabel(/Nhập DELETE/).fill("DELETE");
  const deleted = page.waitForResponse((response) => response.url().includes("/admin") && response.request().method() === "POST" && response.status() === 200);
  await managed.getByRole("button", { name: "Xóa vĩnh viễn" }).click();
  await (await deleted).finished();
  await page.goto(`/admin/configuration?e2e_refresh=${Date.now()}`);
  await expect(managed).toHaveCount(0);
  await expect(page.locator(".audit-list-v2")).toContainText("content.deleted");
  await expect(page.locator(".audit-list-v2")).toContainText("account.locked");

  await page.goto("/admin/analytics");
  await expect(page.getByText("Podcast đã đăng", { exact: true })).toBeVisible();
  await expect(page.locator(".publish-legend span").filter({ hasText: "Podcast" })).toContainText("0/0");
});
