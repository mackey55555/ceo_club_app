# EAS Build クイックスタート

遠隔地のメンバーのiPhoneでアプリを実行する最短手順です。

## 前提条件

- [ ] Apple Developerアカウント（年間$99）
- [ ] Expoアカウント（無料）

## 5分で始める

### 1. EAS CLIのインストールとログイン

```bash
npm install -g eas-cli
cd mobile-app
eas login
```

### 2. プロジェクトのリンク（初回のみ）

```bash
eas build:configure
```

既に`eas.json`が存在する場合は、このステップはスキップできます。

### 3. iOSビルドの実行

```bash
eas build --platform ios --profile preview
```

対話形式で以下を設定：
- Apple Developerアカウントを選択
- 証明書の作成方法: **自動**を選択（推奨）
- プロビジョニングプロファイル: **自動**を選択（推奨）

### 4. ビルド完了を待つ（10-20分）

```bash
eas build:list
```

または、[Expo Dashboard](https://expo.dev)で確認。

### 5. TestFlightに送信

```bash
eas submit --platform ios --latest
```

初回のみ：
- Apple IDを入力
- App-Specific Passwordを入力（[Apple ID設定](https://appleid.apple.com)で生成）

### 6. App Store Connectで確認

1. [App Store Connect](https://appstoreconnect.apple.com)にログイン
2. 「マイApp」→「TestFlight」タブ
3. ビルドが処理完了するまで待つ（5-10分）
4. 「承認」ボタンをクリック

### 7. メンバーを招待

1. App Store Connectの「TestFlight」タブ
2. 「内部テスト」セクションで「+」をクリック
3. メンバーのメールアドレスを追加
4. メンバーに招待メールが送信されます

### 8. メンバーの操作

1. 招待メールのリンクを開く
2. TestFlightアプリをインストール（初回のみ）
3. TestFlightアプリから「CEO倶楽部」をインストール

---

## よくあるエラーと解決方法

### エラー: "No Apple Developer account found"

**解決方法:**
```bash
eas credentials
```
でApple Developerアカウントを設定

### エラー: "Bundle identifier already exists"

**解決方法:**
`app.json`の`bundleIdentifier`を変更：
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.ceoclub.app.yourcompany"
    }
  }
}
```

### エラー: "App-Specific Password required"

**解決方法:**
1. [Apple ID設定](https://appleid.apple.com)にログイン
2. 「サインインとセキュリティ」→「アプリ用パスワード」
3. 新しいパスワードを生成
4. `eas submit`コマンドで使用

---

## 次のビルド（更新時）

コードを変更した後：

```bash
# 1. バージョンを更新（app.json）
# "version": "1.0.1" など

# 2. ビルド
eas build --platform ios --profile preview

# 3. TestFlightに送信
eas submit --platform ios --latest
```

---

## 詳細情報

詳細な手順は `EAS_BUILD_GUIDE.md` を参照してください。


