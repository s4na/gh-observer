# gh-observer

経過時間を1秒ごとに表示するシンプルなCLIツールです。

## 使い方

以下のコマンドで実行できます:

```bash
npx github:s4na/gh-observer -y
```

※ `-y` フラグを付けることで、毎回の同意確認をスキップできます。

実行すると、1秒ごとに経過時間が表示されます。

終了するには `Ctrl+C` を押してください。

## 必要な環境

- Node.js (v12以上推奨)

## ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/s4na/gh-observer.git
cd gh-observer

# 実行
node index.js
```

## TODO
- [ ] npx github:s4na/gh-observer -y　って入力したら、web uiが表示されてそこでrepoを選択 & 追加できるようにする
- [ ] 設定ファイルは永続的に残る。 ~/config/ あたりにでも置いておく
- [ ] npx github:s4na/gh-observer -y って実行したら、 gh issue を監視して、新しい issue ができたら log に表示できるようにする
- [ ] 新規prについて /review で自動でレビューした上で、レビュー結果をprコメントとして投稿するようにする
- [ ] 新規issueについて、pr作成までできるようにする
