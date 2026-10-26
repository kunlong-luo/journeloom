import { afterEach, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { getDb, resetDbForTests } from "@/storage/database";
import { attachMedia, createProfile, saveEvent, savePerson } from "@/storage/repository";
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

  it("round-trips people and event links without exposing person details in reading exports", async () => {
    const { profile, publicEvent } = await seed();
    const person = await savePerson(profile.id, { displayName: "私密化名", relationship: "老朋友", notesMarkdown: "不要分享", isMinor: true });
    await saveEvent(profile.id, {
      title: publicEvent.title, category: publicEvent.category, startDate: publicEvent.startDate,
      summaryMarkdown: publicEvent.summaryMarkdown, tags: [], visibility: "export-review", participantIds: [person.id],
    }, publicEvent.id);
    const markdown = createReadingMarkdown(profile, await getDb().events.toArray());
    expect(markdown).not.toContain(person.displayName);
    expect(markdown).not.toContain(person.notesMarkdown);
    const snapshot = await readBackup(new File([await createBackup()], "people.zip"));
    expect(snapshot.people).toHaveLength(1);
    expect(snapshot.events.find((item) => item.id === publicEvent.id)?.participantIds).toEqual([person.id]);
    await getDb().delete(); resetDbForTests();
    await importBackup(snapshot);
    expect((await getDb().people.get(person.id))?.isMinor).toBe(true);
    expect((await getDb().events.get(publicEvent.id))?.participantIds).toEqual([person.id]);
  });

  it("reads validated version 1 archives without people", async () => {
    await seed();
    const zip = await JSZip.loadAsync(await createBackup());
    const manifest = JSON.parse((await zip.file("manifest.json")!.async("string"))) as {
      formatVersion: number; counts: { profiles: number; events: number; media: number; people?: number };
      files: { path: string; sizeBytes: number; sha256: string }[];
    };
    manifest.formatVersion = 1;
    delete manifest.counts.people;
    manifest.files = manifest.files.filter((entry) => entry.path !== "data/people.json");
    zip.remove("data/people.json");
    zip.file("manifest.json", JSON.stringify(manifest));
    const legacy = new File([await zip.generateAsync({ type: "blob" })], "legacy.zip");
    const snapshot = await readBackup(legacy);
    expect(snapshot.people).toEqual([]);
    expect(snapshot.events).toHaveLength(2);
  });

  it("rejects invalid cross-profile person references before restoring anything", async () => {
    const { publicEvent } = await seed();
    const other = await createProfile({ displayName: "其他人的档案", bioMarkdown: "" });
    const person = await savePerson(other.id, { displayName: "另一个人的朋友", notesMarkdown: "", isMinor: false });
    const snapshot = await readBackup(new File([await createBackup()], "valid.zip"));
    const forged = { ...snapshot, events: snapshot.events.map((event) => event.id === publicEvent.id ? { ...event, participantIds: [person.id] } : event) };
    await getDb().delete(); resetDbForTests();
    await expect(importBackup(forged)).rejects.toThrow("跨档案");
    expect(await getDb().profiles.count()).toBe(0);
    expect(await getDb().events.count()).toBe(0);
  });
});
