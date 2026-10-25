import type { LifeEvent, Profile } from "@/domain/models";
import { formatLifeDate, newestFirst } from "@/domain/life-date";

/** Readable export is intentionally a subset of the private full ZIP backup. */
export function reviewableEvents(events: LifeEvent[]): LifeEvent[] {
  return events.filter((event) => !event.deletedAt && event.visibility !== "private").sort(newestFirst);
}

export function createReadingMarkdown(profile: Profile, approvedEvents: LifeEvent[]): string {
  const safe = reviewableEvents(approvedEvents).filter((event) => event.profileId === profile.id);
  const lines = [
    `# ${profile.displayName} · 人生故事`,
    "",
    "> 此文档由 Journeloom 经人工隐私审核后导出。未包含私人附件、原始来源和未授权事件。",
    "",
  ];
  for (const event of safe) {
    lines.push(`## ${event.title}`, "", `时间：${formatLifeDate(event.startDate)}`);
    if (event.endDate) lines.push(`至：${formatLifeDate(event.endDate)}`);
    if (event.locationLabel) lines.push(`地点：${event.locationLabel}`);
    lines.push("", event.summaryMarkdown, "");
    if (event.reflectionMarkdown) lines.push("### 感受与反思", "", event.reflectionMarkdown, "");
  }
  return lines.join("\n");
}
