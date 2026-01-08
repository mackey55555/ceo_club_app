-- 会員ステータスマスタ
CREATE TABLE IF NOT EXISTS member_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初期データ投入
INSERT INTO member_statuses (id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'pending', '承認待ち'),
    ('00000000-0000-0000-0000-000000000002', 'active', '有効'),
    ('00000000-0000-0000-0000-000000000003', 'suspended', '停止中'),
    ('00000000-0000-0000-0000-000000000004', 'rejected', '却下')
ON CONFLICT (name) DO NOTHING;

-- サークルマスタ
CREATE TABLE IF NOT EXISTS circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会員テーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    profile_image_url VARCHAR(500),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE,
    company_name VARCHAR(200),
    district VARCHAR(100),
    status_id UUID NOT NULL REFERENCES member_statuses(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    expo_push_token VARCHAR(255),
    terms_agreed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会員-サークル中間テーブル
CREATE TABLE IF NOT EXISTS user_circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, circle_id)
);

-- お知らせステータスマスタ
CREATE TABLE IF NOT EXISTS news_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO news_statuses (id, name) VALUES
    ('00000000-0000-0000-0000-000000000101', 'draft'),
    ('00000000-0000-0000-0000-000000000102', 'published'),
    ('00000000-0000-0000-0000-000000000103', 'archived')
ON CONFLICT (name) DO NOTHING;

-- お知らせテーブル
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    thumbnail_url VARCHAR(500),
    status_id UUID NOT NULL REFERENCES news_statuses(id) DEFAULT '00000000-0000-0000-0000-000000000101',
    publish_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- イベントステータスマスタ
CREATE TABLE IF NOT EXISTS event_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO event_statuses (id, name) VALUES
    ('00000000-0000-0000-0000-000000000201', 'draft'),
    ('00000000-0000-0000-0000-000000000202', 'published'),
    ('00000000-0000-0000-0000-000000000203', 'closed'),
    ('00000000-0000-0000-0000-000000000204', 'cancelled')
ON CONFLICT (name) DO NOTHING;

-- イベントテーブル
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    thumbnail_url VARCHAR(500),
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    venue VARCHAR(200),
    capacity INTEGER,
    cancel_deadline TIMESTAMP WITH TIME ZONE,
    status_id UUID NOT NULL REFERENCES event_statuses(id) DEFAULT '00000000-0000-0000-0000-000000000201',
    publish_at TIMESTAMP WITH TIME ZONE,
    allow_guest BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- イベント申込みテーブル（会員）
CREATE TABLE IF NOT EXISTS event_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'cancelled')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(event_id, user_id)
);

-- イベント申込みテーブル（非会員）
CREATE TABLE IF NOT EXISTS guest_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(200),
    job_title VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'cancelled')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- 管理者テーブル
CREATE TABLE IF NOT EXISTS administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理者操作ログテーブル
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES administrators(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status_id);
CREATE INDEX IF NOT EXISTS idx_news_publish_at ON news(publish_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_publish_at ON events(publish_at);
CREATE INDEX IF NOT EXISTS idx_event_applications_event ON event_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_applications_user ON event_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_applications_event ON guest_applications(event_id);

-- updated_at自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atトリガー
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_administrators_updated_at BEFORE UPDATE ON administrators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

