# UtaLab - 日常コマンドリファレンス

環境構築済みのメンバー向け。毎回の起動手順とプッシュ前のチェック手順をまとめる。

---

## 1. 開発サーバーの起動

```bash
# 1. プロジェクトディレクトリへ移動
cd ~/UtaLab

# 2. Devbox シェルに入る
devbox shell

# 3. PostgreSQL を起動（起動済みなら何もしない）
devbox run start-db

# 4. リモートの最新を取得
git pull origin develop

# 5. 依存関係を更新（package.json に変更があった時のみ）
pnpm install

# 6. 開発サーバー起動
pnpm dev
```

起動に成功すると以下のように表示される:

```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
✓ Ready in x.xs
```

Windows のブラウザで `http://localhost:3000` にアクセスして確認する。

---

## 2. DB 操作

```bash
# スキーマを DB に反映（テーブル作成・カラム追加など）
pnpm db:push

# Drizzle Studio を起動（ブラウザで DB の中身を確認できる GUI）
pnpm db:studio

# マイグレーションファイルを生成（本番移行時に使う）
pnpm db:generate
```

### PostgreSQL サーバー管理

```bash
devbox run start-db   # 起動（起動済みなら何もしない）
devbox run stop-db    # 停止
devbox run setup-db   # 初回セットアップ（initdb → postgresql.conf 修正 → 起動 → DB 作成）
```

### よくある DB のトラブル

**「PostgreSQL は既に起動中」と出るのに接続できない**

WSL セッション終了で旧プロセスが死んでいるが PID ファイルが残っている状態。

```bash
rm .devbox/pgdata/postmaster.pid
devbox run start-db
```

---

## 3. プッシュ前のコードチェック

```bash
# フォーマットを自動修正
pnpm format

# ESLint でコード品質チェック
pnpm lint

# TypeScript の型チェックを含むビルド確認
pnpm build
```

ワンライナー:

```bash
pnpm format && pnpm lint && pnpm build
```

| コマンド      | 内容                        | エラー時の対処                       |
| ------------- | --------------------------- | ------------------------------------ |
| `pnpm format` | Prettier で自動整形         | 実行後に変更ファイルを再ステージする |
| `pnpm lint`   | ESLint でコードの問題を検出 | 指摘箇所を修正して再実行             |
| `pnpm build`  | 本番ビルドで型エラーを検出  | エラーメッセージを確認して修正       |

---

## 4. Python ワーカー

```bash
# 音声ファイルを解析してローカル確認
cd ~/UtaLab/worker
uv run python analyze.py <音声ファイル> ./output_test

# 出力物
# output_test/accompaniment.wav — ボーカル除去済み伴奏
# output_test/melody.json       — ピッチ列 JSON
```

---

## 5. AudioWorklet の再バンドル

pitchy のバージョンを上げた場合など、`public/worklets/pitchy.js` を再生成する。

```bash
pnpm bundle:worklets
```

---

## 6. ブランチ運用

```bash
# 機能開発
git checkout -b feature/機能名

# バグ修正
git checkout -b fix/内容
```

- `main` ブランチへの直接コミットはしない
- PR を通してマージする
