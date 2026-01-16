# デプロイメント手順

## 目次
1. [モバイルアプリのテスト配信](#モバイルアプリのテスト配信)
2. [管理画面（Admin）のホスティング](#管理画面adminのホスティング)

---

## モバイルアプリのテスト配信

### 方法1: Expo Go（開発・テスト用）

最も簡単な方法。Expo Goアプリをインストールした端末でQRコードをスキャンするだけで動作確認できます。

#### 手順

1. **Expo CLIがインストールされているか確認**
   ```bash
   npm install -g expo-cli
   ```

2. **モバイルアプリディレクトリに移動**
   ```bash
   cd mobile-app
   ```

3. **開発サーバーを起動**
   ```bash
   npm start
   # または
   npx expo start
   ```

4. **QRコードをスキャン**
   - iOS: カメラアプリでQRコードをスキャン
   - Android: Expo GoアプリでQRコードをスキャン

5. **環境変数の確認**
   - `mobile-app/.env` ファイルに以下が設定されていることを確認：
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

#### 注意点
- Expo Goでは一部のネイティブ機能が制限される場合があります
- 本番環境での配信には適していません

---

### 方法2: EAS Build（本番ビルド配信）

実際のアプリストアに配信する前のテスト配信に最適です。開発ビルドや内部テスト用のビルドを作成できます。

#### 事前準備

1. **Expoアカウントの作成**
   - [Expo](https://expo.dev)でアカウントを作成

2. **EAS CLIのインストール**
   ```bash
   npm install -g eas-cli
   ```

3. **EASにログイン**
   ```bash
   eas login
   ```

4. **プロジェクトの初期化**
   ```bash
   cd mobile-app
   eas build:configure
   ```
   これにより `eas.json` ファイルが作成されます。

#### ビルド設定（eas.json）

`mobile-app/eas.json` を作成または編集：

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### テストビルドの作成

1. **iOS（TestFlight用）**
   ```bash
   cd mobile-app
   eas build --platform ios --profile preview
   ```
   - Apple Developerアカウントが必要です
   - ビルド完了後、TestFlightにアップロードされます

2. **Android（内部テスト用）**
   ```bash
   cd mobile-app
   eas build --platform android --profile preview
   ```
   - Google Play Consoleアカウントが必要です
   - ビルド完了後、APKまたはAABファイルがダウンロードできます

3. **両方**
   ```bash
   eas build --platform all --profile preview
   ```

#### ビルド状況の確認

```bash
eas build:list
```

#### ビルドのダウンロード

ビルド完了後、Expoダッシュボードまたは以下のコマンドでダウンロード：

```bash
eas build:download
```

---

### 方法3: EAS Update（OTA更新）

アプリストアの審査なしで、JavaScriptバンドルを更新できます。

#### 設定

1. **EAS Updateの設定**
   ```bash
   cd mobile-app
   eas update:configure
   ```

2. **app.jsonに設定を追加**
   ```json
   {
     "expo": {
       "updates": {
         "url": "https://u.expo.dev/YOUR_PROJECT_ID"
       }
     }
   }
   ```

#### 更新の公開

```bash
eas update --branch preview --message "バグ修正"
```

---

## 管理画面（Admin）のホスティング

### 方法1: Vercel（推奨）

Next.jsの開発元が提供するホスティングサービス。Next.jsに最適化されています。

#### 事前準備

1. **Vercelアカウントの作成**
   - [Vercel](https://vercel.com)でGitHubアカウントでログイン

2. **Vercel CLIのインストール（オプション）**
   ```bash
   npm install -g vercel
   ```

#### デプロイ手順（GitHub連携）

1. **GitHubリポジトリにプッシュ**
   ```bash
   git add .
   git commit -m "Deploy admin to Vercel"
   git push
   ```

2. **Vercelでプロジェクトをインポート**
   - Vercelダッシュボードで「Add New Project」
   - GitHubリポジトリを選択
   - プロジェクト設定：
     - **Framework Preset**: Next.js
     - **Root Directory**: `admin`
     - **Build Command**: `npm run build`（自動検出される）
     - **Output Directory**: `.next`（自動検出される）

3. **環境変数の設定**
   Vercelダッシュボードの「Settings」→「Environment Variables」で以下を設定：
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **デプロイ**
   - 「Deploy」ボタンをクリック
   - デプロイ完了後、URLが発行されます（例: `https://your-project.vercel.app`）

#### デプロイ手順（CLI）

1. **Vercelにログイン**
   ```bash
   cd admin
   vercel login
   ```

2. **プロジェクトをリンク**
   ```bash
   vercel link
   ```

3. **環境変数を設定**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

4. **デプロイ**
   ```bash
   vercel --prod
   ```

#### カスタムドメインの設定（オプション）

1. Vercelダッシュボードで「Settings」→「Domains」
2. ドメインを追加
3. DNS設定を更新

---

### 方法2: Netlify

#### 事前準備

1. **Netlifyアカウントの作成**
   - [Netlify](https://netlify.com)でGitHubアカウントでログイン

2. **Netlify CLIのインストール（オプション）**
   ```bash
   npm install -g netlify-cli
   ```

#### デプロイ手順

1. **netlify.tomlの作成**
   `admin/netlify.toml` を作成：
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **GitHubリポジトリにプッシュ**

3. **Netlifyでプロジェクトをインポート**
   - Netlifyダッシュボードで「Add new site」→「Import an existing project」
   - GitHubリポジトリを選択
   - ビルド設定：
     - **Base directory**: `admin`
     - **Build command**: `npm run build`
     - **Publish directory**: `.next`

4. **環境変数の設定**
   Netlifyダッシュボードの「Site settings」→「Environment variables」で設定

5. **デプロイ**
   - 自動的にデプロイが開始されます

---

### 方法3: その他のホスティングサービス

#### Railway

1. [Railway](https://railway.app)でアカウント作成
2. GitHubリポジトリを接続
3. 新しいプロジェクトを作成
4. 環境変数を設定
5. ビルドコマンド: `cd admin && npm install && npm run build`
6. スタートコマンド: `cd admin && npm start`

#### Render

1. [Render](https://render.com)でアカウント作成
2. 新しい「Web Service」を作成
3. GitHubリポジトリを接続
4. 設定：
   - **Root Directory**: `admin`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. 環境変数を設定

---

## デプロイ後の確認事項

### 管理画面

- [ ] ログイン画面が表示される
- [ ] ログインが正常に動作する
- [ ] 各管理画面が正常に表示される
- [ ] Supabase接続が正常に動作する
- [ ] 画像アップロードが正常に動作する
- [ ] 外部申込みURL（`/apply/[eventId]`）が正常に動作する

### モバイルアプリ

- [ ] アプリが正常に起動する
- [ ] ログインが正常に動作する
- [ ] イベント一覧が表示される
- [ ] ニュース一覧が表示される
- [ ] Supabase接続が正常に動作する

---

## トラブルシューティング

### 環境変数が反映されない

- ビルド後に環境変数を変更した場合は、再ビルドが必要です
- 環境変数名のタイポを確認（`NEXT_PUBLIC_` や `EXPO_PUBLIC_` プレフィックス）

### ビルドエラー

- 依存関係のインストールエラー: `package-lock.json` を削除して再インストール
- TypeScriptエラー: `tsconfig.json` の設定を確認

### Supabase接続エラー

- CORS設定を確認（Supabaseダッシュボードの「Settings」→「API」）
- 環境変数が正しく設定されているか確認

---

## 次のステップ

1. **本番環境のSupabaseプロジェクトを作成**（開発環境と分離）
2. **本番環境用の環境変数を設定**
3. **ドメインの設定**（カスタムドメインを使用する場合）
4. **SSL証明書の確認**（自動で設定されることが多い）
5. **監視・ログの設定**（エラー追跡のため）

