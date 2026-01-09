-- eventsテーブルのidカラムにデフォルト値を設定
-- PrismaのマイグレーションでDEFAULTが設定されていない場合の修正

-- eventsテーブルのidカラムにDEFAULT gen_random_uuid()を設定
ALTER TABLE events 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- newsテーブルのidカラムにも念のため設定
ALTER TABLE news 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

