# pitchy 導入でてこずった理由

## 結論

AudioWorklet はブラウザの特殊な実行環境で動いており、通常の JavaScript とは異なるルールがある。
pitchy v4 がその環境に対応していない形式で配布されていたため、複数の問題が重なった。

---

## 問題の全体像

```
やりたいこと: AudioWorklet 内で pitchy を使ってピッチ検出したい
               ↓
問題1: AudioWorklet は node_modules を参照できない
問題2: CDN 経由での import を試みたが URL が 404
問題3: pitchy v4 からブラウザ向けバンドルが廃止されていた
               ↓
解決策: esbuild で pitchy を単一ファイルにバンドルして public/ に置く
```

---

## 問題1: AudioWorklet は node_modules を参照できない

### AudioWorklet とは

AudioWorklet はブラウザが音声処理専用に用意した**独立したスレッド**で動く。
通常の React コンポーネントや Next.js のコードが動くメインスレッドとは完全に切り離されている。

```
メインスレッド (React, Next.js)
  └─ node_modules/ が使える
  └─ import { PitchDetector } from 'pitchy' ← OK

AudioWorklet スレッド (別スレッド)
  └─ node_modules/ にアクセスできない
  └─ import { PitchDetector } from 'pitchy' ← NG (モジュール解決できない)
```

### なぜ public/ に置く必要があるか

AudioWorklet のファイルは Next.js のバンドラー(Turbopack/Webpack)を**通らない**。
バンドラーを通さないと `import` の解決ができないため、外部ライブラリをそのままでは使えない。

`public/` に置いたファイルは URL で直接参照できるため、AudioWorklet のロードに適している。

参考: [AudioWorklet の使用 (MDN)](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API/Using_AudioWorklet)

---

## 問題2: CDN 経由の import が失敗した

AudioWorklet ファイル内では ESM の `import` 文が使える。
そこで CDN から pitchy を読み込もうとした。

```js
// 試みたコード
import { PitchDetector } from 'https://cdn.jsdelivr.net/npm/pitchy@4/dist/browser/index.js';
```

しかしこれは **404** だった。

### なぜ 404 になったか → 問題3 につながる

---

## 問題3: pitchy v4 でブラウザ向けバンドルが廃止された

pitchy のバージョン履歴を確認したところ、v4 からパッケージ構造が変わっていた。

### v3 以前の構造 (CDN で使えた)

```
pitchy/
├── dist/
│   └── browser/
│       └── index.js  ← ブラウザ向けにバンドル済みのファイルが存在した
└── index.js
```

### v4 以降の構造 (CDN で使えない)

```
pitchy/
└── index.js  ← ESM 形式の単一ファイルのみ。dist/browser/ は廃止
```

v4 は Node.js や Vite/Webpack 等のバンドラー経由での使用を前提とした配布形式になっており、
CDN からそのまま使えるブラウザ向けビルドが存在しない。

jsDelivr はファイルが存在しないため当然 404 を返した。

参考: [pitchy npm](https://www.npmjs.com/package/pitchy) / [pitchy GitHub](https://github.com/ianprime0509/pitchy)

---

## 解決策: esbuild でバンドルして public/ に置く

### やったこと

```bash
pnpm add -D esbuild
pnpm esbuild node_modules/pitchy/index.js --bundle --format=esm --outfile=public/worklets/pitchy.js
```

esbuild が pitchy の依存関係をすべて1ファイルに結合し、ブラウザで直接読める形にした。

```
node_modules/pitchy/index.js
          ↓ esbuild でバンドル
public/worklets/pitchy.js  ← URL で参照可能なブラウザ向けバンドル
```

AudioWorklet 内ではローカル URL で import できる。

```js
// pitch-detector.worklet.js
import { PitchDetector } from '/worklets/pitchy.js'; // ← ローカル参照で解決
```

### package.json にスクリプトを追加

pitchy を更新したときに再バンドルできるよう、スクリプト化している。

```bash
pnpm bundle:worklets
```

---

## 教訓

| 教訓                         | 詳細                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------- |
| AudioWorklet は別世界        | メインスレッドとは異なるルールで動く。node_modules は使えない                    |
| ライブラリのバージョンに注意 | CDN リンクをコピペする際、そのバージョンにブラウザ向けビルドが存在するか確認する |
| esbuild は強力               | バンドラーを通せない環境向けに、ライブラリを単一ファイルに固める用途にも使える   |

---

## 参考リンク

- [AudioWorklet の使用 (MDN)](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API/Using_AudioWorklet)
- [AudioWorkletProcessor (MDN)](https://developer.mozilla.org/ja/docs/Web/API/AudioWorkletProcessor)
- [pitchy GitHub](https://github.com/ianprime0509/pitchy)
- [pitchy npm](https://www.npmjs.com/package/pitchy)
- [esbuild 公式](https://esbuild.github.io/)
- [jsDelivr](https://www.jsdelivr.com/)
