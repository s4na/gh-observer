# gh-observer

経過時間を1秒ごとに表示するCLIツールです。Webブラウザで経過時間を視覚的に確認できます。

## 特徴

- 📊 **Web UI**: モダンなWebインターフェースで経過時間を表示
- 🔄 **リアルタイム更新**: 1秒ごとに自動更新
- 💻 **CLI出力**: ターミナルにも経過時間をログ出力
- 🌐 **自動ブラウザ起動**: サーバー起動時に自動的にブラウザを開く
- ⚙️ **設定ファイル対応**: `~/.config/s4na-gh-observer.yaml`で設定を永続化

## 使い方

以下のコマンドで実行できます:

```bash
npx -y github:s4na/gh-observer
```

※ `-y` フラグを付けることで、パッケージインストールの同意確認をスキップできます。

実行すると:
1. HTTPサーバーが `http://localhost:3000` で起動します
2. 自動的にブラウザが開き、Webページが表示されます
3. ブラウザとターミナルの両方で経過時間が表示されます

終了するには `Ctrl+C` を押してください。

## 必要な環境

- Node.js (v18以上推奨)

## ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/s4na/gh-observer.git
cd gh-observer

# 依存パッケージをインストール
npm install

# 実行
node index.js

# テストを実行
npm test

# テストをウォッチモードで実行
npm run test:watch
```

## 機能詳細

### Web UI

- **モダンなデザイン**: グラデーション背景と見やすいタイポグラフィ
- **レスポンシブ対応**: モバイルでも快適に閲覧可能
- **APIエンドポイント**: `/api/elapsed` で経過時間をJSON形式で取得

### 設定ファイル

`~/.config/s4na-gh-observer.yaml` に設定が保存されます:

```yaml
interval: 1000              # 更新間隔(ミリ秒)
showElapsedTime: true       # 経過時間の表示
timeFormat: '24h'           # 時刻フォーマット
createdAt: 2024-01-01T00:00:00.000Z
```

## テスト

Jest を使用した自動テストを実装しています:

- `formatTime`: 時刻フォーマット機能のテスト
- `generateHTML`: HTML生成機能のテスト
- 設定ファイルパスの検証

GitHub Actions により、プッシュ・PR時に自動テストが実行されます。

## TODO
- [ ] 設定ファイルの読み込みタイミングをちゃんとする
- [x] npx -y github:s4na/gh-observer　って入力したら、web uiが表示されてそこでrepoを選択 & 追加できるようにする
- [x] 設定ファイルは永続的に残る。 ~/.config/ に置く
- [ ] npx -y github:s4na/gh-observer って実行したら、 gh issue を監視して、新しい issue ができたら log に表示できるようにする
- [ ] 新規prについて /review で自動でレビューした上で、レビュー結果をprコメントとして投稿するようにする
- [ ] 新規issueについて、pr作成までできるようにする



