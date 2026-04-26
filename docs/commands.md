# UtaLab - 日常コマンドリファレンス

環境構築済みのメンバー向け。毎回の起動手順とプッシュ前のチェック手順をまとめる。

---

## 1. 開発サーバーの起動

### 手順

```bash
# 1. プロジェクトディレクトリへ移動
cd ~/utalab

# 2. Devbox シェルに入る（direnv を導入済みなら不要）
devbox shell

# 3. リモートの最新を取得
git pull origin develop

# 4. 依存関係を更新（package.json に変更があった時のみ）
pnpm install

# 5. 開発サーバー起動
pnpm dev
```

起動に成功すると以下のように表示される:

```
🎤 utalab dev environment ready
   Node:  v22.x.x
   Python:  Python 3.11.x
(devbox) your-name@your-pc:~/utalab$
...
▲ Next.js 16.x.x
- Local:        http://localhost:3000
✓ Ready in x.xs
```

Windows のブラウザで `http://localhost:3000` にアクセスして確認する。

---

## 2. プッシュ前のコードチェック

### 手順

```bash
# 1. フォーマットを自動修正（修正があればステージし直す）
pnpm format

# 2. フォーマットに差分がないか確認
pnpm format:check

# 3. ESLint でコード品質チェック
pnpm lint

# 4. TypeScript の型チェックを含むビルド確認
pnpm build
```

すべてエラーなく完了したらプッシュして良い。

### 各コマンドの役割

| コマンド           | 内容                                           | エラー時の対処                          |
| ------------------ | ---------------------------------------------- | --------------------------------------- |
| `pnpm format`      | Prettier でファイルを自動整形する              | 実行後に変更ファイルを再ステージする    |
| `pnpm format:check`| フォーマットのズレを検出する（ファイル変更なし）| `pnpm format` を実行して修正する        |
| `pnpm lint`        | ESLint でコードの問題を検出する                | 指摘箇所を修正して再実行する            |
| `pnpm build`       | 本番ビルドで型エラー・ビルドエラーを検出する   | エラーメッセージを確認して修正する      |

### ワンライナー（まとめて実行したい場合）

```bash
pnpm format && pnpm lint && pnpm build
```

---

## 3. ブランチ運用

```bash
# 機能開発
git checkout -b feature/機能名

# バグ修正
git checkout -b fix/内容
```

- `main` ブランチへの直接コミットはしない
- PR を通してマージする

---

## 4. よく使うその他のコマンド

```bash
pnpm format        # Prettier でファイルを自動整形
pnpm lint          # ESLint のみ実行
pnpm build         # 本番ビルド
pnpm start         # 本番ビルドの成果物をローカルで起動（build 後に使用）
```
