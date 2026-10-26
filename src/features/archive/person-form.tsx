"use client";

import { useState } from "react";
import type { PersonInput, PersonRef } from "@/domain/models";

export function PersonForm({ initial, onCancel, onSubmit }: {
  initial?: PersonRef;
  onCancel: () => void;
  onSubmit: (value: PersonInput) => Promise<void>;
}) {
  const [input, setInput] = useState<PersonInput>({
    displayName: initial?.displayName ?? "",
    relationship: initial?.relationship ?? "",
    notesMarkdown: initial?.notesMarkdown ?? "",
    isMinor: initial?.isMinor ?? false,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true); setError("");
    try { await onSubmit(input); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "保存人物失败"); }
    finally { setPending(false); }
  }

  return <form className="space-y-5" onSubmit={(event) => void submit(event)}>
    <p className="text-xs leading-6 text-[var(--muted)]">可以填写化名，避免无意暴露真实身份。人物资料仅保存在本地完整备份，不会自动进入阅读版导出。</p>
    <label className="archive-field">人物姓名或化名
      <input autoFocus required maxLength={100} className="archive-input" value={input.displayName} onChange={(event) => setInput((old) => ({ ...old, displayName: event.target.value }))} placeholder="例如：一位老朋友" />
    </label>
    <label className="archive-field">与你的关系（可选）
      <input maxLength={100} className="archive-input" value={input.relationship ?? ""} onChange={(event) => setInput((old) => ({ ...old, relationship: event.target.value }))} placeholder="家人、同学、同事、朋友……" />
    </label>
    <label className="archive-field">私人备注（可选）
      <textarea maxLength={10000} className="archive-input min-h-28" value={input.notesMarkdown} onChange={(event) => setInput((old) => ({ ...old, notesMarkdown: event.target.value }))} placeholder="值得记住的相处片段、称呼或回忆" />
    </label>
    <label className="flex items-center gap-2 text-xs text-[var(--muted)]"><input type="checkbox" checked={input.isMinor} onChange={(event) => setInput((old) => ({ ...old, isMinor: event.target.checked }))} /> 此人物是未成年人（注意额外隐私保护）</label>
    {error ? <p className="archive-error" role="alert">{error}</p> : null}
    <div className="flex justify-end gap-3 pt-2"><button type="button" className="archive-button-ghost" onClick={onCancel} disabled={pending}>取消</button><button type="submit" className="archive-button-primary" disabled={pending}>{pending ? "保存中…" : initial ? "保存人物" : "添加人物"}</button></div>
  </form>;
}
