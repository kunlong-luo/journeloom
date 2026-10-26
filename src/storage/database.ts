import Dexie, { type EntityTable } from "dexie";
import type { LifeEvent, MediaRecord, PersonRef, Profile } from "@/domain/models";

export type JourneloomDb = Dexie & {
  profiles: EntityTable<Profile, "id">;
  events: EntityTable<LifeEvent, "id">;
  media: EntityTable<MediaRecord, "id">;
  people: EntityTable<PersonRef, "id">;
};

/** Never instantiate a browser database during Next.js server rendering. */
let clientDb: JourneloomDb | undefined;

export function getDb(): JourneloomDb {
  if (typeof indexedDB === "undefined") throw new Error("当前浏览器不支持 IndexedDB，本地档案无法打开。");
  if (!clientDb) {
    const db = new Dexie("journeloom-local") as JourneloomDb;
    db.version(1).stores({
      profiles: "id, updatedAt",
      events: "id, profileId, [profileId+updatedAt], deletedAt",
      media: "id, profileId, eventId",
    });
    // Add-only schema upgrade: v1 profiles, events and attachments remain intact.
    db.version(2).stores({
      profiles: "id, updatedAt",
      events: "id, profileId, [profileId+updatedAt], deletedAt",
      media: "id, profileId, eventId",
      people: "id, profileId, [profileId+updatedAt]",
    });
    clientDb = db;
  }
  return clientDb;
}

/** Test-only: reset the singleton between fake IndexedDB fixtures. */
export function resetDbForTests() {
  clientDb?.close();
  clientDb = undefined;
}
