import JSZip from "jszip";
import { z } from "zod";
import { eventSchema, mediaMetaSchema, profileSchema, type LifeEvent, type MediaRecord, type Profile } from "@/domain/models";
import { validateLifeDate } from "@/domain/life-date";
import { getDb } from "@/storage/database";
import { sha256Hex } from "@/storage/repository";

const FORMAT_VERSION = 1;
const MAX_ARCHIVE_BYTES = 100_000_000;
const MAX_CONTENT_BYTES = 80_000_000;
const MAX_METADATA_BYTES = 5_000_000;
const MAX_MEDIA_BYTES = 10_000_000;
const encoder = new TextEncoder();

const entrySchema = z.object({
  path: z.string(),
  sizeBytes: z.number().int().min(0),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
const manifestSchema = z.object({
  formatVersion: z.literal(FORMAT_VERSION),
  appVersion: z.string(),
  createdAt: z.iso.datetime(),
  counts: z.object({ profiles: z.number().int().min(0), events: z.number().int().min(0), media: z.number().int().min(0) }).strict(),
  files: z.array(entrySchema).max(503),
}).strict();

export type BackupSnapshot = {
  profiles: Profile[];
  events: LifeEvent[];
  media: MediaRecord[];
  createdAt: string;
};

export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupError";
  }
}

function ensureValidRelations(snapshot: BackupSnapshot) {
  const profileIds = new Set(snapshot.profiles.map((profile) => profile.id));
  const eventIds = new Set(snapshot.events.map((event) => event.id));
  const mediaIds = new Set(snapshot.media.map((media) => media.id));
  if (profileIds.size !== snapshot.profiles.length || eventIds.size !== snapshot.events.length || mediaIds.size !== snapshot.media.length) {
    throw new BackupError("备份包含重复的记录 ID");
  }
  for (const event of snapshot.events) {
    if (!profileIds.has(event.profileId)) throw new BackupError("事件引用了不存在的档案");
    if (event.mediaIds.some((id) => !mediaIds.has(id))) throw new BackupError("事件引用了缺失的附件");
    if (validateLifeDate(event.startDate) || (event.endDate && validateLifeDate(event.endDate))) throw new BackupError("备份中有无效的事件日期");
  }
  if (snapshot.profiles.some((profile) => profile.birthDate && validateLifeDate(profile.birthDate))) throw new BackupError("备份中有无效的出生日期");
  for (const media of snapshot.media) {
    const event = snapshot.events.find((item) => item.id === media.eventId);
    if (!event || event.profileId !== media.profileId || !event.mediaIds.includes(media.id)) {
      throw new BackupError("附件与事件的关联不一致");
    }
  }
}

function ensureWithinLimit(bytes: number, max: number, label: string) {
  if (bytes > max) throw new BackupError(`${label}超过安全大小限制`);
}

/** JSZip exposes the ZIP header's uncompressed size on its internal compressed object.
 * Reject missing/oversized metadata before allocating the decompressed bytes.
 * Post-decompression byte count and SHA-256 are checked separately as well. */
function assertDecompressionLimit(entry: JSZip.JSZipObject, max: number) {
  const compressed = entry as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } };
  const size = compressed._data?.uncompressedSize;
  if (!Number.isSafeInteger(size) || size === undefined || size < 0 || size > max) {
    throw new BackupError(`压缩包条目大小异常：${entry.name}`);
  }
  const originalName = (entry as JSZip.JSZipObject & { unsafeOriginalName?: string }).unsafeOriginalName;
  if (originalName && originalName !== entry.name) throw new BackupError("备份包含不安全的文件路径");
}

export async function createBackup(): Promise<Blob> {
  const db = getDb();
  const [profiles, events, media] = await Promise.all([
    db.profiles.toArray(), db.events.toArray(), db.media.toArray(),
  ]);
  const snapshot: BackupSnapshot = { profiles, events, media, createdAt: new Date().toISOString() };
  ensureValidRelations(snapshot);

  const zip = new JSZip();
  const entries: z.infer<typeof entrySchema>[] = [];
  let bytesTotal = 0;

  async function add(path: string, bytes: Uint8Array<ArrayBuffer>) {
    bytesTotal += bytes.byteLength;
    ensureWithinLimit(bytesTotal, MAX_CONTENT_BYTES, "档案数据");
    entries.push({ path, sizeBytes: bytes.byteLength, sha256: await sha256Hex(bytes.buffer) });
    zip.file(path, bytes, { createFolders: false });
  }

  for (const [name, data] of [
    ["profiles", profiles], ["events", events],
    ["media", media.map(({ blob: _blob, ...meta }) => { void _blob; return meta; })],
  ] as const) {
    const text = JSON.stringify(data, null, 2);
    const bytes = encoder.encode(text);
    ensureWithinLimit(bytes.byteLength, MAX_METADATA_BYTES, "元数据");
    await add(`data/${name}.json`, bytes);
  }

  for (const record of media) {
    const bytes = new Uint8Array(await record.blob.arrayBuffer());
    ensureWithinLimit(bytes.byteLength, MAX_MEDIA_BYTES, "单个附件");
    if ((await sha256Hex(bytes.buffer)) !== record.sha256) throw new BackupError(`附件校验失败：${record.id}`);
    await add(`media/${record.id}.bin`, bytes);
  }

  zip.file("manifest.json", JSON.stringify(manifestSchema.parse({
    formatVersion: FORMAT_VERSION,
    appVersion: "0.1.0",
    createdAt: snapshot.createdAt,
    counts: { profiles: profiles.length, events: events.length, media: media.length },
    files: entries,
  }), null, 2), { createFolders: false });

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 5 } });
  ensureWithinLimit(blob.size, MAX_ARCHIVE_BYTES, "压缩包");
  return blob;
}

async function readJson<T>(zip: JSZip, path: string, schema: z.ZodType<T>): Promise<T> {
  const data = await zip.file(path)?.async("string");
  if (data === undefined) throw new BackupError(`缺少 ${path}`);
  try {
    return schema.parse(JSON.parse(data));
  } catch {
    throw new BackupError(`${path} 内容格式不正确`);
  }
}

export async function readBackup(file: File): Promise<BackupSnapshot> {
  ensureWithinLimit(file.size, MAX_ARCHIVE_BYTES, "压缩包");
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(file); }
  catch { throw new BackupError("不是有效的 ZIP 备份文件"); }

  const files = Object.values(zip.files).filter((entry) => !entry.dir);
  if (files.length > 504) throw new BackupError("备份条目数量异常");
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) throw new BackupError("缺少 manifest.json");
  assertDecompressionLimit(manifestFile, 1_000_000);
  const manifest = await readJson(zip, "manifest.json", manifestSchema);
  const allowedFiles = new Set(["manifest.json", ...manifest.files.map((entry) => entry.path)]);
  if (allowedFiles.size !== files.length || files.some((entry) => !allowedFiles.has(entry.name))) {
    throw new BackupError("备份包含未知或重复文件");
  }
  const expectedDataPaths = ["data/profiles.json", "data/events.json", "data/media.json"];
  if (expectedDataPaths.some((path) => !allowedFiles.has(path))) throw new BackupError("缺少必要的数据文件");

  let bytesTotal = 0;
  for (const entry of manifest.files) {
    if (!expectedDataPaths.includes(entry.path) && !/^media\/[0-9a-f-]{36}\.bin$/.test(entry.path)) {
      throw new BackupError("备份包含非法文件路径");
    }
    const zipFile = zip.file(entry.path);
    if (!zipFile) throw new BackupError(`缺少 ${entry.path}`);
    const max = entry.path.startsWith("media/") ? MAX_MEDIA_BYTES : MAX_METADATA_BYTES;
    ensureWithinLimit(entry.sizeBytes, max, "文件");
    assertDecompressionLimit(zipFile, max);
    bytesTotal += entry.sizeBytes;
    ensureWithinLimit(bytesTotal, MAX_CONTENT_BYTES, "备份数据");
    const actual = await zipFile.async("uint8array");
    if (actual.byteLength !== entry.sizeBytes || (await sha256Hex(actual.buffer as ArrayBuffer)) !== entry.sha256) {
      throw new BackupError(`文件完整性校验失败：${entry.path}`);
    }
  }

  const profiles = await readJson(zip, "data/profiles.json", z.array(profileSchema));
  const events = await readJson(zip, "data/events.json", z.array(eventSchema));
  const metas = await readJson(zip, "data/media.json", z.array(mediaMetaSchema));
  if (profiles.length !== manifest.counts.profiles || events.length !== manifest.counts.events || metas.length !== manifest.counts.media) {
    throw new BackupError("备份记录数量与清单不一致");
  }
  const media: MediaRecord[] = [];
  for (const meta of metas) {
    const bytes = await zip.file(`media/${meta.id}.bin`)?.async("uint8array");
    if (!bytes || bytes.byteLength !== meta.sizeBytes || (await sha256Hex(bytes.buffer as ArrayBuffer)) !== meta.sha256) {
      throw new BackupError(`附件损坏：${meta.id}`);
    }
    media.push({ ...meta, blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: meta.mimeType }) });
  }
  const snapshot = { profiles, events, media, createdAt: manifest.createdAt };
  ensureValidRelations(snapshot);
  return snapshot;
}

/** Add-only and atomic: existing records are never overwritten or deleted. */
export async function importBackup(snapshot: BackupSnapshot): Promise<void> {
  ensureValidRelations(snapshot);
  const db = getDb();
  await db.transaction("rw", db.profiles, db.events, db.media, async () => {
    for (const profile of snapshot.profiles) {
      if (await db.profiles.get(profile.id)) throw new BackupError("检测到已存在的档案，未覆盖任何数据。请在新浏览器档案中恢复。");
    }
    for (const event of snapshot.events) {
      if (await db.events.get(event.id)) throw new BackupError("检测到重复的事件 ID，已取消恢复。");
    }
    for (const media of snapshot.media) {
      if (await db.media.get(media.id)) throw new BackupError("检测到重复的附件 ID，已取消恢复。");
    }
    await db.profiles.bulkAdd(snapshot.profiles);
    await db.events.bulkAdd(snapshot.events);
    await db.media.bulkAdd(snapshot.media);
  });
}
