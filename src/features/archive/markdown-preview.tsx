import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose-archive text-sm leading-7 text-[var(--ink)]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{content || "*还没有文字。*"}</ReactMarkdown>
    </div>
  );
}
