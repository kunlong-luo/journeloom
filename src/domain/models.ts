import { z } from "zod";

export const datePrecisionSchema = z.enum(["day", "month", "year", "approximate", "unknown"]);
export type DatePrecision = z.infer<typeof datePrecisionSchema>;

export const lifeDateSchema = z.object({
  iso: z.string().optional(),
  precision: datePrecisionSchema,
  earliest: z.string().optional(),
  latest: z.string().optional(),
  originalText: z.string().max(300).optional(),
}).strict();
export type LifeDate = z.infer<typeof lifeDateSchema>;

export const visibilitySchema = z.enum(["private", "export-review", "public-approved"]);
export type Visibility = z.infer<typeof visibilitySchema>;

export const profileSchema = z.object({
  id: z.uuid(),
  displayName: z.string().trim().min(1).max(100),
  birthDate: lifeDateSchema.optional(),
  bioMarkdown: z.string().max(50000),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).strict();
export type Profile = z.infer<typeof profileSchema>;

export const personSchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  displayName: z.string().trim().min(1).max(100),
  relationship: z.string().trim().max(100).optional(),
  notesMarkdown: z.string().max(10000),
  isMinor: z.boolean(),
  visibility: visibilitySchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).strict();
export type PersonRef = z.infer<typeof personSchema>;
export type PersonInput = Pick<PersonRef, "displayName" | "relationship" | "notesMarkdown" | "isMinor">;

export const eventCategorySchema = z.enum(["family", "education", "career", "relationship", "travel", "health", "milestone", "other"]);
export type EventCategory = z.infer<typeof eventCategorySchema>;

export const eventSchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  title: z.string().trim().min(1).max(150),
  category: eventCategorySchema,
  startDate: lifeDateSchema,
  endDate: lifeDateSchema.optional(),
  locationLabel: z.string().max(200).optional(),
  summaryMarkdown: z.string().max(100000),
  reflectionMarkdown: z.string().max(50000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30),
  participantIds: z.array(z.uuid()),
  mediaIds: z.array(z.uuid()),
  sourceIds: z.array(z.uuid()),
  visibility: visibilitySchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().optional(),
}).strict();
export type LifeEvent = z.infer<typeof eventSchema>;

export const mediaMetaSchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  eventId: z.uuid(),
  kind: z.enum(["image", "audio", "video", "document"]),
  originalFileName: z.string().max(255),
  mimeType: z.string().max(100),
  sizeBytes: z.number().int().min(0).max(20_000_000),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.iso.datetime(),
  visibility: visibilitySchema,
}).strict();
export type MediaMeta = z.infer<typeof mediaMetaSchema>;
export type MediaRecord = MediaMeta & { blob: Blob };

export type ProfileInput = Pick<Profile, "displayName" | "bioMarkdown" | "birthDate">;
export type EventInput = Pick<LifeEvent, "title" | "category" | "startDate" | "endDate" | "locationLabel" | "summaryMarkdown" | "reflectionMarkdown" | "tags" | "visibility"> & { participantIds?: string[] };
