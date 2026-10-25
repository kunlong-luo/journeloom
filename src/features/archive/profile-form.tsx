"use client";

import { useState } from "react";
import { DateFields } from "./date-fields";
import type { LifeDate, Profile, ProfileInput } from "@/domain/models";

type Props = { initial?: Profile; onCancel: () => void; onSubmit: (value: ProfileInput) => Promise<void> };

export function ProfileForm({ initial, onCancel, onSubmit }: Props) {
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [bioMarkdown, setBioMarkdown] = useState(initial?.bioMarkdown ?? "");
  const [birthDate, setBirthDate] = useState<LifeDate>(initial?.birthDate ?? { precision: "unknown" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await onSubmit({ displayName, bioMarkdown, birthDate: birthDate.precision === "unknown" ? undefined : birthDate });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <label className="archive-field">档案名称（可使用化名）
        <input autoFocus required maxLength={100} className="archive-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="例如：我的人生故事" />
      </label>
      <DateFields label="出生时间" optional value={birthDate} onChange={setBirthDate} />
      <label className="archive-field">关于这份档案
        <textarea className="archive-input min-h-24 resize-y" maxLength={50000} value={bioMarkdown} onChange={(event) => setBioMarkdown(event.target.value)} placeholder="写几句开场白，也可以留空。支持 Markdown。" />
      </label>
      {error ? <p className="archive-error" role="alert">{error}</p> : null}
      <div className="flex justify-end gap-3 pt-2">
        <button className="archive-button-ghost" type="button" onClick={onCancel} disabled={pending}>取消</button>
        <button className="archive-button-primary" type="submit" disabled={pending}>{pending ? "保存中…" : initial ? "保存档案" : "创建档案"}</button>
      </div>
    </form>
  );
}
