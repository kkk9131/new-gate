import type { Metadata } from "next";
import "./globals.css";
import { AuthListener } from "@/components/auth/AuthListener";

export const metadata: Metadata = {
  title: "新時代SaaS",
  description: "マルチタスク型SaaSのMVP版",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {/* 認証状態リスナー（Zustand連携） */}
        <AuthListener />
        {children}
      </body>
    </html>
  );
}

