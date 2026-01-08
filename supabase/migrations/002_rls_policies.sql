-- Row Level Security (RLS) ポリシーの設定

-- usersテーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の情報のみ閲覧・更新可能
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- newsテーブル
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- 公開済みのお知らせは全員閲覧可能（認証済みユーザー）
CREATE POLICY "Authenticated users can view published news"
  ON news FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    status_id = (SELECT id FROM news_statuses WHERE name = 'published') AND
    (publish_at IS NULL OR publish_at <= NOW())
  );

-- eventsテーブル
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 公開済みのイベントは全員閲覧可能（認証済みユーザー）
CREATE POLICY "Authenticated users can view published events"
  ON events FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    status_id = (SELECT id FROM event_statuses WHERE name = 'published') AND
    (publish_at IS NULL OR publish_at <= NOW())
  );

-- 非会員向けに公開イベントの詳細を閲覧可能（認証なしでも可）
CREATE POLICY "Anyone can view published events for guest application"
  ON events FOR SELECT
  USING (
    status_id = (SELECT id FROM event_statuses WHERE name = 'published') AND
    allow_guest = true AND
    (publish_at IS NULL OR publish_at <= NOW())
  );

-- event_applicationsテーブル
ALTER TABLE event_applications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の申込みのみ閲覧・作成・更新可能
CREATE POLICY "Users can view own applications"
  ON event_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications"
  ON event_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON event_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- guest_applicationsテーブル
-- 非会員申込みは認証なしで作成可能（RLSは無効化または全員許可）
ALTER TABLE guest_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create guest applications"
  ON guest_applications FOR INSERT
  WITH CHECK (true);

-- 管理者は全データにアクセス可能（管理者テーブルで認証）
-- 注意: 実際の実装では、Supabase Authのカスタムロールを使用するか、
-- 管理者専用のAPIエンドポイント（Edge Functions）を使用することを推奨

