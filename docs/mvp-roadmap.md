# UtaLab - MVP ロードマップ

## 0. このドキュメントの位置づけ

MVP(最小動作プロトタイプ)達成までの**作業計画と実装手順**をまとめる。

- 想定作業期間: **7 日間 × 5 時間/日 = 約 35 時間**
- 作業者: 1 名(チームメンバーで分担する場合は並行作業の指針も記載)
- ゴール: 「**任意の音声ファイルをアップロードすると、AI が自動解析してカラオケ採点できる**」が動作する状態

プロダクトの全体像は `overview.md`、環境構築は `setup.md` を参照。

---

## 1. MVP のスコープ

### 1.1 含める機能

#### カラオケ採点機能

- [ ] ブラウザからのマイク権限取得
- [ ] マイク入力からのリアルタイムピッチ検出(pitchy / AudioWorklet)
- [ ] 伴奏音源の再生
- [ ] マイク入力と伴奏の時刻同期
- [ ] Canvas によるピッチライン UI(お手本ラインと自分の声の 2 本表示)
- [ ] 音程スコア算出(100 点満点)
- [ ] 結果表示画面

#### AI 音声解析機能

- [ ] 音声ファイルのアップロード UI
- [ ] サーバー側で Demucs によるボーカル / 伴奏分離
- [ ] CREPE によるメロディ抽出(ピッチ列 JSON 生成)
- [ ] 解析完了後、そのままカラオケ画面へ遷移

### 1.2 MVP から外すもの

| 項目 | 理由 | 実装フェーズ |
| --- | --- | --- |
| 表現力スコア(ビブラート / しゃくり / こぶし / フォール) | 実装重い、後から Scorer 追加で対応 | Phase 4 |
| リズム採点 | 音程で最低限の採点は成立する | Phase 2 拡張 |
| 歌詞表示・同期 | WhisperX 連携が重い | Phase 4 |
| ユーザー認証 | localStorage で代替可能 | Phase 2 |
| DB 永続化 | localStorage で代替可能 | Phase 2 |
| ジョブキュー | 同期処理で十分 | Phase 3 |
| クラウドストレージ | ローカルファイルシステムで代替 | Phase 3 |
| GPU クラウド実行 | ローカル CPU 実行で代替 | Phase 3 |
| iOS Safari 対応 | ブラウザ互換性調整が重い | Phase 5 |

### 1.3 非機能要件

- 対応ブラウザ: Chrome / Edge / Firefox(デスクトップ)
- 実行環境: localhost または個人利用限定のデプロイ
- 著作権配慮: MVP は個人利用に限定、公開 URL での配布はしない
- デモ音源: 著作権フリー音源(DOVA-SYNDROME など)を使用

---

## 2. 7 日間スケジュール

| Day | タスク | 想定成果物 |
| --- | --- | --- |
| Day 1 | 環境構築 / Web Audio API でマイク波形表示 | マイク入力を可視化するページ |
| Day 2 | AudioWorklet + pitchy でリアルタイムピッチ表示 | 自分の声のピッチが Hz で表示される |
| Day 3 | 伴奏再生 + 時刻同期 + Canvas ピッチライン描画 | 2 本のピッチラインが画面上で動く |
| Day 4 | 採点ロジック + 結果画面 + 手動メロディでの通し確認 | 1 曲通しで採点できる(AI 解析なし版) |
| Day 5 | Python で Demucs + CREPE ローカル動作確認 | 手動で 1 曲を解析し JSON 出力確認 |
| Day 6 | Next.js から Python 呼び出し / 統合 | アップロード → 解析 → 採点の一気通貫 |
| Day 7 | バグ修正 / UI 調整 / デモ準備 | MVP 完成 |

**重要**: Day 1 の終わりに Demucs / CREPE のインストールだけ先行着手しておくと、Day 5 のモデル初回ダウンロード待ちが短縮できる。

---

## 3. Day 別の詳細タスク

### Day 1: 環境構築 + マイク波形表示

#### 午前(〜2h): 環境構築

- [ ] `setup.md` の手順を完走(Devbox 起動〜`pnpm dev` 確認まで)
- [ ] GitHub リポジトリの作成と初回プッシュ

#### 午後(〜3h): Web Audio API 入門

- [ ] `app/test/page.tsx` のような検証用ページを作成
- [ ] `getUserMedia` でマイク権限取得
- [ ] `AnalyserNode` で周波数データ取得
- [ ] Canvas に波形をリアルタイム描画

##### 実装のポイント

```typescript
// 最小実装のイメージ
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,    // ピッチ検出のため OFF
    noiseSuppression: false,    // 同上
    autoGainControl: false,     // 同上
  },
});

const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);
const analyser = audioContext.createAnalyser();
source.connect(analyser);

// requestAnimationFrame で周期的に analyser.getByteTimeDomainData() を呼ぶ
```

#### Day 1 終わりにやっておくこと(時間があれば)

```bash
# Python 側の準備を先行着手
mkdir -p worker && cd worker
uv init
uv add demucs crepe librosa numpy torch torchaudio soundfile
# ↑ PyTorch や Demucs モデルのダウンロードで数 GB。放置しておくと Day 5 が楽
```

---

### Day 2: AudioWorklet + pitchy でピッチ検出

#### 午前(〜2h): AudioWorklet の基礎

- [ ] `public/worklets/pitch-detector.worklet.js` を作成(AudioWorkletProcessor を継承)
- [ ] メインスレッドから AudioWorkletNode として登録
- [ ] Worklet 内で受け取った音声データをメインスレッドに返す(postMessage)

#### 午後(〜3h): pitchy 組み込み

- [ ] pitchy の PitchDetector を AudioWorklet 内で使用
- [ ] 検出したピッチ(Hz)と clarity(信頼度)を postMessage で送信
- [ ] メインスレッドで受信し画面に表示

##### 実装のポイント

```typescript
// Worklet 内での pitchy 利用イメージ
import { PitchDetector } from 'pitchy';

class PitchProcessor extends AudioWorkletProcessor {
  detector = PitchDetector.forFloat32Array(2048);
  buffer = new Float32Array(2048);

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    // バッファに蓄積して、満ちたら検出
    // ...
    const [pitch, clarity] = this.detector.findPitch(this.buffer, sampleRate);
    this.port.postMessage({ pitch, clarity });

    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
```

##### 注意点

- AudioWorklet のファイルは `public/` に置き、URL で読み込む(bundler を通さない)
- clarity が 0.9 以上のピッチだけ採用すると、無音・ノイズを除外できる
- pitchy の ESM import でつまずいたら、CDN 経由で読み込むか、別ファイルに切り出す

---

### Day 3: 伴奏再生 + 時刻同期 + Canvas 描画

#### 午前(〜2h): 伴奏再生

- [ ] 著作権フリー音源を `public/samples/` に配置
- [ ] `fetch` + `AudioContext.decodeAudioData` で音源をデコード
- [ ] `AudioBufferSourceNode` で再生
- [ ] `AudioContext.currentTime` を基準に時刻同期

##### 時刻同期の重要ポイント

`<audio>` タグの `currentTime` は精度が低く、マイク入力との同期が狂う。必ず `AudioBufferSourceNode` を使い、`AudioContext.currentTime` で時刻管理すること。

```typescript
const startTime = audioContext.currentTime;
bufferSource.start(startTime);

// 以降、再生位置は audioContext.currentTime - startTime で取得
```

#### 午後(〜3h): Canvas でピッチライン描画

- [ ] 手動で作ったお手本メロディ JSON を用意(Day 4 で自動化)
- [ ] 横軸を時間、縦軸を周波数(対数スケール)で Canvas に描画
- [ ] お手本ライン(青)と自分の声(緑)を重ねて表示
- [ ] 現在時刻を示す縦線を引く

##### お手本メロディ JSON のスキーマ案

```json
{
  "songId": "sample-001",
  "accompaniment": "/samples/sample-001-inst.mp3",
  "duration": 180.5,
  "pitches": [
    { "time": 0.0, "freq": 440.0, "duration": 0.5 },
    { "time": 0.5, "freq": 493.88, "duration": 0.25 }
  ]
}
```

---

### Day 4: 採点ロジック + 結果画面

#### 午前(〜2h): 採点ロジックの分離

- [ ] `src/lib/scoring/types.ts` で Scorer インターフェース定義
- [ ] `src/lib/scoring/pitch-scorer.ts` に音程スコアラーを実装
- [ ] フレームごとにお手本ピッチと実ピッチを比較(セミトーン単位)
- [ ] 100 点満点でスコア算出

##### Scorer インターフェースの設計

```typescript
// 本番で表現力スコアを追加する際、この I/F に沿って Scorer を増やすだけ
export interface Scorer {
  name: string;
  weight: number;
  score(reference: PitchFrame[], user: PitchFrame[]): number; // 0-100
}
```

#### 午後(〜3h): 結果画面と通し動作確認

- [ ] `app/result/page.tsx` を作成
- [ ] スコア表示、ピッチラインの全体表示
- [ ] 採点結果を localStorage に保存
- [ ] データ永続化をリポジトリパターンでラップ(後の DB 移行用)

##### リポジトリパターンの設計

```typescript
// src/lib/repositories/score-repository.ts
export interface ScoreRepository {
  save(score: Score): Promise<void>;
  list(): Promise<Score[]>;
}

export class LocalStorageScoreRepository implements ScoreRepository {
  // ...
}
```

**Day 4 終了時点で「採点だけ動く状態」が完成するのが目標**。ここまで来れば、Day 5 以降で AI 解析部分が詰まっても、発表用の動くデモは確保できる。

---

### Day 5: Python で Demucs + CREPE

#### 午前(〜2h): ローカルで Demucs を動かす

- [ ] `worker/analyze.py` を作成
- [ ] 引数で受け取った音声ファイルを Demucs で分離
- [ ] `separated/` 配下に `vocals.wav`、`no_vocals.wav` が出力されることを確認

```bash
cd worker
uv run python -m demucs sample.mp3
```

初回はモデルのダウンロードで時間がかかる(数百 MB)。

#### 午後(〜3h): CREPE でメロディ抽出 + JSON 出力

- [ ] Demucs で分離した `vocals.wav` を CREPE に渡す
- [ ] ピッチ列を Day 3 で決めたスキーマの JSON として出力
- [ ] 伴奏音源(`no_vocals.wav`)を `public/analyzed/{id}/` にコピー

##### analyze.py の骨子

```python
import sys
import subprocess
import json
import crepe
import librosa
from pathlib import Path

def analyze(input_path: str, output_dir: str) -> dict:
    """Pure function として書く。後で Modal 化しやすい"""
    # 1. Demucs でボーカル分離
    subprocess.run(["demucs", input_path, "-o", output_dir])

    # 2. CREPE でピッチ抽出
    vocals_path = Path(output_dir) / "htdemucs" / Path(input_path).stem / "vocals.wav"
    audio, sr = librosa.load(vocals_path, sr=16000)
    time, frequency, confidence, _ = crepe.predict(audio, sr, viterbi=True)

    # 3. JSON 化
    pitches = [
        {"time": float(t), "freq": float(f), "confidence": float(c)}
        for t, f, c in zip(time, frequency, confidence)
        if c > 0.5
    ]
    result = {
        "duration": len(audio) / sr,
        "pitches": pitches,
        "accompaniment": str(Path(output_dir) / "htdemucs" / Path(input_path).stem / "no_vocals.wav")
    }

    out_json = Path(output_dir) / "melody.json"
    out_json.write_text(json.dumps(result, indent=2))
    return result

if __name__ == "__main__":
    analyze(sys.argv[1], sys.argv[2])
```

---

### Day 6: 統合

#### 午前(〜2.5h): アップロード API

- [ ] `app/api/analyze/route.ts` を作成
- [ ] `FormData` で受け取った音声ファイルを一時ディレクトリに保存
- [ ] `child_process.spawn` で `uv run python worker/analyze.py` を起動
- [ ] 解析結果 JSON と伴奏ファイルを `public/analyzed/{id}/` に配置
- [ ] レスポンスで `{ jobId, status, resultUrl }` を返す

**本番移行を意識**: レスポンスの契約を非同期処理と同じ形にしておくと、Modal 移行時に最小変更で済む。

#### 午後(〜2.5h): フロントエンド統合

- [ ] `app/upload/page.tsx` でアップロード UI
- [ ] アップロード → API 呼び出し → 結果取得 → カラオケ画面遷移
- [ ] `app/karaoke/[id]/page.tsx` で動的ルーティング

##### ディレクトリ構造(Day 6 終了時点)

```
utalab/
├── app/
│   ├── page.tsx              # トップページ
│   ├── upload/page.tsx       # アップロード
│   ├── karaoke/[id]/page.tsx # カラオケ画面
│   ├── result/page.tsx       # 結果画面
│   └── api/
│       └── analyze/route.ts  # 解析 API
├── src/
│   └── lib/
│       ├── audio/            # Web Audio API ラッパー
│       ├── scoring/          # 採点ロジック
│       └── repositories/     # データ永続化
├── public/
│   ├── samples/              # デモ音源
│   ├── worklets/             # AudioWorklet ファイル
│   └── analyzed/             # 解析結果(MVP のみ)
├── worker/                   # Python 解析
│   ├── analyze.py
│   └── pyproject.toml
└── devbox.json
```

---

### Day 7: 仕上げ

- [ ] バグ修正
- [ ] UI の最低限の見た目調整(shadcn/ui のコンポーネントを使って)
- [ ] エラーハンドリング(マイク権限拒否、解析失敗など)
- [ ] デモ動画撮影 or デモ音源の準備
- [ ] README.md の更新

---

## 4. 拡張性の担保(本番移行を楽にする)

MVP 実装時点で以下を守ると、Phase 2 以降の移行コストが大幅に下がる。

### 4.1 データ層の抽象化

localStorage への書き込みを直接呼ばず、リポジトリパターンでラップする。DB 移行時はインスタンスを差し替えるだけ。

### 4.2 採点ロジックのモジュール化

Scorer インターフェースを分離しておき、新しい採点軸は Scorer を追加するだけで済む設計にする。

### 4.3 解析 API の契約

MVP では同期処理だが、レスポンス形式は非同期ジョブと同じ `{ jobId, status, resultUrl? }` にしておく。Modal 移行時はクライアント側の変更最小。

### 4.4 Python 解析コードは純粋関数で書く

`analyze(input_path, output_dir)` のようにシンプルな関数として実装しておけば、Modal に移す際は decorator を付けるだけで済む。

```python
# MVP
def analyze(input_path, output_dir): ...

# 本番(Modal)
@app.function(image=image, gpu="T4")
def analyze_remote(input_path, output_dir):
    return analyze(input_path, output_dir)  # 中身はそのまま
```

### 4.5 ストレージアクセスの抽象化

ファイル保存・取得を直接書かず、Storage インターフェースを経由する。R2 移行時はインスタンス差し替えのみ。

---

## 5. MVP 完了の判定基準

以下をすべて満たしたら MVP 完了。

- [ ] Chrome でマイク権限を取得し、自分の声のピッチがリアルタイムに画面表示される
- [ ] 伴奏音源を再生しながら採点でき、結果画面でスコア(100 点満点)が表示される
- [ ] 任意の音声ファイルをアップロードすると自動で伴奏とメロディが生成され、そのままカラオケ画面に遷移して歌える
- [ ] Chrome で通し動作する(iOS Safari は対象外)
- [ ] 本番移行パスに沿ってコードが構造化されている(リポジトリパターン / Scorer 分離 / 純粋関数な Python)

---

## 6. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| Demucs の初回セットアップが重い | Day 5 の遅延 | Day 1 終了時に先行インストール |
| ピッチ検出の精度が出ない | 採点が機能しない | clarity 閾値の調整、複数アルゴリズム比較 |
| 時刻同期がずれる | 採点が狂う | AudioContext.currentTime を必ず使用、`<audio>` は使わない |
| Web Audio API の iOS Safari 非互換 | iPhone で動かない | MVP の対象外として割り切る |
| pnpm install の権限エラー | 開発停止 | WSL ユーザーは `~/` 配下で作業(`/mnt/c/` は避ける) |
| AudioWorklet ファイルの読み込みエラー | ピッチ検出が動かない | `public/` に置いて URL で参照、bundler を通さない |

---

## 7. Phase 2 以降のロードマップ(概略)

MVP 完成後、以下の順で本番構成に近づける。

### Phase 2: 永続化と認証(〜2 週間想定)

- DB 導入(PostgreSQL + Drizzle)
- Auth.js で認証
- スコア履歴を DB 保存

### Phase 3: クラウド化(〜2 週間想定)

- Python Worker を Modal に移行
- ストレージを Cloudflare R2 に移行
- ジョブキュー化(Inngest)

### Phase 4: 表現力スコアと歌詞(〜3 週間想定)

- ビブラート / しゃくり / こぶし / フォール検出
- WhisperX による歌詞抽出・同期表示

### Phase 5: UX 改善とスケール

- PWA 化
- モバイル最適化
- パフォーマンスチューニング

---

## 8. チーム分担の目安(複数人の場合)

もし 2〜3 人で分担するなら:

- **フロントエンド担当**: Day 1〜4(Web Audio API、UI、採点ロジック)
- **バックエンド / ML 担当**: Day 1(環境)、Day 5〜6(Python 解析、API)
- **UI/UX 担当(任意)**: Day 7 の仕上げ、shadcn/ui でのデザイン調整

---

## 9. 参考リンク

- [pitchy ドキュメント](https://github.com/ianprime0509/pitchy)
- [AudioWorklet 解説 (Google)](https://developer.chrome.com/blog/audio-worklet/)
- [Demucs GitHub](https://github.com/facebookresearch/demucs)
- [CREPE GitHub](https://github.com/marl/crepe)
- [DOVA-SYNDROME(著作権フリー音源)](https://dova-s.jp/)
