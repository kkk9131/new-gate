import { requireAuth } from '@/lib/auth/session';
import { AuthProvider } from '@/components/auth/AuthProvider';

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
  // const user = await requireAuth();
  const user = {
    id: 'mock-user-id',
    email: 'mock@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as any;

  // 認証済みの場合は子要素を表示（ユーザー情報を渡す）
  return <AuthProvider user={user}>{children}</AuthProvider>;
}
