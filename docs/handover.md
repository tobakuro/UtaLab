# UtaLab - 引き継ぎ書

最終更新: 2026-04-29

---

## 現在地

MVP + Phase 2 完了。

| フェーズ       | 内容                                                 | 状態    |
| -------------- | ---------------------------------------------------- | ------- |
| MVP (Day 1〜7) | カラオケ採点 + AI 音声解析 + 統合                    | ✅ 完了 |
| Phase 2        | PostgreSQL + Drizzle / スコア DB 保存 / マイ楽曲一覧 | ✅ 完了 |
| Phase 2 残     | Auth.js による認証                                   | 未着手  |
| Phase 3        | Python Worker → Modal / Cloudflare R2 / Inngest      | 未着手  |
| Phase 4        | ビブラート・リズム採点 / WhisperX 歌詞同期           | 未着手  |
| Phase 5        | PWA 化 / モバイル最適化                              | 未着手  |

---

## このセッションでの変更ファイル

| ファイル                                                    | 区分         | 変更内容の要点                                                           |
| ----------------------------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `src/app/page.tsx`                                          | 既存変更     | マイ楽曲ボタンを `/songs` リンクに有効化                                 |
| `src/app/upload/page.tsx`                                   | 既存変更     | タイトル入力フィールド・4段階進捗バー追加                                |
| `src/components/layouts/page-header.tsx`                    | 既存変更     | マイ楽曲タブ（`/songs`）をナビに追加                                     |
| `src/app/api/analyze/route.ts`                              | 既存変更     | stderr キャプチャ・`songs` テーブル INSERT 追加                          |
| `src/features/karaoke/hooks/use-scoring.ts`                 | 既存変更     | `LocalStorageScoreRepository` → `ApiScoreRepository` に切り替え          |
| `worker/analyze.py`                                         | 既存変更     | CREPE → librosa pyin に置き換え                                          |
| `worker/pyproject.toml`                                     | 既存変更     | CPU 専用 torch インデックス追加、crepe 削除                              |
| `devbox.json`                                               | 既存変更     | `postgresql@16` 追加、`setup-db` / `start-db` / `stop-db` スクリプト追加 |
| `src/db/schema.ts`                                          | 新規         | `songs` / `scores` テーブル定義                                          |
| `src/db/index.ts`                                           | 新規         | `getDb()` lazy 初期化                                                    |
| `drizzle.config.ts`                                         | 新規         | Drizzle Kit 設定（dotenv 読み込み含む）                                  |
| `src/app/api/scores/route.ts`                               | 新規         | スコア保存・取得 API                                                     |
| `src/app/songs/page.tsx`                                    | 新規         | マイ楽曲一覧 Server Component                                            |
| `src/features/karaoke/repositories/api-score-repository.ts` | 新規         | API 経由スコア保存実装                                                   |
| `README.md` / `docs/commands.md` / `docs/setup.md`          | ドキュメント | Phase 2 対応に更新                                                       |

---

## 実装済みファイルの概要

### カラオケ機能

#### `src/features/karaoke/hooks/use-karaoke-session.ts`

カラオケセッション全体を管理するフック。メロディ読み込み・伴奏再生・ピッチ記録・採点完了を一括で提供する。`/karaoke/[id]` と `/test` の両方から使われる。

#### `src/features/karaoke/audio/pitch-detector.ts`

Web Audio API + AudioWorklet のラッパークラス。`start(onPitch)` / `stop()` を提供。

#### `src/features/karaoke/hooks/use-pitch-detector.ts`

`PitchDetectorNode` を React から使うフック。clarity ≥ 0.9 のピッチのみ採用してノイズを除外する。

#### `src/features/karaoke/audio/accompaniment-player.ts`

伴奏音源の再生クラス。`AudioBufferSourceNode` + `AudioContext.currentTime` で精密な時刻同期。

#### `src/features/karaoke/components/pitch-canvas.tsx`

Canvas にピッチラインを描画。青いバー(お手本)・緑の点(ユーザー)を対数スケールで表示。

#### `src/features/karaoke/scoring/scorers/pitch-scorer.ts`

音程採点ロジック。ノートの `time〜time+duration` 範囲内のフレームを評価し、セミトーン±2以内を一致として100点満点で算出。

### データ層

#### `src/db/schema.ts`

`songs`（解析済み楽曲）と `scores`（採点結果）の2テーブル定義。

#### `src/db/index.ts`

`getDb()` 関数で lazy 初期化。`DATABASE_URL` が未設定の場合は実行時エラーにする（ビルド時にはエラーにならない）。

#### `src/features/karaoke/repositories/api-score-repository.ts`

`ScoreRepository` の API 実装。`POST /api/scores` でDBに保存、`GET /api/scores` で一覧取得。LocalStorageScoreRepository と差し替え可能。

#### `src/features/karaoke/hooks/use-scoring.ts`

採点状態管理フック。`recordPitch` でフレーム蓄積、`finish` でスコア算出・API 保存。

### API

#### `src/app/api/analyze/route.ts`

音声ファイルを受け取り `uv run python analyze.py` を呼び出す。解析完了後に `melody.json` のパスをブラウザ向けURLに書き換え、`songs` テーブルに INSERT する。タイムアウト 300秒。

#### `src/app/api/scores/route.ts`

`POST` でスコアを `scores` テーブルに保存。`GET` でスコア一覧を `songs` と JOIN して返す。

### ページ

#### `src/app/page.tsx`

ホーム画面。「マイ楽曲」ボタンを `/songs` へのリンクとして有効化。

#### `src/app/upload/page.tsx`

音声ファイルのアップロード画面。タイトル入力フィールド（未入力時はファイル名のステムをデフォルト値に使用）と、Demucs → pyin → 保存の 4 段階進捗バー（35 秒ごとに自動進行）を追加。

#### `src/app/songs/page.tsx`

解析済み楽曲の一覧を DB から取得して表示する Server Component。曲ごとのベストスコアも表示。

#### `src/components/layouts/page-header.tsx`

グローバルナビに「マイ楽曲」タブ（`/songs`）を追加。

### Python ワーカー

#### `worker/analyze.py`

Demucs + librosa pyin による音声解析。`analyze(input_path, output_dir)` の純粋関数として実装。Modal 移行時は decorator を付けるだけ。

---

## 開発環境の起動

```bash
cd ~/UtaLab
devbox shell
devbox run start-db   # PostgreSQL 起動（起動済みなら何もしない）
pnpm dev              # http://localhost:3000
```

### DB が止まっていた場合

WSL セッション終了などで PostgreSQL が落ちることがある。

```bash
devbox run start-db
```

---

## 重要な技術的経緯

### pitchy の CDN import が使えない問題

AudioWorklet は別スレッドで動くため node_modules にアクセスできない。pitchy v4 から `dist/browser/` が廃止されており CDN から import できない。esbuild で pitchy を単一ファイルにバンドルして `public/worklets/pitchy.js` に置くことで解決した。詳細は `lookingback/pitchy.md` を参照。

再バンドルが必要な場合:

```bash
pnpm bundle:worklets
```

### CREPE → librosa pyin への切り替え

`crepe==0.0.16` は `setup.py` 内でモデルファイルをダウンロードするため、uv のビルドサンドボックス（ネットワーク不可）では `uv add` が失敗する。librosa の `pyin` で同等の精度が得られるため、crepe を削除してライブラリ依存を減らした。

### torchaudio のバージョン固定

最新版は `torchcodec` を必須とするが、Nix 経由の FFmpeg は shared library のパスが標準と異なるため動かない。`torch==2.5.1` + `torchaudio==2.5.1` に固定することで解決。

### torch の CUDA 互換性エラー（WSL2）

`torch==2.5.1`（CUDA ビルド）以降で `libtorch_cuda.so: undefined symbol: ncclCommWindowDeregister` が発生する場合がある。WSL2 では CUDA ドライバーのバージョンと torch のバンドル NCCL が競合するため。

`worker/pyproject.toml` に `[[tool.uv.index]]` で PyTorch CPU インデックスを指定し、CPU 専用ビルド（`torch==2.5.1+cpu`）を使用することで解決。

```toml
[[tool.uv.index]]
name = "pytorch-cpu"
url = "https://download.pytorch.org/whl/cpu"
explicit = true

[tool.uv.sources]
torch = { index = "pytorch-cpu" }
torchaudio = { index = "pytorch-cpu" }
```

venv を再同期するには:

```bash
cd worker && uv sync
```

### WSL2 での PostgreSQL 起動エラー

`/run/postgresql/` ディレクトリが WSL2 では存在せず、Unix ソケットのロックファイルが作れない。`postgresql.conf` に `unix_socket_directories = ''` を追加して Unix ソケットを無効化し TCP のみで動かすことで解決。

```bash
# .devbox/pgdata/postgresql.conf の末尾に追加済み
unix_socket_directories = ''
```

### drizzle-kit が .env.local を読まない問題

drizzle-kit は Next.js の env ローディングを使わないため、`drizzle.config.ts` で `dotenv` を明示的に読み込む必要がある。

```typescript
import { config } from 'dotenv';
config({ path: '.env.local' });
```

---

## 参照ドキュメント

| ファイル                | 内容                                |
| ----------------------- | ----------------------------------- |
| `docs/overview.md`      | プロダクト概要・技術スタック        |
| `docs/mvp-roadmap.md`   | Day 別の詳細タスク                  |
| `docs/setup.md`         | 環境構築手順（DB セットアップ含む） |
| `docs/commands.md`      | 日常コマンドリファレンス            |
| `lookingback/pitchy.md` | pitchy 導入でてこずった経緯まとめ   |
