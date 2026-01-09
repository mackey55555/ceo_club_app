-- Supabase Storage RLSポリシーの設定

-- thumbnailsバケットへのアクセスを許可
-- 公開読み取りを許可
CREATE POLICY "Allow public read access for thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- アップロードを許可（anonキーでも可能）
CREATE POLICY "Allow public uploads to thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thumbnails');

-- 更新を許可（anonキーでも可能）
CREATE POLICY "Allow public updates to thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'thumbnails');

-- 削除を許可（anonキーでも可能）
CREATE POLICY "Allow public deletes from thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'thumbnails');

