import { eventSchema, mediaMetaSchema, profileSchema, type EventInput, type LifeEvent, type MediaMeta, type MediaRecord, type Profile, type ProfileInput } from "@/domain/models";
import { validateLifeDate } from "@/domain/life-date";
import { getDb } from "./database";

function requireValidDate(date: EventInput["startDate"] | undefined): void {
  if (!date) return;
  const error = validateLifeDate(date);
  if (error) throw new Error(error);
}

export async function createProfile(input: ProfileInput): Promise<Profile> {
  requireValidDate(input.birthDate);
  const now = new Date().toISOString();
  const profile = profileSchema.parse({
    ...input,
    displayName: input.displayName.trim(),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  await getDb().profiles.add(profile);
  return profile;
}

export async function updateProfile(id: string, input: ProfileInput): Promise<void> {
  requireValidDate(input.birthDate);
  const db = getDb();
  const previous = await db.profiles.get(id);
  if (!previous) throw new Error("档案不存在");
  await db.profiles.put(profileSchema.parse({ ...previous, ...input, displayName: input.displayName.trim(), updatedAt: new Date().toISOString() }));
}

export async function deleteProfile(id: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.profiles, db.events, db.media, async () => {
    await db.media.where("profileId").equals(id).delete();
    await db.events.where("profileId").equals(id).delete();
    await db.profiles.delete(id);
  });
}

export async function saveEvent(profileId: string, input: EventInput, id?: string): Promise<LifeEvent> {
  requireValidDate(input.startDate);
  requireValidDate(input.endDate);
  const db = getDb();
  const profile = await db.profiles.get(profileId);
  if (!profile) throw new Error("无法找到所属档案");

  const previous = id ? await db.events.get(id) : undefined;
  if (id && (!previous || previous.profileId !== profileId || previous.deletedAt)) throw new Error("事件不存在或已删除");
  const now = new Date().toISOString();
  const event = eventSchema.parse({
    ...previous,
    ...input,
    id: previous?.id ?? crypto.randomUUID(),
    profileId,
    title: input.title.trim(),
    tags: [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))],
    participantIds: previous?.participantIds ?? [],
    mediaIds: previous?.mediaIds ?? [],
    sourceIds: previous?.sourceIds ?? [],
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  });
  await db.events.put(event);
  return event;
}

export async function softDeleteEvent(id: string): Promise<void> {
  await getDb().events.update(id, { deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}

export async function restoreEvent(id: string): Promise<void> {
  const event = await getDb().events.get(id);
  if (event?.deletedAt) {
    const { deletedAt: _removed, ...rest } = event;
    void _removed;
    await getDb().events.put({ ...rest, updatedAt: new Date().toISOString() });
  }
}

const mediaKinds: Record<string, MediaMeta["kind"]> = {
  "image/png": "image", "image/jpeg": "image", "image/webp": "image", "image/gif": "image",
  "audio/": "audio", "video/": "video", "application/pdf": "document", "text/plain": "document",
};

export function mediaKind(mimeType: string): MediaMeta["kind"] | null {
  for (const [prefix, kind] of Object.entries(mediaKinds)) {
    if (mimeType.startsWith(prefix)) return kind;
  }
  return null;
}

export function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  return crypto.subtle.digest("SHA-256", bytes).then((digest) =>
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""),
  );
}

export async function attachMedia(profileId: string, eventId: string, file: File): Promise<MediaRecord> {
  const kind = mediaKind(file.type);
  if (!kind) throw new Error("仅支持图片、音视频、PDF 和 TXT 文件");
  if (file.size > 10_000_000) throw new Error("单个附件不能超过 10 MB");
  if (!file.size) throw new Error("不能上传空文件");
  const db = getDb();
  const event = await db.events.get(eventId);
  if (!event || event.profileId !== profileId || event.deletedAt) throw new Error("事件不存在");

  const existingSizes = await db.media.where("profileId").equals(profileId).toArray();
  if (existingSizes.reduce((total, media) => total + media.sizeBytes, 0) + file.size > 80_000_000) {
    throw new Error("此档案附件已接近备份上限（80 MB），请先完整备份并整理附件");
  }

  const bytes = await file.arrayBuffer();
  const metadata = mediaMetaSchema.parse({
    id: crypto.randomUUID(), profileId, eventId, kind,
    originalFileName: file.name.slice(0, 255), mimeType: file.type,
    sizeBytes: bytes.byteLength, sha256: await sha256Hex(bytes),
    createdAt: new Date().toISOString(), visibility: "private",
  });
  const record: MediaRecord = { ...metadata, blob: new Blob([bytes], { type: file.type }) };
  await db.transaction("rw", db.events, db.media, async () => {
    const current = await db.events.get(eventId);
    if (!current || current.deletedAt || current.profileId !== profileId) throw new Error("事件已变更，请重新打开再尝试");
    await db.media.add(record);
    await db.events.update(eventId, { mediaIds: [...current.mediaIds, record.id], updatedAt: new Date().toISOString() });
  });
  return record;
}

export async function removeMedia(eventId: string, mediaId: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.events, db.media, async () => {
    const event = await db.events.get(eventId);
    const media = await db.media.get(mediaId);
    if (!event || !media || media.eventId !== eventId || !event.mediaIds.includes(mediaId)) throw new Error("附件不存在");
    await db.events.update(eventId, { mediaIds: event.mediaIds.filter((id) => id !== mediaId), updatedAt: new Date().toISOString() });
    await db.media.delete(mediaId);
  });
}
