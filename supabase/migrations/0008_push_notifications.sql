-- Web Push通知の購読情報（管理者・団体それぞれの端末ごと）
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  kind text not null check (kind in ('admin', 'group')),
  group_id uuid references groups(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  constraint push_subscriptions_group_id_matches_kind check (
    (kind = 'group' and group_id is not null) or (kind = 'admin' and group_id is null)
  )
);
create index on push_subscriptions (event_id, kind, group_id);
alter table push_subscriptions enable row level security;

-- 締切リマインドの重複送信防止（同じ締切×しきい値には1回だけ送る）
create table schedule_reminders_sent (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references submission_schedules(id) on delete cascade,
  threshold text not null,
  sent_at timestamptz not null default now(),
  unique (schedule_id, threshold)
);
alter table schedule_reminders_sent enable row level security;
