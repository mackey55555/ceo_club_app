-- eventsテーブルとnewsテーブルのcreated_byをNULL許可にする
-- 管理者が作成した場合はNULLを許可する

-- eventsテーブル
ALTER TABLE events 
  ALTER COLUMN created_by DROP NOT NULL;

-- newsテーブル
ALTER TABLE news 
  ALTER COLUMN created_by DROP NOT NULL;

