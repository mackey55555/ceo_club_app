# Supabaseセットアップ手順

## 1. 環境変数の確認

環境変数ファイルは既に作成済みです：
- `mobile-app/.env`
- `admin/.env.local`
- `web/.env.local`

## 2. データベースマイグレーションの実行

Supabaseダッシュボードで以下の手順を実行してください：

### 手順

1. [Supabaseダッシュボード](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 「New query」をクリック

### マイグレーション1: テーブル作成

以下のSQLファイルの内容をコピーして実行：
- `supabase/migrations/001_initial_schema.sql`

または、SupabaseダッシュボードのSQL Editorで直接実行：

```sql
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

-- （以下、001_initial_schema.sqlの全内容を実行）
```

### マイグレーション2: RLSポリシー設定

次に、以下のSQLファイルの内容を実行：
- `supabase/migrations/002_rls_policies.sql`

### マイグレーション3: Auth連携設定

Supabase Authとusersテーブルを連携させるため、以下を実行：
- `supabase/migrations/003_auth_integration.sql`

### マイグレーション4: usersテーブル修正

Supabase Authを使用する場合の修正：
- `supabase/migrations/004_fix_users_table.sql`

## 3. Supabase Authの設定

### メール認証の有効化

1. Supabaseダッシュボードで「Authentication」→「Providers」を開く
2. 「Email」が有効になっていることを確認
3. 必要に応じて「Confirm email」の設定を調整

### リダイレクトURLの設定

1. 「Authentication」→「URL Configuration」を開く
2. 「Redirect URLs」に以下を追加：
   - `ceoclub://reset-password` (モバイルアプリ用)
   - `http://localhost:3000/**` (開発用)
   - `http://localhost:3001/**` (開発用)

## 4. Storageバケットの作成（オプション）

プロフィール画像やサムネイル画像を保存する場合：

1. 「Storage」を開く
2. 「Create a new bucket」をクリック
3. バケット名: `profile-images`、公開: `true`
4. バケット名: `thumbnails`、公開: `true`

## 5. 動作確認

### モバイルアプリ
```bash
cd mobile-app
npm start
```

### 管理画面
```bash
cd admin
npm run dev
```

### Web（非会員申込ページ）
```bash
cd web
npm run dev
```

## 注意事項

- 提供されたキーが`sb_publishable_`で始まっている場合、新しいSupabaseの形式の可能性があります
- もし認証エラーが発生する場合は、Supabaseダッシュボードの「Settings」→「API」で正しい「anon/public」キーを確認してください
- データベースマイグレーションは順番に実行してください（001 → 002）

