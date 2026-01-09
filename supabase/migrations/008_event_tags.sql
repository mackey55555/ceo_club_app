-- イベントタグマスタ
CREATE TABLE IF NOT EXISTS event_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- イベント-タグ中間テーブル
CREATE TABLE IF NOT EXISTS event_event_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES event_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, tag_id)
);

-- RLSポリシー（タグマスタは全員が読み取り可能、書き込みも全員可能）
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_tags_select_policy" ON event_tags
    FOR SELECT
    USING (true);

CREATE POLICY "event_tags_insert_policy" ON event_tags
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "event_tags_update_policy" ON event_tags
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "event_tags_delete_policy" ON event_tags
    FOR DELETE
    USING (true);

-- RLSポリシー（イベント-タグ中間テーブルは全員が読み取り・書き込み可能）
ALTER TABLE event_event_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_event_tags_select_policy" ON event_event_tags
    FOR SELECT
    USING (true);

CREATE POLICY "event_event_tags_insert_policy" ON event_event_tags
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "event_event_tags_update_policy" ON event_event_tags
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "event_event_tags_delete_policy" ON event_event_tags
    FOR DELETE
    USING (true);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_event_event_tags_event_id ON event_event_tags(event_id);
CREATE INDEX IF NOT EXISTS idx_event_event_tags_tag_id ON event_event_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_event_tags_sort_order ON event_tags(sort_order);

