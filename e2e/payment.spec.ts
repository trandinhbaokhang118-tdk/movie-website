import { expect, test } from "./fixtures";
import { login } from "./helpers";

test("VietQR invoice is settled exactly once by an authenticated SePay webhook", async ({ page }) => {
  await login(page, "viewer", "/plans");

  const moonPlan = page.locator(".plan-card").filter({ has: page.getByRole("heading", { name: "Moon", exact: true }) });
  await moonPlan.getByRole("button", { name: "Tạo QR thanh toán" }).click();
  await expect(page).toHaveURL(/\/checkout\/[a-f0-9-]+$/);

  const transferContent = (await page.locator(".payment-transfer-code strong").textContent())?.trim();
  expect(transferContent).toMatch(/^CW[A-Z0-9]{10}$/);
  const qrSource = await page.locator(".payment-qr-image img").getAttribute("src");
  expect(qrSource).toContain("https://img.vietqr.io/image/ACB-36345057-compact2.png");
  expect(qrSource).toContain("amount=79000");
  expect(qrSource).toContain(`addInfo=${transferContent}`);

  const webhook = {
    id: 202607210001,
    gateway: "ACB",
    transactionDate: "2026-07-21 12:00:00",
    accountNumber: "36345057",
    code: transferContent,
    content: `Thanh toan ${transferContent}`,
    transferType: "in",
    transferAmount: 79000,
    referenceCode: "ACB-E2E-202607210001",
  };
  const headers = { authorization: "Apikey sepay-e2e-secret" };
  const firstResponse = await page.request.post("/api/webhooks/sepay", { headers, data: webhook });
  expect(firstResponse.status()).toBe(200);
  expect(await firstResponse.json()).toMatchObject({ success: true, outcome: "paid" });

  const duplicateResponse = await page.request.post("/api/webhooks/sepay", { headers, data: webhook });
  expect(duplicateResponse.status()).toBe(200);
  expect(await duplicateResponse.json()).toMatchObject({ success: true, outcome: "duplicate" });

  await page.reload();
  await expect(page.getByText("THANH TOÁN THÀNH CÔNG")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đêm phim đã được mở khóa." })).toBeVisible();
});
