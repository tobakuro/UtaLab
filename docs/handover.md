# UtaLab - 引き継ぎ書

作成日: 2026-04-27

---

## 現在地

MVP ロードマップの Day 5 進行中。

| Day   | 内容                                           | 状態       |
| ----- | ---------------------------------------------- | ---------- |
| Day 1 | Web Audio API でマイク波形表示                 | 完了       |
| Day 2 | AudioWorklet + pitchy でリアルタイムピッチ検出 | 完了       |
| Day 3 | 伴奏再生 + 時刻同期 + Canvas ピッチライン描画  | 完了       |
| Day 4 | 採点ロジック + 結果画面                        | 完了       |
| Day 5 | Python で Demucs + CREPE                       | **進行中** |
| Day 6 | フロントエンドと統合                           | 未着手     |
| Day 7 | 仕上げ                                         | 未着手     |

---

## 残っている GitHub Issues

| #   | タイトル                                         | 優先度 |
| --- | ------------------------------------------------ | ------ |
| #8  | Demucs でボーカル/伴奏分離                       | high   |
| #9  | CREPE でメロディ抽出（ピッチ列 JSON 生成）       | high   |
| #7  | MVP: AI 音声解析（Python ワーカー）              | high   |
| #11 | アップロード API の作成                          | high   |
| #12 | フロントエンド統合（アップロード UI + 画面遷移） | high   |
| #10 | MVP: アップロード → 解析 → カラオケの統合        | high   |
| #14 | shadcn/ui での UI 調整                           | middle |
| #15 | エラーハンドリング（マイク権限拒否・解析失敗等） | middle |
| #13 | MVP: UI 調整 + エラーハンドリング + デモ準備     | middle |

---

## 次にやること(Day 5〜6)

### Day 5: analyze.py の動作確認(issue #7, #8, #9)

`worker/analyze.py` は実装済み。音声ファイルを渡して出力を確認する。

```bash
cd ~/utalab/worker
uv run python analyze.py <音声ファイル> ./output_test
```

出力:

- `output_test/accompaniment.wav` — ボーカル除去済み伴奏
- `output_test/melody.json` — ピッチ列 JSON

### Day 6: Next.js から Python を呼び出して統合(issue #11, #12, #10)

- `src/app/api/analyze/route.ts` を作成
- `child_process.spawn` で `uv run python worker/analyze.py` を起動
- アップロード UI(`src/app/upload/page.tsx`)から解析 → カラオケ画面遷移

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

### `src/features/karaoke/hooks/use-scoring.ts`

採点状態管理フック。`recordPitch` でフレーム蓄積、`finish` でスコア算出・保存。

### `src/features/karaoke/types/melody.ts`

メロディ JSON の型定義。`MelodyNote` / `MelodyData`。

### `public/samples/sample-001.melody.json`

検証用の手動ダミーメロディデータ。Day 5〜6 で Python(CREPE)が自動生成するものに置き換わる。

### `public/worklets/pitch-detector.worklet.js`

AudioWorklet のプロセッサ本体。pitchy を esbuild でバンドルした `public/worklets/pitchy.js` をローカル import して使う。

### `worker/analyze.py`

Demucs + CREPE による音声解析スクリプト。`analyze(input_path, output_dir)` の純粋関数として実装しており、Modal 移行時は decorator を付けるだけ。

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

---

## 開発環境の起動

```bash
cd ~/utalab
devbox shell
git pull origin develop
pnpm install   # package.json に変更があった時のみ
pnpm dev
```

`http://localhost:3000/test` で現在の動作を確認できる。

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
