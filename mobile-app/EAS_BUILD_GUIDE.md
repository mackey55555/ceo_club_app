# EAS Build ガイド - iPhoneテスト配信

遠隔地のメンバーのiPhoneでアプリを実行するための手順です。

## 目次
1. [事前準備](#事前準備)
2. [Apple Developerアカウントの設定](#apple-developerアカウントの設定)
3. [EAS Buildの設定](#eas-buildの設定)
4. [iOSビルドの実行](#iosビルドの実行)
5. [TestFlightへの配信](#testflightへの配信)
6. [メンバーへの配信](#メンバーへの配信)

---

## 事前準備

### 1. Expoアカウントの作成

1. [Expo](https://expo.dev)でアカウントを作成
2. ログイン後、プロジェクトを作成（または既存プロジェクトをリンク）

### 2. EAS CLIのインストール

```bash
npm install -g eas-cli
```

### 3. EASにログイン

```bash
cd mobile-app
eas login
```

### 4. プロジェクトの初期化

```bash
cd mobile-app
eas build:configure
```

これにより `eas.json` ファイルが作成されます。

---

## Apple Developerアカウントの設定

### 1. Apple Developerアカウントの取得

- [Apple Developer Program](https://developer.apple.com/programs/)に登録（年間$99）
- または、既存のApple Developerアカウントを使用

### 2. 証明書とプロビジョニングプロファイルの準備

EAS Buildが自動的に作成してくれますが、手動で設定することも可能です。

**自動設定（推奨）:**
```bash
cd mobile-app
eas credentials
```

このコマンドで、証明書とプロビジョニングプロファイルを自動生成できます。

---

## EAS Buildの設定

### eas.jsonの設定

`mobile-app/eas.json` を確認・編集：

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
        "simulator": false,
        "buildConfiguration": "Release"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### app.jsonの確認

`mobile-app/app.json` で以下を確認：

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.ceoclub.app"
    }
  }
}
```

---

## iOSビルドの実行

### 1. TestFlight用ビルド（推奨）

```bash
cd mobile-app
eas build --platform ios --profile preview
```

**対話形式で以下を設定:**
- Apple Developerアカウントの選択
- 証明書の作成方法（自動推奨）
- プロビジョニングプロファイルの作成方法（自動推奨）

### 2. ビルド状況の確認

```bash
eas build:list
```

または、[Expo Dashboard](https://expo.dev)で確認できます。

### 3. ビルド完了の待機

ビルドには通常10-20分かかります。完了すると通知が届きます。

---

## TestFlightへの配信

### 1. ビルドをApp Store Connectに送信

```bash
cd mobile-app
eas submit --platform ios --latest
```

**初回のみ必要な情報:**
- Apple ID（App Store Connectのアカウント）
- App-Specific Password（Apple IDの「アプリ用パスワード」を生成）

### 2. App Store Connectでの確認

1. [App Store Connect](https://appstoreconnect.apple.com)にログイン
2. 「マイApp」→「TestFlight」タブを開く
3. ビルドが処理中であることを確認（通常5-10分）

### 3. ビルドの承認

- ビルドが処理完了したら、「承認」ボタンをクリック
- 初回のみ、輸出コンプライアンス情報を入力

---

## メンバーへの配信

### 方法1: TestFlight経由（推奨）

#### 1. 内部テスターの追加

1. App Store Connectで「TestFlight」タブを開く
2. 「内部テスト」セクションで「+」をクリック
3. メンバーのメールアドレスを追加
   - メンバーはApple IDでログインする必要があります

#### 2. メンバーへの招待

- メンバーに招待メールが自動送信されます
- または、手動で招待リンクを送信することも可能

#### 3. メンバーの操作

1. メールの招待リンクを開く
2. TestFlightアプリをインストール（初回のみ）
3. TestFlightアプリから「CEO倶楽部」をインストール

### 方法2: 外部テスター（100人まで）

1. App Store Connectで「外部テスト」グループを作成
2. ビルドを外部テストグループに追加
3. 審査提出（初回のみ、通常1-2日）
4. 審査通過後、公開リンクをメンバーに共有

### 方法3: Ad Hoc配布（最大100台）

TestFlightを使わずに直接インストールする方法：

```bash
cd mobile-app
eas build --platform ios --profile preview --type adhoc
```

ビルド完了後：
1. ビルドをダウンロード
2. メンバーのiPhoneのUDIDを取得
3. Apple Developerでデバイスを登録
4. プロビジョニングプロファイルを再生成
5. `.ipa`ファイルを配布（AirDrop、メール、Web経由など）

---

## トラブルシューティング

### ビルドエラー

**証明書エラー:**
```bash
eas credentials
```
で証明書を再生成

**バンドルIDの競合:**
- `app.json`の`bundleIdentifier`を確認
- Apple Developerで既に使用されている場合は変更が必要

### TestFlightでビルドが表示されない

- ビルドの処理が完了するまで待つ（5-10分）
- App Store Connectで「TestFlight」タブを確認
- ビルドの有効期限を確認（90日間有効）

### メンバーがインストールできない

- TestFlightアプリがインストールされているか確認
- メンバーのApple IDでログインしているか確認
- 招待メールが届いているか確認

---

## よくある質問

### Q: 無料で配信できますか？

A: TestFlightは無料ですが、Apple Developer Program（年間$99）が必要です。

### Q: 何台のデバイスでテストできますか？

A: 
- 内部テスター: 無制限
- 外部テスター: 10,000人まで
- Ad Hoc: 100台まで

### Q: ビルドは何回までできますか？

A: EAS Buildの無料プランでも十分な回数が利用できます。制限はありません。

### Q: アプリの更新はどうすればいいですか？

A: 
1. コードを変更
2. `app.json`の`version`を更新（例: `1.0.1`）
3. `eas build --platform ios --profile preview`を実行
4. `eas submit --platform ios --latest`でTestFlightに送信

---

## 次のステップ

1. **本番環境への配信**
   - App Storeへの申請準備
   - プライバシーポリシーの作成
   - アプリ説明文の作成

2. **継続的な配信**
   - CI/CDパイプラインの構築
   - 自動ビルド・配信の設定

3. **モニタリング**
   - クラッシュレポートの設定
   - アナリティクスの統合


