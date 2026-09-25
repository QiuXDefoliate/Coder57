import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "澄心 · AI 银行助理",
  description: "安全、清晰、可确认的个人银行 AI Agent 演示",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
