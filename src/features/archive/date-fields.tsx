"use client";

import type { LifeDate } from "@/domain/models";
import { toLifeDate } from "@/domain/life-date";

type Props = { label: string; value: LifeDate; onChange: (date: LifeDate) => void; optional?: boolean };

export function DateFields({ label, value, onChange, optional }: Props) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-semibold text-[var(--ink)]">{label}{optional ? "（可选）" : ""}</legend>
      <div className="grid gap-3 sm:grid-cols-[165px_1fr]">
        <label className="sr-only" htmlFor={`${label}-precision`}>日期精度</label>
        <select id={`${label}-precision`} className="archive-input" value={value.precision} onChange={(event) => onChange(toLifeDate(event.target.value as LifeDate["precision"], ""))}>
          <option value="day">具体日期</option>
          <option value="month">只记得月份</option>
          <option value="year">只记得年份</option>
          <option value="approximate">大致时间</option>
          <option value="unknown">完全不确定</option>
        </select>
        {value.precision === "unknown" ? (
          <div className="flex min-h-10 items-center rounded-lg bg-[#f2eee7] px-3 text-xs text-[var(--muted)]">不会填充今天的日期</div>
        ) : value.precision === "approximate" ? (
          <input className="archive-input" aria-label={`${label}描述`} placeholder="例如：2018 年毕业后的夏天" value={value.originalText ?? ""} maxLength={300} onChange={(event) => onChange(toLifeDate("approximate", event.target.value))} />
        ) : (
          <input
            className="archive-input"
            aria-label={`${label}日期`}
            type={value.precision === "day" ? "date" : value.precision === "month" ? "month" : "number"}
            min={value.precision === "year" ? 1 : undefined}
            max={value.precision === "year" ? 9999 : undefined}
            value={value.precision === "year" ? value.iso ?? "" : value.iso ?? ""}
            placeholder={value.precision === "year" ? "例如：2018" : undefined}
            onChange={(event) => onChange(toLifeDate(value.precision, event.target.value))}
          />
        )}
      </div>
    </fieldset>
  );
}
