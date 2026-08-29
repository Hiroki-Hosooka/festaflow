-- Phase 2: 物品管理拡張（購入／借用の区別、学校全体で共有する在庫プール）
-- 借用物品は学校全体で1つの在庫プールとして管理し、団体ごとの割当は行わない。
-- バッティング（複数団体の希望が競合）した場合の調整は管理側が手動で行うため、
-- ここでは在庫の「要求（requested）」と「確保（secured）」を分けて記録できるようにする。

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  total_quantity integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name)
);

alter table submission_items
  add column kind text not null default 'purchase' check (kind in ('purchase', 'borrow')),
  add column inventory_item_id uuid references inventory_items(id) on delete set null,
  add column stock_status text not null default 'pending' check (stock_status in ('pending', 'secured', 'denied')),
  add column secured_quantity integer not null default 0;

create index on inventory_items (event_id);
create index on submission_items (inventory_item_id);

alter table inventory_items enable row level security;
