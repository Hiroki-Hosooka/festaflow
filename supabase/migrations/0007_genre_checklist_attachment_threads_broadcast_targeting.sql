-- 企画ジャンル別の動的フォーム: classification_options に 'genre' カテゴリを追加
alter table classification_options drop constraint if exists classification_options_category_check;
alter table classification_options add constraint classification_options_category_check
  check (category in ('affiliation', 'area', 'genre'));

-- 既存イベントにジャンルの初期選択肢を投入（動作継続のため。学校側で自由に編集可能）
insert into classification_options (event_id, category, value, sort_order)
select e.id, 'genre', v.value, v.ord
from events e
cross join (values ('展示', 0), ('ステージ', 1), ('模擬店', 2), ('体験・ワークショップ', 3)) as v(value, ord)
on conflict (event_id, category, value) do nothing;

-- submissions: 企画ジャンル・確認チェック
alter table submissions add column if not exists genre text;
alter table submissions add column if not exists teacher_check boolean not null default false;

-- form_fields: ジャンルごとの出し分け（null/空配列 = 全ジャンル共通）
alter table form_fields add column if not exists applicable_genres text[];

-- broadcasts: 複数の任意団体を選んで配信
alter table broadcasts drop constraint if exists broadcasts_target_type_check;
alter table broadcasts add constraint broadcasts_target_type_check
  check (target_type in ('all', 'unsubmitted', 'custom'));
alter table broadcasts add column if not exists target_group_ids uuid[];

-- ファイルごとの個別審査コメントを往復スレッド形式に拡張
create table if not exists submission_attachment_comments (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null references submission_attachments(id) on delete cascade,
  sender_type text not null check (sender_type in ('admin', 'group')),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists submission_attachment_comments_attachment_id_idx
  on submission_attachment_comments (attachment_id, created_at);
alter table submission_attachment_comments enable row level security;
