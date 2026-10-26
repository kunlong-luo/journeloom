import { afterEach, describe, expect, it } from "vitest";
import { getDb, resetDbForTests } from "./database";
import Dexie from "dexie";
import { attachMedia, createProfile, deletePerson, deleteProfile, mediaKind, restoreEvent, saveEvent, savePerson, softDeleteEvent } from "./repository";

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

  it("migrates a populated v1 database to v2 without losing profiles or events", async () => {
    const legacy = new Dexie("journeloom-local");
    legacy.version(1).stores({ profiles: "id, updatedAt", events: "id, profileId, [profileId+updatedAt], deletedAt", media: "id, profileId, eventId" });
    const id = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();
    await legacy.table("profiles").add({ id, displayName: "旧档案", bioMarkdown: "", createdAt: now, updatedAt: now });
    await legacy.table("events").add({
      id: eventId, profileId: id, title: "旧回忆", category: "other", startDate: { precision: "unknown" }, summaryMarkdown: "已有内容",
      tags: [], participantIds: [], mediaIds: [], sourceIds: [], visibility: "private", createdAt: now, updatedAt: now,
    });
    legacy.close();
    const db = getDb();
    expect((await db.profiles.get(id))?.displayName).toBe("旧档案");
    expect((await db.events.get(eventId))?.summaryMarkdown).toBe("已有内容");
    expect(await db.people.count()).toBe(0);
    const person = await savePerson(id, { displayName: "旧友", notesMarkdown: "", isMinor: false });
    expect(person.profileId).toBe(id);
  });

  it("keeps person links scoped to a profile and cleans links on deletion", async () => {
    const owner = await createProfile({ displayName: "测试主角", bioMarkdown: "" });
    const other = await createProfile({ displayName: "其他档案", bioMarkdown: "" });
    const person = await savePerson(owner.id, { displayName: "一位朋友", relationship: "同学", notesMarkdown: "私人介绍", isMinor: true });
    const input = { title: "多年后相见", category: "relationship" as const, startDate: { precision: "unknown" as const }, summaryMarkdown: "一次聚会", tags: [], visibility: "private" as const };
    await expect(saveEvent(other.id, { ...input, participantIds: [person.id] })).rejects.toThrow("不属于当前档案");
    await expect(savePerson(other.id, { displayName: "改名", notesMarkdown: "", isMinor: false }, person.id)).rejects.toThrow("人物不属于当前档案");
    const event = await saveEvent(owner.id, { ...input, participantIds: [person.id] });
    await expect(saveEvent(owner.id, { ...input, participantIds: [person.id, person.id] }, event.id)).rejects.toThrow("不能重复");
    await softDeleteEvent(event.id);
    await deletePerson(owner.id, person.id);
    expect((await getDb().events.get(event.id))?.participantIds).toEqual([]);
    await restoreEvent(event.id);
    expect((await getDb().events.get(event.id))?.summaryMarkdown).toBe("一次聚会");
    const newPerson = await savePerson(owner.id, { displayName: "家人", notesMarkdown: "", isMinor: false });
    await deleteProfile(owner.id);
    expect(await getDb().people.get(newPerson.id)).toBeUndefined();
    expect(await getDb().profiles.get(other.id)).toBeDefined();
  });
});
