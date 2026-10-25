import type { DatePrecision, LifeDate, LifeEvent } from "./models";

const patterns: Record<"year" | "month" | "day", RegExp> = {
  year: /^\d{4}$/,
  month: /^\d{4}-(0[1-9]|1[0-2])$/,
  day: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
};

function validCalendarDay(iso: string): boolean {
  const [year, month, day] = iso.split("-").map(Number);
  const candidate = new Date(0);
  candidate.setUTCHours(0, 0, 0, 0);
  candidate.setUTCFullYear(year, month - 1, day);
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
}

export function validateLifeDate(date: LifeDate): string | null {
  if (date.precision === "unknown") {
    return date.iso || date.earliest || date.latest ? "未知日期不能包含精确日期" : null;
  }
  if (date.precision === "approximate") {
    return date.originalText?.trim() ? null : "请描述大致时间，例如：高中毕业后的夏天";
  }
  const iso = date.iso ?? "";
  if (!patterns[date.precision].test(iso)) return "日期与精度不匹配";
  if (date.precision === "day" && !validCalendarDay(iso)) return "日期不是有效的日历日期";
  return null;
}

export function toLifeDate(precision: DatePrecision, value: string): LifeDate {
  if (precision === "unknown") return { precision };
  if (precision === "approximate") return { precision, originalText: value.trim() };
  return { precision, iso: value };
}

export function formatLifeDate(date: LifeDate, locale: "zh" | "en" = "zh"): string {
  if (date.precision === "unknown") return locale === "zh" ? "时间未知" : "Date unknown";
  if (date.precision === "approximate") return date.originalText?.trim() || (locale === "zh" ? "大致时间" : "Approximate date");
  const [year, month, day] = (date.iso ?? "").split("-");
  if (locale === "en") {
    if (date.precision === "year") return year;
    if (date.precision === "month") return `${year}-${month}`;
    return `${year}-${month}-${day}`;
  }
  if (date.precision === "year") return `${year} 年`;
  if (date.precision === "month") return `${year} 年 ${Number(month)} 月`;
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

/** Unknown dates sort last; approximate events may supply an earliest bound. */
export function lifeDateSortKey(date: LifeDate): string {
  if (date.precision === "unknown") return "0000-00-00";
  if (date.precision === "approximate") return date.earliest?.slice(0, 10).padEnd(10, "0") ?? "0000-00-00";
  return (date.iso ?? "").padEnd(10, "0");
}

export function newestFirst(a: LifeEvent, b: LifeEvent): number {
  return lifeDateSortKey(b.startDate).localeCompare(lifeDateSortKey(a.startDate)) || b.createdAt.localeCompare(a.createdAt);
}
