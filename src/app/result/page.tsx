'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const score = Number(params.get('score') ?? 0);
  const songId = params.get('songId') ?? '';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-950 p-8">
      <h1 className="text-3xl font-bold text-white">結果</h1>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-700 bg-gray-900 px-16 py-12">
        <p className="text-sm text-gray-400">{songId}</p>
        <p className="font-mono text-8xl font-black text-white">{score}</p>
        <p className="text-lg text-gray-400">/ 100 点</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => router.push('/test')}
          className="rounded-lg bg-cyan-600 px-8 py-3 font-semibold text-white hover:bg-cyan-700"
        >
          もう一度歌う
        </button>
        <button
          onClick={() => router.push('/')}
          className="rounded-lg border border-gray-600 px-8 py-3 font-semibold text-gray-300 hover:bg-gray-800"
        >
          トップへ
        </button>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
