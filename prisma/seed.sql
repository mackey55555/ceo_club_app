-- 会員ステータスの初期データ
INSERT INTO member_statuses (id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'pending', '承認待ち'),
    ('00000000-0000-0000-0000-000000000002', 'active', '有効'),
    ('00000000-0000-0000-0000-000000000003', 'suspended', '停止中'),
    ('00000000-0000-0000-0000-000000000004', 'rejected', '却下')
ON CONFLICT (name) DO NOTHING;

-- お知らせステータスの初期データ
INSERT INTO news_statuses (id, name) VALUES
    ('00000000-0000-0000-0000-000000000101', 'draft'),
    ('00000000-0000-0000-0000-000000000102', 'published'),
    ('00000000-0000-0000-0000-000000000103', 'archived')
ON CONFLICT (name) DO NOTHING;

-- イベントステータスの初期データ
INSERT INTO event_statuses (id, name) VALUES
    ('00000000-0000-0000-0000-000000000201', 'draft'),
    ('00000000-0000-0000-0000-000000000202', 'published'),
    ('00000000-0000-0000-0000-000000000203', 'closed'),
    ('00000000-0000-0000-0000-000000000204', 'cancelled')
ON CONFLICT (name) DO NOTHING;

-- お知らせのテストデータ（テストユーザーが存在する場合のみ）
-- テストユーザーのIDを取得して使用
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- 最初のアクティブユーザーを取得（存在する場合）
    SELECT id INTO test_user_id FROM users WHERE status_id = '00000000-0000-0000-0000-000000000002' LIMIT 1;
    
    -- ユーザーが存在する場合のみお知らせを作成
    IF test_user_id IS NOT NULL THEN
        -- テストお知らせ1
        INSERT INTO news (id, title, body, thumbnail_url, status_id, publish_at, created_by)
        VALUES (
            gen_random_uuid(),
            'CEOクラブアプリがリリースされました',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"CEOクラブイベント管理アプリがリリースされました。今後、イベント情報やお知らせをこちらで配信いたします。"}]}]}',
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
            '00000000-0000-0000-0000-000000000102', -- published
            NOW(),
            test_user_id
        )
        ON CONFLICT DO NOTHING;

        -- テストお知らせ2
        INSERT INTO news (id, title, body, thumbnail_url, status_id, publish_at, created_by)
        VALUES (
            gen_random_uuid(),
            '次回イベントのご案内',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"次回のCEOクラブイベントを開催いたします。詳細はイベントページをご確認ください。"}]}]}',
            'https://images.unsplash.com/photo-1540575467063-178a50c2e87c?w=800&h=600&fit=crop',
            '00000000-0000-0000-0000-000000000102', -- published
            NOW() - INTERVAL '1 day',
            test_user_id
        )
        ON CONFLICT DO NOTHING;

        -- テストお知らせ3
        INSERT INTO news (id, title, body, thumbnail_url, status_id, publish_at, created_by)
        VALUES (
            gen_random_uuid(),
            'システムメンテナンスのお知らせ',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"来週、システムメンテナンスを実施いたします。ご不便をおかけいたしますが、よろしくお願いいたします。"}]}]}',
            'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop',
            '00000000-0000-0000-0000-000000000102', -- published
            NOW() - INTERVAL '2 days',
            test_user_id
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- イベントのテストデータ（テストユーザーが存在する場合のみ）
DO $$
DECLARE
    test_user_id UUID;
    published_status_id UUID := '00000000-0000-0000-0000-000000000202'; -- published
BEGIN
    -- 最初のアクティブユーザーを取得（存在する場合）
    SELECT id INTO test_user_id FROM users WHERE status_id = '00000000-0000-0000-0000-000000000002' LIMIT 1;
    
    -- ユーザーが存在する場合のみイベントを作成
    IF test_user_id IS NOT NULL THEN
        -- テストイベント1: 今後のイベント
        INSERT INTO events (
            id, title, body, thumbnail_url, event_date, start_time, end_time, venue, capacity,
            cancel_deadline, status_id, publish_at, allow_guest, created_by
        )
        VALUES (
            gen_random_uuid(),
            'CEOクラブ新年会 2026',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"新年を迎え、CEOクラブの新年会を開催いたします。会員の皆様との交流の場として、ぜひご参加ください。"}]}]}',
            'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
            (NOW() + INTERVAL '30 days')::DATE,
            '18:00:00',
            '21:00:00',
            '東京・ホテルオークラ',
            100,
            (NOW() + INTERVAL '25 days'),
            published_status_id,
            NOW(),
            true,
            test_user_id
        )
        ON CONFLICT DO NOTHING;

        -- テストイベント2: 来月のイベント
        INSERT INTO events (
            id, title, body, thumbnail_url, event_date, start_time, end_time, venue, capacity,
            cancel_deadline, status_id, publish_at, allow_guest, created_by
        )
        VALUES (
            gen_random_uuid(),
            '経営者セミナー「DX推進の最前線」',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"デジタルトランスフォーメーション（DX）を推進する経営者のためのセミナーです。最新の事例と実践的なノウハウをお伝えします。"}]}]}',
            'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
            (NOW() + INTERVAL '45 days')::DATE,
            '14:00:00',
            '17:00:00',
            '東京・大手町サンケイプラザ',
            50,
            (NOW() + INTERVAL '40 days'),
            published_status_id,
            NOW(),
            false,
            test_user_id
        )
        ON CONFLICT DO NOTHING;

        -- テストイベント3: 今週末のイベント
        INSERT INTO events (
            id, title, body, thumbnail_url, event_date, start_time, end_time, venue, capacity,
            cancel_deadline, status_id, publish_at, allow_guest, created_by
        )
        VALUES (
            gen_random_uuid(),
            'CEOクラブ定例会',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"定例のCEOクラブ会合です。会員の皆様の情報交換の場として開催いたします。"}]}]}',
            'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop',
            (NOW() + INTERVAL '7 days')::DATE,
            '19:00:00',
            '21:00:00',
            '東京・六本木ヒルズ',
            30,
            (NOW() + INTERVAL '5 days'),
            published_status_id,
            NOW(),
            false,
            test_user_id
        )
        ON CONFLICT DO NOTHING;

        -- テストイベント4: 過去のイベント（参考用）
        INSERT INTO events (
            id, title, body, thumbnail_url, event_date, start_time, end_time, venue, capacity,
            cancel_deadline, status_id, publish_at, allow_guest, created_by
        )
        VALUES (
            gen_random_uuid(),
            'CEOクラブ忘年会 2025',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"2025年の忘年会を開催いたしました。多くの会員の皆様にご参加いただき、ありがとうございました。"}]}]}',
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
            (NOW() - INTERVAL '15 days')::DATE,
            '18:00:00',
            '21:00:00',
            '東京・帝国ホテル',
            80,
            (NOW() - INTERVAL '20 days'),
            published_status_id,
            (NOW() - INTERVAL '30 days'),
            true,
            test_user_id
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

