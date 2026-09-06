-- 配布資料機能（event_documents）を廃止し、連絡（個別コメント・全体連絡）に
-- ファイル添付を統合する。既存のアップロード済みファイルは削除してよいとの合意済み。
drop table if exists event_documents;

-- 個別コメント・全体連絡それぞれに添付できるファイル（1メッセージに複数可）
create table message_attachments (
  id uuid primary key default gen_random_uuid(),
  parent_kind text not null check (parent_kind in ('comment', 'broadcast')),
  comment_id uuid references submission_comments(id) on delete cascade,
  broadcast_id uuid references broadcasts(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  constraint message_attachments_parent_matches_kind check (
    (parent_kind = 'comment' and comment_id is not null and broadcast_id is null) or
    (parent_kind = 'broadcast' and broadcast_id is not null and comment_id is null)
  )
);
create index on message_attachments (comment_id);
create index on message_attachments (broadcast_id);
alter table message_attachments enable row level security;

-- 全体連絡の重要度（通常・重要・緊急）。既存行はすべて'normal'として扱う
alter table broadcasts add column if not exists severity text not null default 'normal'
  check (severity in ('normal', 'important', 'urgent'));

-- イベントごとの見た目・ナビ構成の自由設定
-- theme: 配色プリセットのキー（src/lib/themes.ts で定義）
-- admin_nav_config / group_nav_config: [{ "key": "...", "visible": true }, ...] の並び順配列。
-- null の場合はアプリ側のデフォルト順・全表示にフォールバックする。
alter table events add column if not exists theme text not null default 'default';
alter table events add column if not exists admin_nav_config jsonb;
alter table events add column if not exists group_nav_config jsonb;
