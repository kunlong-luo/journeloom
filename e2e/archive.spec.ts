import { expect, test } from "@playwright/test";

async function createSampleProfileAndEvent(page: import("@playwright/test").Page) {
  await page.goto("/archive/");
  await page.getByRole("button", { name: "创建第一份档案" }).click();
  const profileDialog = page.getByRole("dialog");
  await expect(profileDialog).toBeVisible({ timeout: 8_000 });
  await profileDialog.getByRole("textbox", { name: /档案名称/ }).fill("我的测试档案");
  await profileDialog.getByRole("button", { name: "创建档案" }).click();
  await expect(page.getByRole("heading", { name: "我的测试档案" })).toBeVisible();

  await page.getByRole("button", { name: "记录新事件" }).click();
  const eventDialog = page.getByRole("dialog");
  await eventDialog.getByRole("textbox", { name: "事件标题" }).fill("一段值得保存的旅行");
  await eventDialog.getByRole("textbox", { name: /故事正文/ }).fill("一段虚构的真实体验测试内容");
  await eventDialog.getByRole("button", { name: "记录这个时刻" }).click();
  await expect(page.getByRole("heading", { name: "一段值得保存的旅行" })).toBeVisible();
}

test("profiles and events survive refresh, and deleted events can be restored", async ({ page }) => {
  await createSampleProfileAndEvent(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "我的测试档案" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "一段值得保存的旅行" })).toBeVisible();

  await page.getByRole("button", { name: "编辑 一段值得保存的旅行" }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByRole("combobox", { name: "日期精度" }).first().selectOption("year");
  await editDialog.getByRole("spinbutton", { name: "发生时间日期" }).fill("2018");
  await editDialog.getByRole("button", { name: "保存修改" }).click();
  await expect(page.getByText("2018 年")).toBeVisible();

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "删除 一段值得保存的旅行" }).click();
  await page.getByRole("checkbox", { name: /查看已删除事件/ }).check();
  await expect(page.getByRole("heading", { name: "一段值得保存的旅行" })).toBeVisible();
  await page.getByRole("button", { name: "恢复 一段值得保存的旅行" }).click();
  await page.getByRole("checkbox", { name: /查看已删除事件/ }).uncheck();
  await expect(page.getByRole("heading", { name: "一段值得保存的旅行" })).toBeVisible();
});

test("private ZIP can be previewed and restored in a fresh browser context", async ({ page, browser }) => {
  await createSampleProfileAndEvent(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "完整私人备份" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
  const path = await download.path();
  expect(path).not.toBeNull();

  const cleanContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  const cleanPage = await cleanContext.newPage();
  try {
    await cleanPage.goto("/archive/");
    const fs = await import("node:fs/promises");
    await cleanPage.getByRole("button", { name: "验证并恢复 ZIP" }).click();
    await cleanPage.locator('input[type="file"][aria-label="选择 Journeloom ZIP 备份"]').setInputFiles({
      name: "test-backup.zip", mimeType: "application/zip", buffer: await fs.readFile(path!),
    });
    await expect(cleanPage.getByText(/恢复前预览/)).toBeVisible();
    await cleanPage.getByRole("button", { name: "确认恢复" }).click();
    await expect(cleanPage.getByRole("heading", { name: "我的测试档案" })).toBeVisible();
    await expect(cleanPage.getByRole("heading", { name: "一段值得保存的旅行" })).toBeVisible();
  } finally {
    await cleanContext.close();
  }
});

test("attachments stay local and public reading export requires explicit approval", async ({ page }) => {
  await createSampleProfileAndEvent(page);
  await page.locator('input[type="file"][aria-label="为 一段值得保存的旅行 添加附件"]').setInputFiles({
    name: "fictional-note.txt", mimeType: "text/plain", buffer: Buffer.from("Illustrative file only"),
  });
  await expect(page.getByRole("button", { name: "fictional-note.txt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "阅读版 Markdown" })).toBeDisabled();

  await page.getByRole("button", { name: "编辑 一段值得保存的旅行" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "导出可见性" }).selectOption("export-review");
  await dialog.getByRole("button", { name: "保存修改" }).click();
  await page.getByRole("button", { name: "阅读版 Markdown" }).click();
  await expect(page.getByRole("heading", { name: "阅读导出隐私审核" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "已审核，下载 Markdown" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.md$/);
  const bytes = await (await import("node:fs/promises")).readFile((await download.path())!);
  const text = bytes.toString("utf8");
  expect(text).toContain("一段值得保存的旅行");
  expect(text).not.toContain("fictional-note.txt");
});
