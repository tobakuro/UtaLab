# UtaLab - リポジトリ構造

## 全体像

```
utalab/
├── src/                    # アプリケーションコード
├── public/                 # 静的ファイル
├── worker/                 # Python 音声解析
├── docs/                   # ドキュメント
└── 設定ファイル群
```

---

## src/ の構造と責任分担

各階層の責任を明確に分離する。階層をまたいだロジックの混入を避ける。

```
src/
├── app/                    # ルーティング定義のみ。ロジックは書かない
│   ├── layout.tsx
│   ├── globals.css
│   ├── favicon.ico
│   ├── page.tsx            # ホーム画面
│   ├── test/
│   │   └── page.tsx        # 開発検証用
│   ├── upload/
│   │   └── page.tsx        # アップロード画面
│   ├── karaoke/
│   │   └── [id]/
│   │       └── page.tsx    # カラオケ採点画面
│   ├── result/
│   │   └── page.tsx        # 結果画面
│   └── api/
│       └── analyze/
│           └── route.ts    # 解析 Route Handler
│
├── features/               # 機能単位で責任を集約する。ここが主役
│   ├── karaoke/            # カラオケ採点機能
│   │   ├── audio/          # Web Audio API ラッパー
│   │   ├── components/     # KaraokePlayer, PitchCanvas 等
│   │   ├── hooks/          # usePitchDetector, useScoring 等
│   │   ├── repositories/   # ScoreRepository インターフェース・実装
│   │   │   └── score-repository.ts
│   │   ├── scoring/        # 採点ロジック
│   │   │   ├── scorers/    # PitchScorer 等の実装
│   │   │   └── types.ts    # Scorer, PitchFrame 型定義
│   │   └── types/          # カラオケ機能の型定義
│   └── upload/             # アップロード・AI解析機能
│       ├── actions/        # Server Actions
│       ├── components/     # UploadForm 等
│       └── types/          # アップロード機能の型定義
│
├── components/             # 複数 feature で使う汎用 UI コンポーネント
│   ├── ui/                 # shadcn/ui 置き場(Button, Input 等)
│   ├── layouts/            # Header, Footer 等の共通レイアウト
│   └── elements/           # Loading, Error 等の汎用パーツ
│
└── types/                  # アプリ全体で使うグローバルな型定義
```

### 各階層の責任ルール

| 階層 | 書いて良いもの | 書いてはいけないもの |
| --- | --- | --- |
| `app/` | ルーティング定義、page/layout/route | ビジネスロジック、状態管理、複雑な処理 |
| `features/` | 機能固有のコンポーネント・hooks・型・ロジック | 他 feature への依存、汎用ユーティリティ |
| `components/` | 複数 feature で使う汎用 UI | ビジネスロジック、機能固有の振る舞い |
| `types/` | アプリ全体で共有する型 | 機能固有の型(それは features/ 内へ) |

---

## public/ の構造

```
public/
├── samples/                # デモ用著作権フリー音源
├── worklets/               # AudioWorklet ファイル
│   └── pitch-detector.worklet.js
└── analyzed/               # 解析結果の一時置き場(MVP限定)
    └── {id}/
        ├── melody.json
        └── accompaniment.wav
```

> `public/` に置いたファイルは Next.js のバンドラーを通らず URL で直接参照できる。
> AudioWorklet ファイルはバンドラーを通せないため、必ず `public/worklets/` に置く。

---

## worker/ の構造

```
worker/
├── analyze.py              # Demucs + CREPE による音声解析
└── pyproject.toml          # uv による依存管理
```

Next.js とは独立した Python プロセス。`app/api/analyze/route.ts` から `child_process.spawn` で呼び出す。

---

## ルートの設定ファイル

| ファイル | 役割 |
| --- | --- |
| `package.json` | npm スクリプト・依存関係 |
| `tsconfig.json` | TypeScript 設定。`@/*` は `src/*` を指す |
| `next.config.ts` | Next.js 設定 |
| `eslint.config.mjs` | ESLint 設定(Prettier 競合回避済み) |
| `.prettierrc.json` | Prettier 設定 |
| `postcss.config.mjs` | Tailwind CSS 用 PostCSS 設定 |
| `devbox.json` | Devbox による開発環境定義 |
| `pnpm-workspace.yaml` | pnpm ワークスペース設定 |

---

## docs/ の構造

| ファイル | 内容 |
| --- | --- |
| `overview.md` | プロダクト概要・技術スタック |
| `setup.md` | 環境構築手順 |
| `commands.md` | 日常コマンドリファレンス |
| `mvp-roadmap.md` | MVP の作業計画 |
| `structure.md` | このファイル。リポジトリ構造の説明 |
