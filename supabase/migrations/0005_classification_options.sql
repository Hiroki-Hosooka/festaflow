-- 所属区分・エリアの選択肢を管理者が自由に編集できるようにする

create table classification_options (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  category text not null check (category in ('affiliation', 'area')),
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, category, value)
);

create index on classification_options (event_id, category, sort_order);

alter table classification_options enable row level security;

-- 既存のCHECK制約（固定5択・2択）を撤廃し、選択肢テーブル管理に一本化
alter table submissions drop constraint if exists submissions_affiliation_check;
alter table submissions drop constraint if exists submissions_area_check;

-- 既存イベントには、これまでの固定選択肢をそのまま初期値として投入（動作継続のため）
insert into classification_options (event_id, category, value, sort_order)
select e.id, 'affiliation', v.value, v.ord
from events e
cross join (values ('1年', 0), ('2年', 1), ('3年', 2), ('部活', 3), ('有志', 4)) as v(value, ord)
on conflict (event_id, category, value) do nothing;

insert into classification_options (event_id, category, value, sort_order)
select e.id, 'area', v.value, v.ord
from events e
cross join (values ('校内', 0), ('校外', 1)) as v(value, ord)
on conflict (event_id, category, value) do nothing;
