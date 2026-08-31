-- 団体側にも表示される「実行委員会」という固定表記を、イベントごとに変更できるようにする
alter table events add column if not exists admin_label text not null default '実行委員会';
