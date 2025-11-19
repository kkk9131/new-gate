/**
 * 認証関連のエラーメッセージ定数
 *
 * エラーメッセージを一元管理することで、
 * メッセージの一貫性を保ち、多言語対応も容易になります。
 */
export const AUTH_ERRORS = {
  // ログイン関連
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  EMAIL_NOT_CONFIRMED: 'メールアドレスが確認されていません。確認メールをご確認ください',

  // サインアップ関連
  EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に登録されています',
  WEAK_PASSWORD: 'パスワードが脆弱です。より強力なパスワードを設定してください',

  // パスワード関連
  PASSWORD_TOO_SHORT: 'パスワードは8文字以上で入力してください',
  PASSWORD_MISMATCH: 'パスワードが一致しません',
  CURRENT_PASSWORD_REQUIRED: '現在のパスワードを入力してください',
  CURRENT_PASSWORD_INVALID: '現在のパスワードが正しくありません',
  PASSWORD_UPDATE_FAILED: 'パスワードの変更に失敗しました。もう一度お試しください',

  // パスワードリセット関連
  EMAIL_REQUIRED: 'メールアドレスを入力してください',
  EMAIL_INVALID: 'メールアドレスの形式が正しくありません',
  RESET_EMAIL_FAILED: 'パスワードリセットメールの送信に失敗しました',
  RESET_PASSWORD_FAILED: 'パスワードのリセットに失敗しました',

  // 一般的なエラー
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。もう一度お試しください',
  SESSION_EXPIRED: 'セッションが期限切れです。再度ログインしてください',
} as const;

/**
 * 成功メッセージ定数
 */
export const AUTH_SUCCESS = {
  LOGIN: 'ログインしました',
  SIGNUP: 'アカウントを作成しました。確認メールをご確認ください',
  PASSWORD_CHANGED: 'パスワードを変更しました',
  LOGOUT: 'ログアウトしました',
  RESET_EMAIL_SENT: 'パスワードリセットメールを送信しました。メールをご確認ください',
  PASSWORD_RESET: 'パスワードをリセットしました。新しいパスワードでログインしてください',
} as const;
