import { createBrowserClient } from '@supabase/ssr';

/**
 * クライアントサイド（ブラウザ）用のSupabaseクライアントを作成
 *
 * このクライアントはReactコンポーネント内で使用します。
 * ブラウザのCookieから自動的にセッション情報を読み取ります。
 *
 * @returns Supabaseクライアントインスタンス
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
