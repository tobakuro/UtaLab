# UtaLab - 引き継ぎ書

最終更新: 2026-04-29

---

## 現在地

MVP ロードマップ **完了**。

| Day   | 内容                                           | 状態 |
| ----- | ---------------------------------------------- | ---- |
| Day 1 | Web Audio API でマイク波形表示                 | 完了 |
| Day 2 | AudioWorklet + pitchy でリアルタイムピッチ検出 | 完了 |
| Day 3 | 伴奏再生 + 時刻同期 + Canvas ピッチライン描画  | 完了 |
| Day 4 | 採点ロジック + 結果画面                        | 完了 |
| Day 5 | Python で Demucs + CREPE                       | 完了 |
| Day 6 | フロントエンドと統合                           | 完了 |
| Day 7 | UI 調整 + エラーハンドリング                   | 完了 |

---

## GitHub Issues（完了済み）

| #   | タイトル                                         |
| --- | ------------------------------------------------ |
| #5  | 採点ロジック実装（音程スコア）                   |
| #6  | 結果画面の作成                                   |
| #8  | Demucs でボーカル/伴奏分離                       |
| #9  | CREPE でメロディ抽出（ピッチ列 JSON 生成）       |
| #11 | アップロード API の作成                          |
| #12 | フロントエンド統合（アップロード UI + 画面遷移） |
| #14 | shadcn/ui での UI 調整                           |
| #15 | エラーハンドリング（マイク権限拒否・解析失敗等） |

---

## 次フェーズ（Phase 2 以降）

| フェーズ | 内容                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| Phase 2  | PostgreSQL + Drizzle / Auth.js / スコア履歴 DB 保存                           |
| Phase 3  | Python Worker → Modal.com / ストレージ → Cloudflare R2 / Inngest ジョブキュー |
| Phase 4  | ビブラート・しゃくり・リズム採点 / WhisperX 歌詞同期                          |
| Phase 5  | PWA 化 / モバイル最適化                                                       |

---

## 実装済みファイルの概要

### `src/features/karaoke/audio/pitch-detector.ts`

Web Audio API + AudioWorklet のラッパークラス。`PitchDetectorNode` として `start(onPitch)` / `stop()` を提供する。

### `src/features/karaoke/hooks/use-pitch-detector.ts`

`PitchDetectorNode` を React から使うためのフック。clarity ≥ 0.9 のピッチのみ採用してノイズを除外する。

### `src/features/karaoke/audio/accompaniment-player.ts`

伴奏音源の再生クラス。`AudioBufferSourceNode` を使い `AudioContext.currentTime` で精密な時刻同期を行う。`getCurrentTime()` が採点の時刻基準になる。

### `src/features/karaoke/components/pitch-canvas.tsx`

Canvas にピッチラインを描画するコンポーネント。青いバー(お手本)・緑の点(ユーザー)を対数スケールで表示する。

### `src/features/karaoke/scoring/scorers/pitch-scorer.ts`

音程採点ロジック。ノートの `time〜time+duration` 範囲内のユーザーフレームのみを評価対象とし、セミトーン±2以内を一致として100点満点で算出する。

### `src/features/karaoke/repositories/local-storage-score-repository.ts`

`ScoreRepository` の localStorage 実装。DB 移行時はインスタンスを差し替えるだけ。

### `src/app/api/analyze/route.ts`

音声ファイルを受け取り、`child_process.spawn` で Python ワーカーを呼び出す Route Handler。解析後に `melody.json` の `accompaniment` パスをブラウザ向け URL に書き換えて返す。タイムアウト 300秒。

### `worker/analyze.py`

Demucs + CREPE による音声解析スクリプト。`analyze(input_path, output_dir)` の純粋関数として実装しており、Modal 移行時は decorator を付けるだけ。

### `src/components/layouts/page-header.tsx`

全ページ共通のヘッダーコンポーネント。`usePathname()` でアクティブタブを自動判定する。

---

## 重要な技術的経緯

### pitchy の CDN import が使えない問題

AudioWorklet は別スレッドで動くため node_modules にアクセスできない。CDN から pitchy を import しようとしたが pitchy v4 から `dist/browser/` が廃止されており 404 になった。esbuild で pitchy を単一ファイルにバンドルして `public/worklets/pitchy.js` に置くことで解決した。詳細は `lookingback/pitchy.md` を参照。

再バンドルが必要な場合:

```bash
pnpm bundle:worklets
```

### crepe のインストール方法

`crepe==0.0.16` は `pkg_resources` に依存しているが build-system.requires に宣言していないため、通常の `uv add` でビルドが失敗する。`--no-build-isolation` で回避する。

```bash
uv pip install crepe --no-build-isolation
```

### torchaudio のバージョン固定

`torchaudio==2.11.0`（最新）は `torchcodec` を必須とするが、Nix 経由の FFmpeg は shared library のパスが標準と異なるため `torchcodec` が動かない。`torch==2.5.1` + `torchaudio==2.5.1` に固定することで解決。

---

## 開発環境の起動

```bash
cd ~/UtaLab
devbox shell
git pull
pnpm install   # package.json に変更があった時のみ
pnpm dev
```

`http://localhost:3000` でアプリを確認できる。

---

## 参照ドキュメント

| ファイル                | 内容                              |
| ----------------------- | --------------------------------- |
| `docs/overview.md`      | プロダクト概要・技術スタック      |
| `docs/mvp-roadmap.md`   | Day 別の詳細タスク                |
| `docs/structure.md`     | ディレクトリ構造と責任分担        |
| `docs/setup.md`         | 環境構築手順                      |
| `docs/commands.md`      | 日常コマンドリファレンス          |
| `lookingback/pitchy.md` | pitchy 導入でてこずった経緯まとめ |
