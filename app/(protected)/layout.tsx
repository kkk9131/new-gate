import { requireAuth } from '@/lib/auth/session';

/**
 * 認証が必要なページのレイアウト
 *
 * このレイアウト配下のすべてのページは認証が必須です。
 * 未認証の場合は自動的に/loginページにリダイレクトされます。
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 認証チェック（未認証時は自動的に/loginへリダイレクト）
  await requireAuth();

  // 認証済みの場合は子要素を表示
  return <>{children}</>;
}
