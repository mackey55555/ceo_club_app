-- usersテーブルの修正
-- Supabase Authを使用する場合、password_hashは不要になるため、NULLを許可

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- emailをSupabase Authと同期するための制約を緩和
-- （Supabase Authのemailとusersテーブルのemailは同じである必要がある）

