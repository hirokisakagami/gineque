# GINEQUE - Movie Streaming App

🎬 **GINEQUE**は、映像作家、役者、視聴者が集う次世代の映画ストリーミングプラットフォームです。

![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

## ✨ 主な機能

### 🎯 エンゲージメント機能
- **イントロ動画**: 初回起動時の印象的な映像体験 (`start.mp4`)
- **開発用リセット**: プロフィールからイントロ状態をリセット可能

### 👥 ユーザータイプ別体験
- **視聴者** 👥: 映画を楽しみ、新しい作品を発見
- **映像作家** 🎬: 自作品を投稿・配信
- **役者** 🎭: 演技力をアピール

### 🎨 美しいUI/UX
- 横並びカードデザインのユーザータイプ選択
- ロール別デフォルトプロフィール画像
- カラーアクセント付きインターフェース
- Netflix風のダークテーマUI

### 🎬 映像作家機能
- アルバム/ファイルからの動画アップロード
- **ファイルサイズ制限なし**
- サムネイル設定
- 作品管理・投稿

## 🚀 クイックスタート

### 前提条件
- Node.js 18以上
- React Native開発環境
- Expo CLI

### セットアップ

1. **リポジトリをクローン**
```bash
git clone https://github.com/hirokisakagami/gineque.git
cd gineque
```

2. **依存関係をインストール**
```bash
npm install
```

3. **アプリを起動**
```bash
npm start
# または
npx expo start
```

4. **デバイス/シミュレーターで実行**
- iOS: `i` を押す
- Android: `a` を押す
- Web: `w` を押す

## ⚡ フル機能で動作

**このリポジトリはフル機能版です！**

すべての設定が完了しており、他のPCでクローンしても完全に動作します：

### ✅ 設定済み項目
- **Supabase Database**: PostgreSQL データベース接続
- **Cloudflare Stream**: 動画配信・管理
- **Cloudflare Images**: 画像配信・管理  
- **認証システム**: JWT + Row Level Security
- **ファイルアップロード**: 画像・動画対応

### 🔧 バックエンド設定

#### Supabase
- **URL**: `https://sxyebfujxcgyzuiqimak.supabase.co`
- **API Key**: 設定済み（`src/config/supabase.js`）

#### Cloudflare Services
- **Account ID**: `11819e309f3bda41e3c4da6095548018`
- **API Token**: 設定済み
- **Images**: `https://imagedelivery.net/a7T4jvSHK-io9LvvC0LMeQ`
- **Stream**: `customer-tuyd0caye2jufpak.cloudflarestream.com`

## 📱 アプリフロー

1. **初回起動**: イントロ動画 (`assets/start.mp4`) 自動再生
2. **ようこそ画面**: "映画館に入る" でユーザータイプ選択へ
3. **ユーザータイプ選択**: 美しいカードUI で選択
4. **ログイン・サインアップ**: 認証処理
5. **メイン画面**: ロール別機能提供

## 📦 技術スタック

### フロントエンド
- **React Native + Expo**: クロスプラットフォーム
- **React Navigation**: ナビゲーション管理
- **Expo AV**: 動画・音声再生
- **Expo Image Picker**: メディア選択
- **LinearGradient**: 美しいグラデーション

### バックエンド  
- **Supabase**: PostgreSQL + Auth + Storage
- **Cloudflare Stream**: 動画配信 CDN
- **Cloudflare Images**: 画像配信 CDN

### 開発ツール
- **Expo EAS**: ビルド・デプロイ
- **Metro**: バンドラー

## 🗂️ プロジェクト構造

```
src/
├── components/          # 再利用可能コンポーネント
│   ├── LoadingScreen.js
│   ├── VideoPlayer.js
│   └── ...
├── screens/            # 画面コンポーネント  
│   ├── IntroVideoScreen.js    # イントロ動画
│   ├── WelcomeScreen.js       # ようこそ画面
│   ├── SignUpScreen.js        # ユーザータイプ選択 + 登録
│   ├── LoginScreen.js         # ログイン
│   ├── HomeScreen.js          # ホーム
│   ├── ProfileScreen.js       # プロフィール
│   ├── MovieEntryScreen.js    # 作品投稿（映像作家）
│   └── ...
├── contexts/           # React Context
│   ├── AuthContext.js         # 認証状態管理
│   └── DataUpdateContext.js   # データ更新管理
├── services/           # API・ビジネスロジック
├── config/             # 設定ファイル
│   ├── supabase.js           # Supabase設定
│   ├── cloudflare.js         # Cloudflare Stream設定
│   └── cloudflareImages.js   # Cloudflare Images設定
└── utils/              # ユーティリティ
```

## 🎯 デバッグ・開発

### イントロ動画リセット
```bash
# Metro bundler console で実行
require('./reset_intro.js')
```

### ビルド
```bash
# 開発ビルド
npx eas build --profile development

# 本番ビルド  
npx eas build --profile production
```

## 🔐 セキュリティ

- **Row Level Security (RLS)** 有効
- **JWT認証** によるAPIアクセス制御
- **API トークン** による外部サービス認証
- **ファイルアップロード** 時の検証・フィルタリング

## 🤝 コントリビューション

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 ライセンス

This project is licensed under the MIT License.

---

**🤖 Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>