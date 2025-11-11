import { NextResponse } from 'next/server';

/**
 * API共通エラーハンドラー
 * すべてのAPIエンドポイントで統一したエラーレスポンスを返す
 */
export function handleAPIError(error: any) {
  console.error('API Error:', error);

  // 認証エラー
  if (error.message === 'UNAUTHORIZED') {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
      },
      { status: 401 }
    );
  }

  // Zodバリデーションエラー
  if (error.name === 'ZodError') {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力値が不正です',
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }

  // Supabaseエラー
  if (error.code) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: 500 }
    );
  }

  // その他のエラー
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    },
    { status: 500 }
  );
}
