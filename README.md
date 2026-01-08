# CEOクラブ イベント管理アプリ

## プロジェクト構成

```
ceo_club_v2/
├── mobile-app/      # React Native + Expo モバイルアプリ
├── admin/           # Next.js 管理画面
├── web/             # Next.js 非会員申込ページ
├── prisma/          # Prismaスキーマ・マイグレーション
└── supabase/        # Supabase設定・SQLマイグレーション（参考用）
```

## セットアップ

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. プロジェクトのURLとAnon Keyを取得

### 2. 環境変数の設定

各プロジェクトのルートに`.env`ファイルを作成し、Supabaseの認証情報を設定してください。

#### モバイルアプリ (`mobile-app/.env`)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 管理画面 (`admin/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Web (`web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. データベースマイグレーション

**Prismaを使用したマイグレーション管理（推奨）**

1. `.env`ファイルにSupabaseのデータベース接続URLを設定：
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.zoacscfmsuezjgldkjze.supabase.co:5432/postgres?sslmode=require"
   ```
   （Supabaseダッシュボードの Settings > Database > Connection string から取得）

2. Prismaクライアントを生成：
   ```bash
   npm run db:generate
   ```

3. マイグレーションを実行：
   ```bash
   npm run db:migrate
   ```

4. シードデータを投入：
   ```bash
   npm run db:seed
   ```

詳細は `PRISMA_SETUP.md` を参照してください。

**従来のSQLマイグレーション（代替方法）**

SupabaseダッシュボードのSQL Editorで、以下の順序でSQLファイルを実行：
1. `supabase/migrations/001_initial_schema.sql` - テーブル作成
2. `supabase/migrations/002_rls_policies.sql` - Row Level Securityポリシー設定
3. `supabase/migrations/003_auth_integration.sql` - Auth連携設定
4. `supabase/migrations/004_fix_users_table.sql` - usersテーブル修正

### 4. 各プロジェクトの起動

#### モバイルアプリ
```bash
cd mobile-app
npm install
npm start
```

#### 管理画面
```bash
cd admin
npm install
npm run dev
```

#### Web（非会員申込ページ）
```bash
cd web
npm install
npm run dev
```

## カラーテーマ

- **メインカラー**: `#243266` (濃い青)
- **サブカラー**: `#a8895b` (ゴールド/ベージュ)

## 開発フェーズ

現在の実装状況：
- ✅ プロジェクト構造の作成
- ✅ Supabase設定
- ✅ データベーススキーマ（テーブル定義・RLSポリシー）
- ✅ モバイルアプリ基本構造
- ✅ 認証機能（ログイン・会員登録申請・パスワードリセット）
- ✅ モバイルアプリ基本画面（お知らせ・イベント・参加履歴・会員証）
- ✅ プロフィール編集機能
- ✅ 管理画面基本構造（ログイン・ダッシュボード）
- ✅ 非会員申込ページ
- ⏳ お知らせ・イベントの詳細機能
- ⏳ 管理画面の各管理機能

詳細は `event-app-design.md` を参照してください。

