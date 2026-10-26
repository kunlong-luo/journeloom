"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { EventCategory, EventInput, LifeDate, LifeEvent, PersonRef, Visibility } from "@/domain/models";
import { DateFields } from "./date-fields";

const MarkdownPreview = dynamic(() => import("./markdown-preview"), { ssr: false });

export const categoryNames: Record<EventCategory, string> = {
  family: "家庭", education: "学习", career: "职业", relationship: "关系", travel: "旅行", health: "健康", milestone: "重要节点", other: "其他",
};

const initialEvent: EventInput = {
  title: "", category: "milestone", startDate: { precision: "unknown" },
  summaryMarkdown: "", reflectionMarkdown: "", locationLabel: "", tags: [], visibility: "private",
};

type Props = { initial?: LifeEvent; people: PersonRef[]; onCancel: () => void; onSubmit: (value: EventInput) => Promise<void> };

export function EventForm({ initial, people, onCancel, onSubmit }: Props) {
  const [input, setInput] = useState<EventInput>(() => initial ? {
    title: initial.title, category: initial.category, startDate: initial.startDate, endDate: initial.endDate,
    locationLabel: initial.locationLabel ?? "", summaryMarkdown: initial.summaryMarkdown,
    reflectionMarkdown: initial.reflectionMarkdown ?? "", tags: initial.tags, visibility: initial.visibility, participantIds: initial.participantIds,
  } : initialEvent);
  const [withEndDate, setWithEndDate] = useState(Boolean(initial?.endDate));
  const [showPreview, setShowPreview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [tagText, setTagText] = useState(input.tags.join(", "));

  function update<K extends keyof EventInput>(field: K, value: EventInput[K]) {
    setInput((previous) => ({ ...previous, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await onSubmit({ ...input, endDate: withEndDate ? input.endDate ?? { precision: "unknown" } : undefined,
        tags: tagText.split(/[,，]/).map((value) => value.trim()).filter(Boolean) });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void submit(event)}>
      <label className="archive-field">事件标题
        <input autoFocus required className="archive-input" maxLength={150} value={input.title} onChange={(event) => update("title", event.target.value)} placeholder="例如：第一次独自远行" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="archive-field">分类
          <select className="archive-input" value={input.category} onChange={(event) => update("category", event.target.value as EventCategory)}>
            {Object.entries(categoryNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="archive-field">地点（可选）
          <input className="archive-input" maxLength={200} value={input.locationLabel ?? ""} onChange={(event) => update("locationLabel", event.target.value)} placeholder="城市或地点" />
        </label>
      </div>
      <DateFields label="发生时间" value={input.startDate} onChange={(date: LifeDate) => update("startDate", date)} />
      <label className="flex items-center gap-2 text-xs text-[var(--muted)]"><input type="checkbox" checked={withEndDate} onChange={(event) => setWithEndDate(event.target.checked)} /> 这是一个跨期事件（补充结束时间）</label>
      {withEndDate ? <DateFields label="结束时间" value={input.endDate ?? { precision: "unknown" }} onChange={(date) => update("endDate", date)} /> : null}
      <label className="archive-field">标签（用逗号分隔）
        <input className="archive-input" value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="成长，求学，家人" />
      </label>
      <fieldset className="rounded-xl border border-[var(--border)] bg-white p-4">
        <legend className="px-2 text-xs font-semibold">参与人物（可选）</legend>
        {people.length ? <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">{people.map((person) => <label key={person.id} className="flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={(input.participantIds ?? []).includes(person.id)} onChange={(event) => setInput((old) => ({ ...old, participantIds: event.target.checked ? [...(old.participantIds ?? []), person.id] : (old.participantIds ?? []).filter((id) => id !== person.id) }))} />
          <span>{person.displayName}</span>{person.relationship ? <span className="text-[var(--muted)]">· {person.relationship}</span> : null}
        </label>)}</div> : <p className="text-xs leading-6 text-[var(--muted)]">还没有人物。先在档案中添加人物，再回来关联这段经历。</p>}
      </fieldset>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4"><label className="text-xs font-semibold" htmlFor="event-story">故事正文（Markdown）</label><button type="button" className="text-xs underline underline-offset-4" onClick={() => setShowPreview((current) => !current)}>{showPreview ? "继续编辑" : "预览效果"}</button></div>
        {showPreview ? <div className="min-h-38 rounded-lg border border-[var(--border)] bg-white p-4"><MarkdownPreview content={input.summaryMarkdown} /></div> :
          <textarea id="event-story" className="archive-input min-h-38 resize-y font-mono text-xs leading-6" maxLength={100000} value={input.summaryMarkdown} onChange={(event) => update("summaryMarkdown", event.target.value)} placeholder="那一天发生了什么？你当时看到了什么、感受到了什么？" />}
      </div>
      <label className="archive-field">感受与反思（可选）
        <textarea className="archive-input min-h-22 resize-y" maxLength={50000} value={input.reflectionMarkdown ?? ""} onChange={(event) => update("reflectionMarkdown", event.target.value)} placeholder="如果回头再看，这件事意味着什么？" />
      </label>
      <label className="archive-field">导出可见性
        <select className="archive-input" value={input.visibility} onChange={(event) => update("visibility", event.target.value as Visibility)}>
          <option value="private">私密：仅存于我的完整备份</option>
          <option value="export-review">允许在审核后导出为阅读文档</option>
        </select>
        <span className="text-[11px] leading-5 font-normal text-[var(--muted)]">即使选择允许导出，也必须在导出时再次预览确认；不会自动公开到网络。</span>
      </label>
      {error ? <p className="archive-error" role="alert">{error}</p> : null}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="archive-button-ghost" disabled={pending} onClick={onCancel}>取消</button>
        <button type="submit" className="archive-button-primary" disabled={pending}>{pending ? "保存中…" : initial ? "保存修改" : "记录这个时刻"}</button>
      </div>
    </form>
  );
}
