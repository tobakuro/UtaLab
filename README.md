# UtaLab

任意の音声ファイルをアップロードすると AI が自動解析し、カラオケ採点ができる Web アプリケーション。

JOYSOUND のような採点機能を備えつつ、**「音声ファイルとして存在するものなら、どんな曲でもカラオケ採点できる」** ことを差別化ポイントとする。

---

## 技術スタック

| カテゴリ                | 技術                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| フロントエンド          | Next.js 16 (App Router) + TypeScript                                |
| スタイリング            | Tailwind CSS v4 / shadcn/ui                                         |
| 音声処理 (クライアント) | Web Audio API, AudioWorklet, pitchy (McLeod Pitch Method)           |
| AI 解析 (サーバー)      | Python 3.11, Demucs (ボーカル分離), CREPE + TensorFlow (ピッチ抽出) |
| バックエンド            | Next.js Route Handlers, Node.js 22                                  |
| 開発環境                | Devbox (Nix), pnpm, uv, WSL2                                        |

---

## セットアップ

> 詳細は [`docs/setup.md`](docs/setup.md) を参照。

### 前提条件

- Windows 11 + WSL2 (Ubuntu)
- [Devbox](https://www.jetify.com/docs/devbox/) インストール済み

### 手順

```bash
# 1. リポジトリをクローン（WSL のホームディレクトリ配下に置くこと）
git clone https://github.com/tobakuro/UtaLab.git ~/UtaLab
cd ~/UtaLab

# 2. Devbox シェルに入る（Node.js / Python / FFmpeg が自動で揃う）
devbox shell

# 3. フロントエンドの依存関係をインストール
pnpm install

# 4. Python ワーカーの依存関係をインストール
cd worker
uv add demucs librosa numpy soundfile tensorflow "torch==2.5.1" "torchaudio==2.5.1"
uv pip install crepe --no-build-isolation
cd ..

# 5. 開発サーバー起動
pnpm dev
```

`http://localhost:3000` でアクセス可能。

---

## 主要コマンド

```bash
pnpm dev           # 開発サーバー起動
pnpm build         # 本番ビルド（型チェック含む）
pnpm lint          # ESLint
pnpm format        # Prettier 自動整形

# Python ワーカー単体テスト
cd worker
uv run python analyze.py <音声ファイル> <出力ディレクトリ>
```

---

## 画面構成

| URL             | 説明                             |
| --------------- | -------------------------------- |
| `/`             | ホーム（キョクナビ風）           |
| `/upload`       | 音声ファイルのアップロード・解析 |
| `/karaoke/[id]` | カラオケ採点画面                 |
| `/result`       | 採点結果表示                     |
| `/test`         | サンプル曲でのデモ               |

---

## データフロー

```
音声アップロード
 → POST /api/analyze（Next.js Route Handler）
 → Python: Demucs（ボーカル/伴奏分離）→ CREPE（ピッチ抽出）
 → public/analyzed/{id}/melody.json + accompaniment.wav
 → /karaoke/{id} でリアルタイム採点
```

---

## ディレクトリ構成

```
UtaLab/
├── src/
│   ├── app/                    # Next.js ページ・API
│   │   ├── api/analyze/        # 解析 API
│   │   ├── karaoke/[id]/       # カラオケ画面
│   │   ├── upload/             # アップロード画面
│   │   └── result/             # 結果画面
│   ├── features/karaoke/       # カラオケ機能
│   │   ├── audio/              # 音声処理（伴奏・ピッチ検出）
│   │   ├── components/         # PitchCanvas 等
│   │   ├── hooks/              # usePitchDetector, useScoring
│   │   ├── repositories/       # localStorage スコア保存
│   │   ├── scoring/            # 採点ロジック（PitchScorer）
│   │   └── types/              # 型定義
│   └── components/
│       ├── layouts/            # 共有ヘッダー
│       └── ui/                 # shadcn/ui コンポーネント
├── public/
│   ├── worklets/               # AudioWorklet ファイル
│   ├── samples/                # デモ用サンプル音源
│   └── analyzed/               # 解析結果（MVP のみローカル保存）
├── worker/                     # Python 解析ワーカー
│   └── analyze.py              # Demucs + CREPE パイプライン
└── docs/                       # 設計・仕様ドキュメント
```

---

## 注意事項

- **著作権**: MVP は個人利用に限定。公開 URL での配布は行わないこと
- **対応ブラウザ**: Chrome / Edge（デスクトップのみ）
- **解析時間**: CPU のみの場合、1 曲あたり 2〜5 分かかる
- **推奨**: イヤホン装着必須（スピーカー使用時はエコーが採点に影響する）

---

## 関連ドキュメント

- [`docs/overview.md`](docs/overview.md) — プロダクト概要・設計思想
- [`docs/mvp-roadmap.md`](docs/mvp-roadmap.md) — MVP 実装ロードマップ
- [`docs/setup.md`](docs/setup.md) — 詳細セットアップ手順
- [`docs/commands.md`](docs/commands.md) — 日常コマンドリファレンス
