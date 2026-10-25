import { afterEach, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { getDb, resetDbForTests } from "@/storage/database";
import { attachMedia, createProfile, saveEvent } from "@/storage/repository";
import { createBackup, importBackup, readBackup } from "./backup";
import { decryptBackup, encryptBackup } from "./encrypted-backup";
import { createReadingMarkdown, reviewableEvents } from "./markdown";

afterEach(async () => {
  await getDb().delete();
  resetDbForTests();
});

async function seed() {
  const profile = await createProfile({ displayName: "虚构人物", bioMarkdown: "这是私人传记" });
  const publicEvent = await saveEvent(profile.id, {
    title: "公开回顾的毕业", category: "education", startDate: { precision: "year", iso: "2018" },
    summaryMarkdown: "这是一段可分享的回忆", tags: [], visibility: "export-review",
  });
  const privateEvent = await saveEvent(profile.id, {
    title: "私密家庭记录", category: "family", startDate: { precision: "unknown" },
    summaryMarkdown: "不能泄露的内容", tags: [], visibility: "private",
  });
  return { profile, publicEvent, privateEvent };
}

describe("private ZIP backup and safe readable export", () => {
  it("restores a validated full ZIP after authenticated envelope decryption", async () => {
    await seed();
    const protectedFile = await encryptBackup(await createBackup(), "fictional-backup-passphrase");
    const snapshot = await readBackup(await decryptBackup(protectedFile, "fictional-backup-passphrase"));
    expect(snapshot.events).toHaveLength(2);
    expect(snapshot.events.some((item) => item.title === "私密家庭记录")).toBe(true);
  });

  it("backs up, validates, and restores every event without overwriting existing records", async () => {
    await seed();
    const blob = await createBackup();
    const snapshot = await readBackup(new File([blob], "test-backup.zip", { type: "application/zip" }));
    expect(snapshot.profiles).toHaveLength(1);
    expect(snapshot.events).toHaveLength(2);

    await expect(importBackup(snapshot)).rejects.toThrow("未覆盖任何数据");
    expect(await getDb().events.count()).toBe(2);
    await getDb().delete();
    resetDbForTests();
    await importBackup(snapshot);
    expect(await getDb().profiles.count()).toBe(1);
    expect(await getDb().events.count()).toBe(2);
  });

  it("rejects a tampered data file before any database write", async () => {
    await seed();
    const zip = await JSZip.loadAsync(await createBackup());
    zip.file("data/profiles.json", "[]");
    const forged = await zip.generateAsync({ type: "blob" });
    await expect(readBackup(new File([forged], "tampered.zip"))).rejects.toThrow("完整性校验失败");
  });

  it("round-trips a real binary attachment with matching SHA-256", async () => {
    const { profile, publicEvent } = await seed();
    const media = await attachMedia(profile.id, publicEvent.id, new File(["Example attachment only"], "letter.txt", { type: "text/plain" }));
    const snapshot = await readBackup(new File([await createBackup()], "with-media.zip"));
    expect(snapshot.media).toHaveLength(1);
    expect(snapshot.media[0].sha256).toBe(media.sha256);
    expect(await snapshot.media[0].blob.text()).toBe("Example attachment only");

    await getDb().delete();
    resetDbForTests();
    await importBackup(snapshot);
    expect((await getDb().events.get(publicEvent.id))?.mediaIds).toEqual([media.id]);
    expect(await getDb().media.count()).toBe(1);
  });

  it("excludes private records and all attachments from reading exports", async () => {
    const { profile } = await seed();
    const events = await getDb().events.toArray();
    expect(reviewableEvents(events)).toHaveLength(1);
    const markdown = createReadingMarkdown(profile, events);
    expect(markdown).toContain("公开回顾的毕业");
    expect(markdown).not.toContain("私密家庭记录");
    expect(markdown).not.toContain("不能泄露的内容");
    expect(markdown).not.toContain("这是私人传记");
  });
});
