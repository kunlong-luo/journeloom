import { expect, test } from "@playwright/test";

test("landing page is interactive and clearly labeled as a preview", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/下方时间轴是虚构示例/)).toBeVisible();

  await page.getByRole("group", { name: "筛选事件类别" }).getByRole("button", { name: "重要时刻" }).click();
  await expect(page.getByText("毕业，也是一次出发")).toBeVisible();
  await expect(page.getByText("写给未来的第一封信")).toHaveCount(0);

  if (test.info().project.name === "mobile-chromium") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page.getByRole("heading", { name: "A life is more than a résumé." })).toBeVisible();
});

test("no life data is transmitted or created on first visit", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:3000/")) externalRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByText(/不会保存到本地数据库/)).toBeVisible();
  expect(externalRequests).toEqual([]);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});
