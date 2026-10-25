import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Journeloom — Every Life Has a Story",
  description: "A calm, local-first place to preserve your life's moments, memories and stories. Open source and private by design.",
  applicationName: "Journeloom",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: [{ rel: "icon", url: `${basePath}/icon.svg`, type: "image/svg+xml" }],
};

export const viewport: Viewport = { themeColor: "#FAF7F2", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
