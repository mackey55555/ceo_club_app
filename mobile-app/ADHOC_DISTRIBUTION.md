# Ad Hoc配布ガイド

TestFlightを使わずに、直接iPhoneにアプリをインストールする方法です。

## 目次
1. [UDIDの取得方法](#udidの取得方法)
2. [Apple Developerでデバイス登録](#apple-developerでデバイス登録)
3. [Ad Hocビルドの作成](#ad-hocビルドの作成)
4. [配布方法](#配布方法)

---

## UDIDの取得方法

UDID（Unique Device Identifier）は、各iPhoneに固有の識別子です。Ad Hoc配布では、最大100台のデバイスを登録できます。

### 方法1: iPhoneの設定から取得（iOS 15以降）

1. iPhoneで「設定」アプリを開く
2. 「一般」→「情報」をタップ
3. 「識別子」または「UDID」を長押ししてコピー

**注意:** iOS 15以降では「識別子」と表示されますが、これがUDIDです。

### 方法2: iTunes（macOS/Windows）

1. iPhoneをPCに接続
2. iTunes（またはFinder on macOS Catalina以降）を開く
3. デバイスを選択
4. 「シリアル番号」をクリックすると「識別子（UDID）」に変わる
5. コピー

### 方法3: オンラインツール

メンバーに以下のURLを共有：
- [udid.tech](https://udid.tech)
- [get.udid.io](https://get.udid.io)

これらのサイトで、メンバーが自分のUDIDを簡単に取得できます。

### 方法4: メンバーに依頼するテンプレート

メンバーに送るメッセージ例：

```
【重要】アプリインストール用の情報取得のお願い

アプリをインストールするために、お使いのiPhoneの識別子（UDID）が必要です。
以下の手順で取得をお願いします。

【取得方法】
1. iPhoneで「設定」アプリを開く
2. 「一般」→「情報」をタップ
3. 「識別子」を長押ししてコピー
4. コピーした識別子をこのメールに返信してください

または、以下のサイトで取得できます：
https://udid.tech

ご協力よろしくお願いします。
```

---

## Apple Developerでデバイス登録

### 1. Apple Developerにログイン

[Apple Developer](https://developer.apple.com/account)にログイン

### 2. デバイスの登録

1. 「Certificates, Identifiers & Profiles」をクリック
2. 左メニューから「Devices」を選択
3. 「+」ボタンをクリック
4. 「Register a New Device」を選択
5. デバイスタイプを選択（iPhone）
6. UDIDを貼り付け
7. デバイス名を入力（例: "田中太郎のiPhone"）
8. 「Continue」→「Register」

### 3. 複数デバイスの一括登録

複数のUDIDがある場合：

1. 「Devices」ページで「+」をクリック
2. 「Register Multiple Devices」を選択
3. CSVファイルをアップロード、または手動で入力

**CSV形式:**
```csv
Device ID,Device Name
00008030-001A1D1234567890,田中太郎のiPhone
00008030-001A1D0987654321,佐藤花子のiPhone
```

---

## Ad Hocビルドの作成

### 1. EAS BuildでAd Hocビルドを実行

```bash
cd mobile-app
eas build --platform ios --profile preview --type adhoc
```

または、`eas.json`にAd Hoc用のプロファイルを追加：

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      }
    },
    "adhoc": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release",
        "type": "ad-hoc"
      }
    }
  }
}
```

その後：

```bash
eas build --platform ios --profile adhoc
```

### 2. ビルド完了を待つ

```bash
eas build:list
```

### 3. ビルドのダウンロード

```bash
eas build:download --platform ios --latest
```

または、Expo Dashboardから`.ipa`ファイルをダウンロード

---

## 配布方法

### 方法1: AirDrop（推奨・最も簡単）

1. Macで`.ipa`ファイルを開く
2. メンバーのiPhoneを近くに置く
3. `.ipa`ファイルを右クリック→「共有」→「AirDrop」
4. メンバーのiPhoneを選択

**メンバーの操作:**
1. AirDropでファイルを受信
2. 「インストール」をタップ
3. 「設定」→「一般」→「VPNとデバイス管理」
4. 開発者を信頼

### 方法2: メール経由

1. `.ipa`ファイルを圧縮（ZIP形式）
2. メールで送信

**注意:** メールの添付サイズ制限（通常25MB）に注意

### 方法3: Web経由（推奨）

1. `.ipa`ファイルをWebサーバーにアップロード
2. メンバーにダウンロードリンクを共有

**HTMLファイル例（`install.html`）:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CEO倶楽部アプリのインストール</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            text-align: center;
            padding: 20px;
        }
        .install-button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #243266;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h1>CEO倶楽部アプリ</h1>
    <p>以下のボタンをタップしてアプリをインストールしてください。</p>
    <a href="itms-services://?action=download-manifest&url=https://your-domain.com/manifest.plist" class="install-button">
        インストール
    </a>
    
    <h2>インストール手順</h2>
    <ol style="text-align: left; max-width: 500px; margin: 0 auto;">
        <li>上記の「インストール」ボタンをタップ</li>
        <li>「インストール」をタップ</li>
        <li>ホーム画面にアプリが追加されます</li>
        <li>初回起動時、「設定」→「一般」→「VPNとデバイス管理」で開発者を信頼してください</li>
    </ol>
</body>
</html>
```

**manifest.plistファイル:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>https://your-domain.com/ceo-club-app.ipa</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>com.ceoclub.app</string>
                <key>bundle-version</key>
                <string>1.0.0</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>CEO倶楽部</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>
```

### 方法4: TestFlight（Ad Hocの代替）

Ad Hocの制限（100台）を超える場合は、TestFlightを使用：
- 内部テスター: 無制限
- 外部テスター: 10,000人まで

---

## メンバー側のインストール手順

メンバーに送る手順書：

### iPhoneでのインストール手順

1. **ファイルの受信**
   - AirDrop、メール、またはWebから`.ipa`ファイルを取得

2. **インストール**
   - `.ipa`ファイルをタップ
   - 「インストール」をタップ

3. **開発者の信頼（初回のみ）**
   - 「設定」アプリを開く
   - 「一般」→「VPNとデバイス管理」（または「デバイス管理」）
   - 開発者名をタップ
   - 「信頼」をタップ

4. **アプリの起動**
   - ホーム画面からアプリを起動

---

## トラブルシューティング

### エラー: "Unable to install"

**原因:**
- UDIDが登録されていない
- プロビジョニングプロファイルにデバイスが含まれていない

**解決方法:**
1. UDIDが正しく登録されているか確認
2. 新しいAd Hocビルドを作成（デバイス登録後）

### エラー: "Untrusted Developer"

**解決方法:**
1. 「設定」→「一般」→「VPNとデバイス管理」
2. 開発者を信頼

### アプリが起動しない

**原因:**
- 証明書の有効期限切れ
- プロビジョニングプロファイルの有効期限切れ

**解決方法:**
新しいAd Hocビルドを作成

---

## Ad Hoc vs TestFlight 比較

| 項目 | Ad Hoc | TestFlight |
|------|--------|------------|
| デバイス数制限 | 100台 | 無制限（内部） |
| 審査 | 不要 | 不要（内部） |
| 配布の簡単さ | やや複雑 | 簡単 |
| 更新の容易さ | 手動 | 自動通知 |
| 推奨用途 | 少数のテスト | 多数のテスト |

**推奨:** 10人以下ならAd Hoc、それ以上ならTestFlight

---

## 次のステップ

1. **UDIDの収集**
   - メンバーに依頼
   - スプレッドシートで管理

2. **デバイス登録**
   - Apple Developerで一括登録

3. **ビルドと配布**
   - Ad Hocビルドを作成
   - 配布方法を選択

4. **サポート**
   - メンバーにインストール手順を共有


