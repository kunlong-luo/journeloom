import { afterEach, describe, expect, it } from "vitest";
import { getDb, resetDbForTests } from "./database";
import { attachMedia, createProfile, mediaKind, restoreEvent, saveEvent, softDeleteEvent } from "./repository";

afterEach(async () => {
  await getDb().delete();
  resetDbForTests();
});

describe("local-first repository", () => {
  it("persists a profile and precise or uncertain event without backend calls", async () => {
    const profile = await createProfile({ displayName: "示例人物", bioMarkdown: "只用于测试" });
    const event = await saveEvent(profile.id, {
      title: "毕业", category: "education", startDate: { precision: "year", iso: "2018" },
      summaryMarkdown: "记得夏天的风", tags: ["学校", "学校"], visibility: "private",
    });
    expect(event.tags).toEqual(["学校"]);
    expect((await getDb().events.get(event.id))?.startDate).toEqual({ precision: "year", iso: "2018" });

    await softDeleteEvent(event.id);
    expect((await getDb().events.get(event.id))?.deletedAt).toBeDefined();
    await restoreEvent(event.id);
    expect((await getDb().events.get(event.id))?.deletedAt).toBeUndefined();
  });

  it("rejects fabricated impossible dates before storage", async () => {
    const profile = await createProfile({ displayName: "测试", bioMarkdown: "" });
    await expect(saveEvent(profile.id, {
      title: "不可能的一天", category: "other", startDate: { precision: "day", iso: "2023-02-29" },
      summaryMarkdown: "", tags: [], visibility: "private",
    })).rejects.toThrow("日历日期");
    expect(await getDb().events.count()).toBe(0);
    await expect(saveEvent(profile.id, {
      title: "倒置的时间", category: "other", startDate: { precision: "year", iso: "2025" }, endDate: { precision: "year", iso: "2018" },
      summaryMarkdown: "", tags: [], visibility: "private",
    })).rejects.toThrow("结束时间");
  });

  it("stores a local attachment with a digest and links it to its event", async () => {
    const profile = await createProfile({ displayName: "附件测试", bioMarkdown: "" });
    const event = await saveEvent(profile.id, {
      title: "保存一份文本", category: "other", startDate: { precision: "unknown" },
      summaryMarkdown: "", tags: [], visibility: "private",
    });
    const media = await attachMedia(profile.id, event.id, new File(["A fictional note"], "note.txt", { type: "text/plain" }));
    expect(media.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect((await getDb().events.get(event.id))?.mediaIds).toContain(media.id);
    expect(await getDb().media.count()).toBe(1);
    expect(mediaKind("image/svg+xml")).toBeNull();
  });
});
