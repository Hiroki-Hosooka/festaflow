-- 締切の宛先団体を指定可能に（null = 全団体宛て。既存行はnullのまま＝これまで通り全団体に表示）
alter table submission_schedules add column if not exists target_group_ids uuid[];

-- 管理側・団体側それぞれが自分のカレンダーに追加できる個人的な予定
-- （締切とは別物。追加した側にしか表示されず、色は自由に選べる）
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  owner_kind text not null check (owner_kind in ('admin', 'group')),
  owner_group_id uuid references groups(id) on delete cascade,
  title text not null,
  event_date date not null,
  color text not null default '#2563eb',
  created_at timestamptz not null default now(),
  constraint calendar_events_owner_group_matches_kind check (
    (owner_kind = 'group' and owner_group_id is not null) or (owner_kind = 'admin' and owner_group_id is null)
  )
);
create index on calendar_events (event_id, owner_kind, owner_group_id, event_date);
alter table calendar_events enable row level security;
