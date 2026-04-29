import Link from 'next/link';

import { PageHeader } from '@/components/layouts/page-header';

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white">
        {n}
      </span>
      <span className="text-xs text-gray-600">{text}</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-200 font-sans">
      <PageHeader />

      <main className="flex flex-1 gap-3 p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="grid h-36 grid-cols-2 gap-2">
            <Link
              href="/upload"
              className="flex flex-col items-center justify-center gap-1 rounded bg-red-700 text-white transition-opacity hover:opacity-90"
            >
              <span className="text-3xl">🎵</span>
              <span className="text-base font-black tracking-wide">曲をアップロード</span>
              <span className="text-xs opacity-75">AI が自動解析</span>
            </Link>
            <Link
              href="/test"
              className="flex flex-col items-center justify-center gap-1 rounded bg-teal-700 text-white transition-opacity hover:opacity-90"
            >
              <span className="text-3xl">🎤</span>
              <span className="text-base font-black tracking-wide">採点デモ</span>
              <span className="text-xs opacity-75">サンプル曲で試す</span>
            </Link>
          </div>

          <div className="grid h-10 grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded border border-gray-400 bg-white px-3 text-xs text-gray-600">
              <span>🎧</span>
              <span>イヤホン装着を推奨</span>
            </div>
            <div className="flex items-center gap-2 rounded border border-gray-400 bg-white px-3 text-xs text-gray-600">
              <span>🌐</span>
              <span>Chrome / Edge (デスクトップ)</span>
            </div>
          </div>
        </div>

        <div className="flex w-64 shrink-0 flex-col gap-2">
          <div className="flex-1 rounded border border-gray-300 bg-white p-4">
            <h3 className="mb-2 border-b border-gray-200 pb-1 text-sm font-bold text-gray-700">
              UtaLab とは
            </h3>
            <p className="text-xs leading-relaxed text-gray-600">
              任意の音声ファイルをアップロードするだけで、AI が自動解析してカラオケ採点ができます。
            </p>
            <div className="mt-4 space-y-2">
              <Step n="1" text="音声ファイルをアップロード" />
              <Step n="2" text="AI がボーカル分離・メロディ抽出（1〜2分）" />
              <Step n="3" text="伴奏に合わせて歌って採点！" />
            </div>
          </div>

          <div className="rounded border border-yellow-300 bg-yellow-50 p-3">
            <p className="text-xs font-bold text-yellow-800">⚠ ご注意</p>
            <p className="mt-1 text-xs leading-relaxed text-yellow-700">
              解析に1〜2分かかります。マイクへのアクセス許可とイヤホン装着が必要です。
            </p>
          </div>
        </div>
      </main>

      <div className="flex h-8 items-center gap-2 border-t border-gray-300 bg-white px-4">
        <span className="shrink-0 rounded bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
          お知らせ
        </span>
        <span className="text-xs text-gray-500">
          MVP バージョン —
          現在は個人利用のみ対応。音声ファイルをアップロードしてカラオケを楽しもう！
        </span>
      </div>
    </div>
  );
}
