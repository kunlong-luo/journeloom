"use client";

import { useRef, useState } from "react";
import { Archive, Download, FileText, UploadCloud } from "lucide-react";
import type { LifeEvent, Profile } from "@/domain/models";
import { createBackup, importBackup, readBackup, type BackupSnapshot } from "@/portability/backup";
import { createReadingMarkdown, reviewableEvents } from "@/portability/markdown";

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type Props = { profile?: Profile; events: LifeEvent[] };

export function BackupPanel({ profile, events }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [incoming, setIncoming] = useState<BackupSnapshot | null>(null);
  const [reviewMarkdown, setReviewMarkdown] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const candidates = reviewableEvents(events);

  async function exportPrivateBackup() {
    setPending(true); setError(""); setMessage("");
    try {
      const blob = await createBackup();
      downloadBlob(blob, `journeloom-private-backup-${new Date().toISOString().slice(0, 10)}.zip`);
      setMessage("私人完整备份已准备下载。请妥善保管，其中可能包含照片和敏感信息。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "备份失败");
    } finally { setPending(false); }
  }

  async function chooseBackup(file: File | undefined) {
    if (!file) return;
    setPending(true); setError(""); setMessage(""); setIncoming(null);
    try { setIncoming(await readBackup(file)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "无法读取备份"); }
    finally { setPending(false); if (fileInput.current) fileInput.current.value = ""; }
  }

  async function confirmImport() {
    if (!incoming) return;
    setPending(true); setError(""); setMessage("");
    try {
      await importBackup(incoming);
      setIncoming(null);
      setMessage("备份已成功恢复到本地浏览器。原有档案未被覆盖。");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "恢复失败"); }
    finally { setPending(false); }
  }

  function confirmReadingExport() {
    if (!profile || candidates.length === 0) return;
    const markdown = createReadingMarkdown(profile, candidates);
    downloadBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), `journeloom-stories-${new Date().toISOString().slice(0, 10)}.md`);
    setReviewMarkdown(false);
    setMessage("阅读版 Markdown 已导出；不含私密事件和原始附件。请在外部分享前再次检查文字内容。");
  }

  return (
    <section className="mt-9 rounded-2xl border border-[#d8ded7] bg-[#f0f2ed] p-5 sm:p-6" aria-labelledby="backup-title">
      <div className="flex items-start gap-3"><Archive size={20} className="mt-0.5 text-[var(--sage-dark)]" aria-hidden="true" /><div>
        <h2 id="backup-title" className="font-display text-xl">数据由你保管</h2>
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">浏览器存储可能被清除。请定期下载完整私人备份；它与可分享的阅读导出不是同一回事。</p>
      </div></div>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <button type="button" className="archive-button-primary flex items-center justify-center gap-2" disabled={pending} onClick={() => void exportPrivateBackup()}><Download size={15} aria-hidden="true" /> 完整私人备份</button>
        <button type="button" className="archive-button-ghost flex items-center justify-center gap-2" disabled={pending} onClick={() => fileInput.current?.click()}><UploadCloud size={15} aria-hidden="true" /> 验证并恢复 ZIP</button>
        <button type="button" className="archive-button-ghost flex items-center justify-center gap-2" disabled={!profile || candidates.length === 0 || pending} onClick={() => setReviewMarkdown(true)}><FileText size={15} aria-hidden="true" /> 阅读版 Markdown</button>
      </div>
      <input ref={fileInput} className="sr-only" type="file" accept=".zip,application/zip" aria-label="选择 Journeloom ZIP 备份" onChange={(event) => void chooseBackup(event.target.files?.[0])} />

      {incoming ? <div className="mt-5 rounded-xl border border-[#c8d5cc] bg-white p-4 text-sm">
        <h3 className="font-semibold">恢复前预览（尚未写入）</h3>
        <p className="mt-2 text-xs leading-6 text-[var(--muted)]">备份日期：{new Date(incoming.createdAt).toLocaleString("zh-CN")} · {incoming.profiles.length} 份档案 · {incoming.events.length} 条事件 · {incoming.media.length} 个附件</p>
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">所有文件校验成功。恢复使用仅新增模式，如果记录 ID 重复，将中止整个事务，不会覆盖现有内容。</p>
        <div className="mt-4 flex gap-2"><button className="archive-button-primary" type="button" disabled={pending} onClick={() => void confirmImport()}>确认恢复</button><button className="archive-button-ghost" type="button" onClick={() => setIncoming(null)}>取消</button></div>
      </div> : null}

      {reviewMarkdown ? <div className="mt-5 rounded-xl border border-[#c8d5cc] bg-white p-4 text-sm">
        <h3 className="font-semibold">阅读导出隐私审核</h3>
        <p className="mt-2 text-xs leading-6 text-[var(--muted)]">只包含你在事件编辑器中标记为“允许在审核后导出”的事件。请逐条检查标题和正文，避免无意泄露涉及他人的信息。</p>
        <ul className="my-3 max-h-44 list-inside list-disc overflow-auto text-xs leading-7">{candidates.map((event) => <li key={event.id}>{event.title}</li>)}</ul>
        <div className="flex gap-2"><button className="archive-button-primary" type="button" onClick={confirmReadingExport}>已审核，下载 Markdown</button><button className="archive-button-ghost" type="button" onClick={() => setReviewMarkdown(false)}>取消</button></div>
      </div> : null}

      {error ? <p className="archive-error mt-4" role="alert">{error}</p> : null}
      {message ? <p className="mt-4 text-xs leading-6 text-[var(--sage-dark)]" role="status">{message}</p> : null}
    </section>
  );
}
