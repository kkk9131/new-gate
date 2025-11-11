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
    // PGRST116: データが見つからない
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'データが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 23505: UNIQUE制約違反
    if (error.code === '23505') {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'データがすでに存在します',
            details: error.message,
          },
        },
        { status: 409 }
      );
    }

    // 23503: 外部キー制約違反
    if (error.code === '23503') {
      return NextResponse.json(
        {
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: '関連するデータが存在しません',
            details: error.message,
          },
        },
        { status: 400 }
      );
    }

    // その他のSupabaseエラー
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
