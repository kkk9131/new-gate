import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}

