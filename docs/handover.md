# UtaLab - 引き継ぎ書

作成日: 2026-04-27

---

## 現在地

MVP ロードマップの Day 3 まで完了。Day 4 から継続する。

| Day   | 内容                                           | 状態           |
| ----- | ---------------------------------------------- | -------------- |
| Day 1 | Web Audio API でマイク波形表示                 | 完了           |
| Day 2 | AudioWorklet + pitchy でリアルタイムピッチ検出 | 完了           |
| Day 3 | 伴奏再生 + 時刻同期 + Canvas ピッチライン描画  | 完了           |
| Day 4 | 採点ロジック + 結果画面                        | **次のタスク** |
| Day 5 | Python で Demucs + CREPE                       | 未着手         |
| Day 6 | フロントエンドと統合                           | 未着手         |
| Day 7 | 仕上げ                                         | 未着手         |

---

## 残っている GitHub Issues

| #   | タイトル                                         | 優先度 |
| --- | ------------------------------------------------ | ------ |
| #5  | 採点ロジック実装（音程スコア）                   | high   |
| #6  | 結果画面の作成                                   | middle |
| #3  | MVP: カラオケ採点機能（フロントエンド）          | high   |
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

## 次にやること(Day 4)

### 1. 採点ロジック(issue #5)

`src/features/karaoke/scoring/` に実装する。

- `src/features/karaoke/scoring/types.ts` に `Scorer` / `PitchFrame` インターフェースが定義済み
- `src/features/karaoke/scoring/scorers/` に `PitchScorer` を実装する
- フレームごとにお手本ピッチと実ピッチをセミトーン単位で比較し 100 点満点でスコア算出

```typescript
// src/features/karaoke/scoring/types.ts に定義済み
export interface Scorer {
  name: string;
  weight: number;
  score(reference: PitchFrame[], user: PitchFrame[]): number;
}
```

### 2. ScoreRepository(issue #6 の前提)

`src/features/karaoke/repositories/score-repository.ts` に `ScoreRepository` インターフェースが定義済み。
`LocalStorageScoreRepository` として実装する(後の DB 移行時はインスタンスを差し替えるだけ)。

### 3. 結果画面(issue #6)

`src/app/result/page.tsx` に実装する(現在はプレースホルダー)。
スコア表示 + ピッチラインの全体表示を行う。

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

### `src/features/karaoke/types/melody.ts`

メロディ JSON の型定義。`MelodyNote` / `MelodyData`。

### `public/samples/sample-001.melody.json`

検証用の手動ダミーメロディデータ。Day 5〜6 で Python(CREPE)が自動生成するものに置き換わる。

### `public/worklets/pitch-detector.worklet.js`

AudioWorklet のプロセッサ本体。pitchy を esbuild でバンドルした `public/worklets/pitchy.js` をローカル import して使う。

---

## 重要な技術的経緯

### pitchy の CDN import が使えない問題

AudioWorklet は別スレッドで動くため node_modules にアクセスできない。CDN から pitchy を import しようとしたが pitchy v4 から `dist/browser/` が廃止されており 404 になった。esbuild で pitchy を単一ファイルにバンドルして `public/worklets/pitchy.js` に置くことで解決した。詳細は `lookingback/pitchy.md` を参照。

再バンドルが必要な場合:

```bash
pnpm bundle:worklets
```

---

## git の未コミット差分

以下のファイルがまだコミットされていない。引き継ぎ後にコミットすること。

| ファイル                                             | 状態      | 内容                    |
| ---------------------------------------------------- | --------- | ----------------------- |
| `src/app/test/page.tsx`                              | modified  | Day 3 の内容に更新済み  |
| `src/features/karaoke/audio/accompaniment-player.ts` | untracked | 伴奏再生ラッパー        |
| `src/features/karaoke/components/pitch-canvas.tsx`   | untracked | Canvas ピッチライン描画 |
| `src/features/karaoke/types/melody.ts`               | untracked | メロディ型定義          |
| `public/samples/sample-001.melody.json`              | untracked | ダミーメロディデータ    |

`.claude/settings.local.json` は commit 不要。

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
| `docs/commands.md`      | 日常コマンドリファレンス          |
| `lookingback/pitchy.md` | pitchy 導入でてこずった経緯まとめ |
