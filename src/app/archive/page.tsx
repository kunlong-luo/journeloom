import type { Metadata } from "next";
import { ArchiveApp } from "@/features/archive/archive-app";

export const metadata: Metadata = {
  title: "我的人生档案 · Journeloom",
  description: "在当前浏览器中私密记录人生事件、故事与照片，并导出可靠备份。",
  robots: { index: false, follow: false },
};

export default function ArchivePage() {
  return <ArchiveApp />;
}
