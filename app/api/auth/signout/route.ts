import { NextRequest, NextResponse } from 'next/server';
import { createClientWithResponse, applySupabaseCookies } from '@/lib/supabase/route';

export async function POST(request: NextRequest) {
  try {
    const { supabase, response } = await createClientWithResponse(request);
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const jsonResponse = NextResponse.json({ success: true });
    applySupabaseCookies(response, jsonResponse);
    return jsonResponse;
  } catch (err: unknown) {
    console.error('サインアウトAPIエラー:', err);
    return NextResponse.json({ error: 'サインアウトに失敗しました。' }, { status: 500 });
  }
}
