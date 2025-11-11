import { NextRequest, NextResponse } from 'next/server';
import { createClientWithResponse, applySupabaseCookies } from '@/lib/supabase/route';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です。' }, { status: 400 });
    }

    const { supabase, response } = await createClientWithResponse(request);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return NextResponse.json({ error: error?.message || 'ログインに失敗しました。' }, { status: 401 });
    }

    const jsonResponse = NextResponse.json({ success: true, user: data.user });
    applySupabaseCookies(response, jsonResponse);
    return jsonResponse;
  } catch (err: unknown) {
    console.error('メールログインAPIエラー:', err);
    return NextResponse.json({ error: 'ログイン処理でエラーが発生しました。' }, { status: 500 });
  }
}
