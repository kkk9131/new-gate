import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * サーバーコンポーネント用のSupabaseクライアントを作成
 *
 * このクライアントはServer Components内で使用します。
 * Next.jsのcookies()を使用してセッション情報を読み取ります。
 *
 * @returns Supabaseクライアントインスタンス
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Componentでのset呼び出しは無視
            // （Middlewareでのみ動作）
          }
        },
      },
    }
  );
}
