import type { Metadata } from "next";
import { Providers } from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "个人网站管理后台",
  description: "管理博客、项目和用户",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
