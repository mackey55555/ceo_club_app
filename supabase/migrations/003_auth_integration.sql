-- Supabase Authとusersテーブルの連携設定

-- usersテーブルのidをSupabase AuthのユーザーIDと同期
-- 注意: Supabase Authでユーザーが作成されたときに、自動的にusersテーブルにもレコードを作成する必要があります

-- 関数: Supabase Authのユーザー作成時にusersテーブルにもレコードを作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, password_hash, full_name, status_id, terms_agreed)
  VALUES (
    NEW.id,
    NEW.email,
    '', -- Supabase Authで管理されるため空
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    '00000000-0000-0000-0000-000000000001', -- pending
    COALESCE((NEW.raw_user_meta_data->>'terms_agreed')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー: auth.usersに新しいユーザーが作成されたときに実行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- usersテーブルのemailをSupabase Authと同期（更新時）
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email = NEW.email
  WHERE id = NEW.id AND email != NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 注意: このトリガーは必要に応じて有効化してください
-- CREATE TRIGGER on_user_email_updated
--   AFTER UPDATE OF email ON public.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

