import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let client: ReturnType<typeof createClient<Database>> | null = null;

// service_role キーのみを使うサーバー専用クライアント。
// RLS は全テーブルで有効だがポリシー未定義のため、このキー以外からは読み書きできない。
export function supabaseAdmin() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません。.env.local を確認してください。"
    );
  }

  client = createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
  return client;
}
