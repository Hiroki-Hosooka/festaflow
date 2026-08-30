-- Phase 3: 権限分離（リーダー/一般生徒）、企画分類、複数締切、添付資料、配布資料、ToDo、当番シフト

-- 権限分離：一般生徒用の合言葉（未設定なら一般生徒ログイン不可）
alter table groups
  add column member_passphrase_hash text;

-- 企画の分類
alter table submissions
  add column affiliation text check (affiliation in ('1年', '2年', '3年', '部活', '有志')),
  add column area text check (area in ('校内', '校外'));

-- 提出締切の複数登録
create table submission_schedules (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  deadline timestamptz not null,
  hint text not null default '',
  created_at timestamptz not null default now()
);

-- 添付資料（設計図など）とその個別審査
create table submission_attachments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'needs_fix')),
  review_comment text not null default '',
  uploaded_at timestamptz not null default now()
);

-- 生徒会からの公式配布資料
create table event_documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

-- クラスToDoリスト（班別）
create table todo_groups (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table todo_tasks (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  todo_group_id uuid references todo_groups(id) on delete set null,
  title text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 当番シフト配置
create table shift_configs (
  submission_id uuid primary key references submissions(id) on delete cascade,
  start_time text not null default '09:00',
  end_time text not null default '16:00',
  slot_minutes integer not null default 60 check (slot_minutes in (30, 60, 90, 120)),
  people_per_slot integer not null default 2,
  updated_at timestamptz not null default now()
);

create table shift_members (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table shift_preferences (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  member_id uuid not null references shift_members(id) on delete cascade,
  slot_label text not null,
  kind text not null check (kind in ('ng', 'want')),
  created_at timestamptz not null default now(),
  unique (member_id, slot_label, kind)
);

create table shift_assignments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  slot_label text not null,
  member_id uuid not null references shift_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (submission_id, slot_label, member_id)
);

create index on submission_schedules (event_id, deadline);
create index on submission_attachments (submission_id);
create index on event_documents (event_id);
create index on todo_groups (submission_id);
create index on todo_tasks (submission_id, todo_group_id);
create index on shift_members (submission_id);
create index on shift_preferences (submission_id, slot_label);
create index on shift_assignments (submission_id, slot_label);

alter table submission_schedules enable row level security;
alter table submission_attachments enable row level security;
alter table event_documents enable row level security;
alter table todo_groups enable row level security;
alter table todo_tasks enable row level security;
alter table shift_configs enable row level security;
alter table shift_members enable row level security;
alter table shift_preferences enable row level security;
alter table shift_assignments enable row level security;

-- ファイル保管用のストレージバケット（service_roleのみが読み書きするため、objectsへのRLSポリシーは追加しない）
insert into storage.buckets (id, name, public)
values ('festaflow-files', 'festaflow-files', false)
on conflict (id) do nothing;
