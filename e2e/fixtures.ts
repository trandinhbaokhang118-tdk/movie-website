import { expect, test as base } from "@playwright/test";

export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await use(errors);
    expect(errors, "Trang không được phát sinh console error hoặc page error").toEqual([]);
  }, { auto: true }],
});

export { expect };
