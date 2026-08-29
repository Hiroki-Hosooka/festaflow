-- デモ用シードデータ（探究イベント2026を想定）
-- 管理者ログイン: ID = committee / パスワード = committee2026
-- 団体ログイン: 団体を選択 + 合言葉（下記コメント参照）

insert into events (id, slug, name, admin_login_id, admin_password_hash)
values (
  '00000000-0000-0000-0000-000000000001',
  'tankyu2026',
  '探究イベント2026',
  'committee',
  crypt('committee2026', gen_salt('bf'))
);

-- 団体と合言葉（すべて「sagasu」+団体名の頭文字、デモ用に単純化）
insert into groups (event_id, name, passphrase_hash, budget_allocated) values
  ('00000000-0000-0000-0000-000000000001', '3年A組', crypt('sagasu-3a', gen_salt('bf')), 20000),
  ('00000000-0000-0000-0000-000000000001', '2年B組', crypt('sagasu-2b', gen_salt('bf')), 15000),
  ('00000000-0000-0000-0000-000000000001', '1年C組', crypt('sagasu-1c', gen_salt('bf')), 25000),
  ('00000000-0000-0000-0000-000000000001', '美術部', crypt('sagasu-art', gen_salt('bf')), 10000),
  ('00000000-0000-0000-0000-000000000001', '軽音部', crypt('sagasu-band', gen_salt('bf')), 15000);

-- 追加項目のデモ（管理側が後から追加した項目、という想定）
insert into form_fields (event_id, key, label, field_type, required, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'stage_day', '実施日（1日目/2日目）', 'text', false, 0);
