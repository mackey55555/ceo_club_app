# Prismaセットアップガイド

## 1. データベース接続URLの設定

`.env`ファイルにSupabaseのデータベース接続URLを設定してください。

### Supabaseから接続URLを取得する方法

1. [Supabaseダッシュボード](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. 「Settings」→「Database」を開く
4. 「Connection string」セクションで「URI」を選択
5. パスワードを入力して接続文字列をコピー

形式：
```
postgresql://postgres:[YOUR-PASSWORD]@db.zoacscfmsuezjgldkjze.supabase.co:5432/postgres?sslmode=require
```

`.env`ファイルを編集：
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.zoacscfmsuezjgldkjze.supabase.co:5432/postgres?sslmode=require"
```

## 2. Prismaクライアントの生成

```bash
npm run db:generate
```

## 3. マイグレーションの実行

### 初回マイグレーション

```bash
npm run db:migrate
```

このコマンドで：
- マイグレーションファイルが作成されます（`prisma/migrations/`）
- データベースにスキーマが適用されます
- Prismaクライアントが自動生成されます

### スキーマ変更後のマイグレーション

スキーマを変更した後：
```bash
npm run db:migrate
```

マイグレーション名を入力するよう求められます（例: `add_user_profile_image`）

### 開発中のクイック適用（本番環境では使用しない）

```bash
npm run db:push
```

注意: `db:push`はマイグレーション履歴を残しません。開発環境でのみ使用してください。

## 4. シードデータの投入

マスタデータ（ステータス等）を投入：

```bash
npm run db:seed
```

## 5. Prisma Studio（データベースGUI）

データベースを視覚的に確認・編集：

```bash
npm run db:studio
```

ブラウザで `http://localhost:5555` が開きます。

## 6. よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `npm run db:migrate` | マイグレーションを作成・適用 |
| `npm run db:push` | スキーマを直接適用（開発用） |
| `npm run db:seed` | シードデータを投入 |
| `npm run db:studio` | Prisma Studioを起動 |
| `npm run db:generate` | Prismaクライアントを生成 |
| `npm run db:reset` | データベースをリセット（全データ削除） |

## 7. マイグレーションの管理

### マイグレーションファイルの場所

```
prisma/
├── migrations/
│   └── YYYYMMDDHHMMSS_migration_name/
│       └── migration.sql
├── schema.prisma
└── seed.ts
```

### マイグレーションの確認

```bash
npx prisma migrate status
```

### 特定のマイグレーションまでロールバック

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

## 8. スキーマの変更手順

1. `prisma/schema.prisma`を編集
2. `npm run db:migrate`を実行
3. マイグレーション名を入力
4. マイグレーションファイルが自動生成される
5. データベースに適用される

## 9. 既存データベースからスキーマを取得

既存のSupabaseデータベースからスキーマをインポートする場合：

```bash
npx prisma db pull
```

これで`prisma/schema.prisma`が自動生成されます。

## 10. トラブルシューティング

### 接続エラーが発生する場合

- `.env`の`DATABASE_URL`が正しいか確認
- Supabaseのパスワードが正しいか確認
- ファイアウォール設定を確認

### マイグレーションが失敗する場合

```bash
# マイグレーション状態を確認
npx prisma migrate status

# 必要に応じてリセット（注意：全データが削除されます）
npm run db:reset
```

### Prismaクライアントが古い場合

```bash
npm run db:generate
```

## 11. 本番環境でのマイグレーション

本番環境では、マイグレーションファイルを適用：

```bash
npx prisma migrate deploy
```

このコマンドは、未適用のマイグレーションのみを実行します（対話的なプロンプトは表示されません）。

