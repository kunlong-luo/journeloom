import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose-archive text-sm leading-7 text-[var(--ink)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          // Loading a remote image would contact a third-party host merely by previewing private Markdown.
          img: ({ alt }) => <span className="rounded bg-[#f1efe8] px-2 py-1 text-xs text-[var(--sage-dark)]">[图片引用：{alt || "未命名"}，未自动加载]</span>,
        }}
      >{content || "*还没有文字。*"}</ReactMarkdown>
    </div>
  );
}
