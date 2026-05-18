import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovelScope API",
  description: "NovelScope 后端 API 服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
