-- 学内イベント企画管理アプリ Phase 1 スキーマ
-- すべてのテーブルは event_id を起点に紐づく（Phase 2 の複数イベント同時稼働を見据えた設計）。
-- サーバー側は service_role キーのみで接続する前提のため、RLS は有効化してポリシーは定義しない
-- （anon / authenticated ロールからは一切アクセスできず、service_role のみが読み書きできる）。

create extension if not exists pgcrypto;

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  admin_login_id text not null,
  admin_password_hash text not null,
  created_at timestamptz not null default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  passphrase_hash text not null,
  budget_allocated integer not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, name)
);

create table form_fields (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  key text not null,
  label text not null,
  field_type text not null check (field_type in ('text', 'textarea', 'number')),
  required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, key)
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  name text not null default '',
  content text not null default '',
  location text not null default '',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'returned')),
  admin_comment text not null default '',
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, group_id)
);

create table submission_items (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  name text not null,
  quantity integer not null default 1,
  unit_price integer not null default 0,
  sort_order integer not null default 0
);

create table submission_field_values (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  field_id uuid not null references form_fields(id) on delete cascade,
  value text not null default '',
  unique (submission_id, field_id)
);

create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  target_type text not null check (target_type in ('all', 'unsubmitted')),
  body text not null,
  created_at timestamptz not null default now()
);

create table submission_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  sender_type text not null check (sender_type in ('admin', 'group')),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index on groups (event_id);
create index on form_fields (event_id, sort_order);
create index on submissions (event_id, group_id);
create index on submission_items (submission_id);
create index on submission_field_values (submission_id);
create index on broadcasts (event_id, created_at desc);
create index on submission_comments (submission_id, created_at);

alter table events enable row level security;
alter table groups enable row level security;
alter table form_fields enable row level security;
alter table submissions enable row level security;
alter table submission_items enable row level security;
alter table submission_field_values enable row level security;
alter table broadcasts enable row level security;
alter table submission_comments enable row level security;
