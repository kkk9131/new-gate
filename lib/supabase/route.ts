import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * API Route用のSupabaseクライアントを作成
 *
 * このクライアントはAPI Route（app/api/...）内で使用します。
 * Cookie操作が可能で、認証セッションの更新ができます。
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
            // API Routeでのcookie設定失敗時の処理
            console.error('Cookie設定に失敗しました');
          }
        },
      },
    }
  );
}

/**
 * NextResponseと共にCookieを更新するSupabaseクライアントを作成
 *
 * レスポンス返却時にCookieを正しく設定するために使用します。
 *
 * @param request - NextRequestインスタンス
 * @returns { supabase, response } - クライアントとレスポンスのペア
 */
export async function createClientWithResponse(request: Request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get('cookie')?.split('; ').map((cookie) => {
            const [name, ...rest] = cookie.split('=');
            return { name, value: rest.join('=') };
          }) || [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response };
}

/**
 * Supabaseクライアントが設定したCookieを別レスポンスへ転写
 */
export function applySupabaseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value, {
      path: cookie.path || '/',
      httpOnly: cookie.httpOnly ?? true,
      secure: cookie.secure ?? process.env.NODE_ENV === 'production',
      sameSite: (cookie.sameSite as 'lax' | 'strict' | 'none') || 'lax',
      maxAge: cookie.maxAge,
      domain: cookie.domain,
    });
  });
}
