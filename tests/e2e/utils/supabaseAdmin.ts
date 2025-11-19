import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'E2EテストにはNEXT_PUBLIC_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYの環境変数が必要です。'
  );
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export function generateTestEmail(label: string) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1_000_000);
  return `e2e+${label}-${timestamp}-${random}@example.com`;
}

export async function createVerifiedUser(email: string, password: string): Promise<User> {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`テストユーザー作成に失敗しました: ${error?.message}`);
  }

  return data.user;
}

export async function deleteUser(userId: string) {
  if (!userId) return;
  await adminClient.auth.admin.deleteUser(userId);
}
