"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, BookOpenText, CalendarClock, FilePlus2, ImagePlus, LockKeyhole, PenLine, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { formatLifeDate, newestFirst } from "@/domain/life-date";
import type { EventCategory, EventInput, LifeEvent, MediaRecord, ProfileInput } from "@/domain/models";
import { getDb } from "@/storage/database";
import { attachMedia, createProfile, deleteProfile, removeMedia, restoreEvent, saveEvent, softDeleteEvent, updateProfile } from "@/storage/repository";
import { BackupPanel, downloadBlob } from "./backup-panel";
import { EventForm, categoryNames } from "./event-form";
import { ProfileForm } from "./profile-form";

type Editor = { kind: "new-profile" } | { kind: "edit-profile" } | { kind: "new-event" } | { kind: "edit-event"; event: LifeEvent } | null;

function ArchiveDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} onClose={onClose} className="archive-modal m-auto max-h-[min(92vh,940px)] w-[min(92vw,680px)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-5 shadow-2xl backdrop:bg-[#14252baa] sm:p-8" aria-labelledby="archive-dialog-title">
      <div className="mb-7 flex items-start justify-between gap-4"><h2 id="archive-dialog-title" className="font-display text-[29px] tracking-[-0.045em]">{title}</h2><button type="button" className="archive-icon-button" aria-label="关闭" onClick={onClose}><X size={20} /></button></div>
      {children}
    </dialog>
  );
}

function MediaAttachments({ event, records }: { event: LifeEvent; records: MediaRecord[] }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const media = records.filter((record) => record.eventId === event.id);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setPending(true); setError("");
    try {
      for (const file of Array.from(files)) await attachMedia(event.profileId, event.id, file);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "上传失败"); }
    finally { setPending(false); }
  }

  return (
    <div className="mt-4 border-t border-[#e2e6e0] pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {media.map((record) => <span key={record.id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#eef2eb] px-2.5 py-1 text-[11px] text-[var(--sage-dark)]">
          <button type="button" className="max-w-38 truncate underline underline-offset-2" title={`下载 ${record.originalFileName}`} onClick={() => downloadBlob(record.blob, record.originalFileName)}>{record.originalFileName}</button>
          <button type="button" aria-label={`删除附件 ${record.originalFileName}`} onClick={() => { if (window.confirm("确定移除这个附件吗？这会删除本地附件文件。")) void removeMedia(event.id, record.id).catch((reason) => setError(String(reason))); }}><X size={12} /></button>
        </span>)}
        <label className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-[#bdc7bd] px-2.5 py-1 text-[11px] text-[var(--sage-dark)] ${pending ? "opacity-50" : ""}`}>
          <ImagePlus size={13} aria-hidden="true" /> {pending ? "保存附件中…" : "添加附件"}
          <input className="sr-only" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,audio/*,video/*,application/pdf,text/plain" disabled={pending} aria-label={`为 ${event.title} 添加附件`} onChange={(fileEvent) => { void upload(fileEvent.target.files); fileEvent.target.value = ""; }} />
        </label>
      </div>
      {error ? <p className="archive-error mt-2" role="alert">{error}</p> : null}
    </div>
  );
}

function ArchiveWorkspace() {
  const db = useMemo(() => getDb(), []);
  const profiles = useLiveQuery(() => db.profiles.orderBy("updatedAt").reverse().toArray(), [], []);
  const [requestedId, setSelectedId] = useState<string | null>(null);
  const selectedId = profiles.some((profile) => profile.id === requestedId) ? requestedId : profiles[0]?.id ?? null;
  const [editor, setEditor] = useState<Editor>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [year, setYear] = useState("all");
  const [error, setError] = useState("");
  const events = useLiveQuery<LifeEvent[], LifeEvent[]>(() => selectedId ? db.events.where("profileId").equals(selectedId).toArray() : Promise.resolve([]), [selectedId], []);
  const media = useLiveQuery<MediaRecord[], MediaRecord[]>(() => selectedId ? db.media.where("profileId").equals(selectedId).toArray() : Promise.resolve([]), [selectedId], []);

  const profile = profiles.find((item) => item.id === selectedId);
  const allEvents = events ?? [];
  const visibleEvents = allEvents.filter((event) => {
    if (showTrash ? !event.deletedAt : Boolean(event.deletedAt)) return false;
    if (category !== "all" && event.category !== category) return false;
    if (year !== "all" && !event.startDate.iso?.startsWith(year)) return false;
    const needle = query.trim().toLocaleLowerCase();
    return !needle || [event.title, event.locationLabel ?? "", event.summaryMarkdown, event.reflectionMarkdown ?? "", ...event.tags].join(" ").toLocaleLowerCase().includes(needle);
  }).sort(newestFirst);
  const years = [...new Set(allEvents.map((event) => event.startDate.iso?.slice(0, 4)).filter((value): value is string => Boolean(value)))].sort().reverse();

  async function saveProfile(input: ProfileInput) {
    if (editor?.kind === "edit-profile" && selectedId) await updateProfile(selectedId, input);
    else { const created = await createProfile(input); setSelectedId(created.id); }
    setEditor(null);
  }

  async function storeEvent(input: EventInput) {
    if (!selectedId) return;
    await saveEvent(selectedId, input, editor?.kind === "edit-event" ? editor.event.id : undefined);
    setEditor(null);
    setShowTrash(false);
  }

  async function confirmDeleteProfile() {
    if (!selectedId || !profile) return;
    if (!window.confirm(`确定永久删除「${profile.displayName}」及其全部事件和附件吗？此操作无法撤销，请先备份。`)) return;
    setError("");
    try { await deleteProfile(selectedId); setSelectedId(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "删除档案失败"); }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--border)] bg-[#fffefa]">
        <div className="site-container flex min-h-[74px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2"><BrandMark className="h-10 w-10" /><span className="font-display text-[24px] tracking-[-0.06em]">journeloom<span className="text-[var(--copper)]">.</span></span></Link>
          <div className="flex items-center gap-3 text-xs text-[var(--muted)]"><span className="hidden items-center gap-1.5 sm:inline-flex"><LockKeyhole size={14} /> 数据仅保存在当前浏览器</span><Link href="/" className="inline-flex items-center gap-1 underline underline-offset-4"><ArrowLeft size={14} /> 返回首页</Link></div>
        </div>
      </header>

      <div className="site-container grid gap-10 pb-20 pt-10 lg:grid-cols-[255px_minmax(0,1fr)]">
        <aside className="lg:border-r lg:border-[var(--border)] lg:pr-7" aria-label="档案列表">
          <div className="flex items-center justify-between gap-2"><h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--sage-dark)]">我的档案</h2><button type="button" onClick={() => setEditor({ kind: "new-profile" })} className="archive-icon-button" aria-label="新增档案"><Plus size={18} /></button></div>
          {profiles.length ? <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
            {profiles.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setQuery(""); setCategory("all"); setYear("all"); }} className={`rounded-xl px-4 py-3 text-left text-sm transition-colors ${item.id === selectedId ? "bg-[var(--ink)] text-white" : "border border-[var(--border)] bg-white hover:bg-[#f2f0e8]"}`} aria-pressed={item.id === selectedId}><span className="block truncate font-semibold">{item.displayName}</span><span className={`mt-1 block text-[10px] ${item.id === selectedId ? "text-[#b5c9c2]" : "text-[var(--muted)]"}`}>私人生活档案</span></button>)}
          </div> : <p className="mt-5 text-xs leading-6 text-[var(--muted)]">还没有档案。点击右上角的加号，创建你的第一份私人记录。</p>}
          <div className="mt-8 rounded-xl border border-[#e5e0d8] bg-[#f5f0e8] p-4"><LockKeyhole className="text-[var(--sage-dark)]" size={20} /><p className="mt-3 text-xs font-semibold">隐私从第一天开始</p><p className="mt-2 text-[11px] leading-6 text-[var(--muted)]">所有记录写入当前设备的 IndexedDB。没有用户账号，也没有自动云上传；但本地数据尚未静态加密，共用设备时请注意账户安全，并定期完整备份。</p></div>
        </aside>

        <main className="min-w-0">
          {profile ? <>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div><p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--sage-dark)] uppercase">YOUR LIFE ARCHIVE / {profile.createdAt.slice(0, 4)}</p><h1 className="font-display mt-3 text-[clamp(2rem,4vw,3.4rem)] tracking-[-0.06em]">{profile.displayName}</h1><p className="mt-3 max-w-xl whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">{profile.bioMarkdown || "这一页，属于你尚未讲完的故事。"}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => setEditor({ kind: "edit-profile" })} className="archive-icon-button" title="编辑档案" aria-label="编辑档案"><PenLine size={17} /></button><button type="button" onClick={() => void confirmDeleteProfile()} className="archive-icon-button text-[#a35652]" title="删除档案" aria-label="删除档案"><Trash2 size={17} /></button></div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5"><div className="flex items-center gap-2"><BookOpenText size={19} className="text-[var(--copper-dark)]" /><h2 className="font-display text-2xl">人生时间轴</h2><span className="rounded-full bg-[#e9efe9] px-2 py-1 text-[11px] text-[var(--sage-dark)]">{allEvents.filter((event) => !event.deletedAt).length}</span></div><button type="button" className="archive-button-primary inline-flex items-center gap-2" onClick={() => setEditor({ kind: "new-event" })}><FilePlus2 size={16} /> 记录新事件</button></div>

            <div className="mt-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_155px]">
              <label className="relative"><Search size={16} className="absolute left-3 top-3 text-[#9aa4a2]" aria-hidden="true" /><span className="sr-only">搜索记录</span><input className="archive-input pl-9" placeholder="搜索标题、标签或正文" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              <label><span className="sr-only">事件分类</span><select className="archive-input" value={category} onChange={(event) => setCategory(event.target.value as EventCategory | "all")}>{["all", ...Object.keys(categoryNames)].map((value) => <option key={value} value={value}>{value === "all" ? "全部分类" : categoryNames[value as EventCategory]}</option>)}</select></label>
              <label><span className="sr-only">事件年份</span><select className="archive-input" value={year} onChange={(event) => setYear(event.target.value)}><option value="all">所有年份</option>{years.map((value) => <option key={value} value={value}>{value} 年</option>)}</select></label>
            </div>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-[12px] text-[var(--muted)]"><input type="checkbox" checked={showTrash} onChange={(event) => setShowTrash(event.target.checked)} /> 查看已删除事件（可恢复）</label>

            <div className="mt-5 space-y-4" aria-live="polite">
              {visibleEvents.length ? visibleEvents.map((event) => <article key={event.id} className="rounded-xl border border-[#e2e4df] bg-[#fffefa] p-5 shadow-[0_6px_24px_#293f3908] sm:p-6">
                <div className="flex items-start justify-between gap-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--sage-dark)]"><CalendarClock size={14} /><span>{formatLifeDate(event.startDate)}{event.endDate ? ` — ${formatLifeDate(event.endDate)}` : ""}</span><span className="text-[#adb4ae]">·</span><span>{categoryNames[event.category]}</span>{event.visibility === "private" ? <LockKeyhole size={13} aria-label="私密" /> : <span className="rounded-full bg-[#ebf0e9] px-2 py-0.5">可审核导出</span>}</div><h3 className="font-display mt-3 text-[26px] tracking-[-0.04em]">{event.title}</h3>{event.locationLabel ? <p className="mt-1 text-xs text-[var(--muted)]">{event.locationLabel}</p> : null}</div><div className="flex shrink-0 gap-1">{showTrash ? <button type="button" className="archive-icon-button" aria-label={`恢复 ${event.title}`} title="恢复事件" onClick={() => void restoreEvent(event.id).catch((reason) => setError(String(reason)))}><RotateCcw size={17} /></button> : <><button type="button" className="archive-icon-button" aria-label={`编辑 ${event.title}`} onClick={() => setEditor({ kind: "edit-event", event })}><PenLine size={16} /></button><button type="button" className="archive-icon-button text-[#a35652]" aria-label={`删除 ${event.title}`} onClick={() => { if (window.confirm("确定将这条事件移入已删除列表吗？可以稍后恢复。")) void softDeleteEvent(event.id).catch((reason) => setError(String(reason))); }}><Trash2 size={16} /></button></>}</div></div>
                {event.summaryMarkdown ? <p className="mt-4 whitespace-pre-wrap break-words text-[13px] leading-7 text-[var(--muted)]">{event.summaryMarkdown.length > 400 ? `${event.summaryMarkdown.slice(0, 400)}…` : event.summaryMarkdown}</p> : null}
                {event.reflectionMarkdown ? <blockquote className="mt-4 border-l-2 border-[var(--copper)] pl-4 text-[12px] leading-7 text-[var(--sage-dark)]">{event.reflectionMarkdown}</blockquote> : null}
                {event.tags.length ? <div className="mt-4 flex flex-wrap gap-1.5">{event.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f2eee7] px-2.5 py-1 text-[10px] text-[#87776a]">#{tag}</span>)}</div> : null}
                {!showTrash ? <MediaAttachments event={event} records={media ?? []} /> : null}
              </article>) : <div className="rounded-xl border border-dashed border-[#c8d3ca] bg-[#f8f6f0] px-6 py-14 text-center"><BookOpenText size={29} className="mx-auto text-[var(--sage-dark)]" /><p className="font-display mt-4 text-xl">{showTrash ? "没有已删除事件" : allEvents.length ? "没有符合筛选条件的事件" : "每一个故事，都从一个瞬间开始"}</p><p className="mt-3 text-xs text-[var(--muted)]">{showTrash ? "已删除的事件会出现在这里，可以恢复。" : "记录一个重要时刻，或只是今天生活中小小的发现。"}</p>{!showTrash ? <button className="archive-button-primary mt-6" type="button" onClick={() => setEditor({ kind: "new-event" })}><Plus className="mr-1 inline" size={15} />添加第一条事件</button> : null}</div>}
            </div>
          </> : <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#c7d1c8] bg-[#f7f3ec] p-6 text-center"><BookOpenText size={43} className="text-[var(--sage-dark)]" /><h1 className="font-display mt-5 text-3xl">为自己留下一本人生手记</h1><p className="mt-3 max-w-lg text-sm leading-7 text-[var(--muted)]">从名字开始，建立一份只保存在当前浏览器的私人档案。可以给自己、家人或一个成长阶段分别创建档案。</p><button type="button" className="archive-button-primary mt-7" onClick={() => setEditor({ kind: "new-profile" })}>创建第一份档案</button></div>}

          {error ? <p className="archive-error mt-5" role="alert">{error}</p> : null}
          <BackupPanel profile={profile} events={allEvents} />
        </main>
      </div>

      {editor ? <ArchiveDialog title={editor.kind === "new-profile" ? "创建人生档案" : editor.kind === "edit-profile" ? "编辑人生档案" : editor.kind === "new-event" ? "记录人生事件" : "编辑人生事件"} onClose={() => setEditor(null)}>
        {editor.kind === "new-profile" || editor.kind === "edit-profile" ? <ProfileForm initial={editor.kind === "edit-profile" ? profile : undefined} onCancel={() => setEditor(null)} onSubmit={saveProfile} /> :
          <EventForm initial={editor.kind === "edit-event" ? editor.event : undefined} onCancel={() => setEditor(null)} onSubmit={storeEvent} />}
      </ArchiveDialog> : null}
    </div>
  );
}

export function ArchiveApp() {
  const ready = useSyncExternalStore(subscribeClient, () => true, () => false);
  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] text-sm text-[var(--muted)]" role="status">正在打开你的本地人生档案…</div>;
  if (!window.indexedDB || !window.crypto?.subtle) return <div className="site-container py-20"><h1 className="font-display text-3xl">当前浏览器无法安全保存档案</h1><p className="mt-4 text-sm text-[var(--muted)]">请使用支持 IndexedDB 和 Web Crypto 的现代浏览器，并通过 HTTPS 或 localhost 访问。</p><Link href="/" className="archive-button-primary mt-5 inline-block">返回首页</Link></div>;
  return <ArchiveWorkspace />;
}

const subscribeClient = () => () => {};
