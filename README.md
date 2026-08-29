# 学内イベント企画管理アプリ（Phase 1）

Next.js（App Router / TypeScript）+ Supabase（Postgres）構成。詳しい要件は
[CLAUDE.md](./CLAUDE.md) と
[学内イベント企画管理アプリ_要件定義書.md](./学内イベント企画管理アプリ_要件定義書.md)
を参照してください。

## セットアップ

### 1. Supabase プロジェクトを作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. Project Settings > API から `Project URL` と `service_role` キーを控える
3. SQL Editor で以下を順に実行
   - [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)（テーブル作成）
   - [`supabase/seed.sql`](./supabase/seed.sql)（探究イベント2026のデモデータ。団体5件・管理者ID。本番投入前に内容を差し替えるか削除してください）

### 2. 環境変数

`.env.local.example` を `.env.local` にコピーし、値を埋める。

```bash
cp .env.local.example .env.local
```

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: 手順1で控えた値
- `SESSION_SECRET`: `openssl rand -base64 32` などで生成した32文字以上のランダム文字列

`SUPABASE_SERVICE_ROLE_KEY` は管理者権限を持つ秘密鍵です。クライアントに公開されるコードには一切含めないでください（本アプリのSupabase呼び出しはすべてサーバー側でのみ実行されます）。

### 3. 起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開くと、登録済みイベントが1件ならそのログイン画面へ自動的に移動します。

デモデータ（`supabase/seed.sql`）を投入した場合のログイン情報:

- 管理者: ID `committee` / パスワード `committee2026`
- 団体: 「3年A組」など + 合言葉 `sagasu-3a` 等（`seed.sql` 参照）

## 構成

- `src/app/[eventSlug]/login` — 団体／管理者ログイン（タブ切替）
- `src/app/[eventSlug]/group` — 団体側：企画提出フォーム（下書き保存・提出・予算チェック）
- `src/app/[eventSlug]/group/messages` — 団体側：全体連絡／個別コメント
- `src/app/[eventSlug]/admin` — 管理側：企画一覧・承認フロー
- `src/app/[eventSlug]/admin/submissions/[id]` — 管理側：企画詳細（承認／却下／差し戻し、個別コメント）
- `src/app/[eventSlug]/admin/broadcasts` — 管理側：一斉連絡・未提出団体へのリマインド
- `src/app/[eventSlug]/admin/groups` — 管理側：団体の追加・予算配分・合言葉再設定
- `src/app/[eventSlug]/admin/fields` — 管理側：提出項目の追加（既存の提出物には未入力のまま反映）

データはすべて `events.id`（イベント単位）に紐づく設計のため、Phase 2 の複数イベント同時稼働は
新しいイベント行を追加するだけで対応できます（スキーマ変更不要）。

認証は団体の合言葉／管理者ID・パスワードともに bcrypt でハッシュ化して保存し、
Supabaseへのアクセスはサーバー側の service_role キー経由のみに限定しています
（全テーブルでRLSを有効化し、ポリシーは定義していないため anon キーからは読み書きできません）。

## デプロイ

Vercel + Supabase を想定しています。Vercel のプロジェクト設定で `.env.local` と同じ環境変数
（`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SESSION_SECRET`）を設定してください。
