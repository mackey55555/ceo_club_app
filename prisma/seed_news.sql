-- お知らせのテストデータ
-- 注意: created_byには実際のユーザーIDを設定する必要があります
-- まず、テストユーザーを作成してから、そのIDを使用してください

-- テストユーザーが存在する場合のみ実行
-- テストユーザーのIDを取得（email='test@example.com'のユーザー）
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- テストユーザーのIDを取得
    SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com' LIMIT 1;
    
    -- テストユーザーが存在する場合のみお知らせを作成
    IF test_user_id IS NOT NULL THEN
        -- テストお知らせ1
        INSERT INTO news (id, title, body, status_id, publish_at, created_by)
        VALUES (
            gen_random_uuid(),
            'CEOクラブアプリがリリースされました',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"CEOクラブイベント管理アプリがリリースされました。今後、イベント情報やお知らせをこちらで配信いたします。"}]}]}',
            '00000000-0000-0000-0000-000000000102', -- published
            NOW(),
            test_user_id
        )
        ON CONFLICT DO NOTHING;

        -- テストお知らせ2
        INSERT INTO news (id, title, body, status_id, publish_at, created_by)
        VALUES (
            gen_random_uuid(),
            '次回イベントのご案内',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"次回のCEOクラブイベントを開催いたします。詳細はイベントページをご確認ください。"}]}]}',
            '00000000-0000-0000-0000-000000000102', -- published
            NOW() - INTERVAL '1 day',
            test_user_id
        )
        ON CONFLICT DO NOTHING;

        -- テストお知らせ3
        INSERT INTO news (id, title, body, status_id, publish_at, created_by)
        VALUES (
            gen_random_uuid(),
            'システムメンテナンスのお知らせ',
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"来週、システムメンテナンスを実施いたします。ご不便をおかけいたしますが、よろしくお願いいたします。"}]}]}',
            '00000000-0000-0000-0000-000000000102', -- published
            NOW() - INTERVAL '2 days',
            test_user_id
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

