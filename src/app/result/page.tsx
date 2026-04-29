'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layouts/page-header';

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const score = Number(params.get('score') ?? 0);
  const songId = params.get('songId') ?? '';

  const grade =
    score >= 90 ? { label: '★★★ 超上手い！', color: 'text-red-700' }
    : score >= 70 ? { label: '★★☆ 上手い！', color: 'text-orange-600' }
    : score >= 50 ? { label: '★☆☆ まあまあ', color: 'text-yellow-600' }
    : { label: '☆☆☆ がんばろう', color: 'text-gray-500' };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <PageHeader />

      <main className="flex flex-1 flex-col items-center gap-6 p-8">
        <div className="w-full max-w-md rounded border-b-2 border-red-700 bg-white px-4 py-3">
          <h1 className="text-base font-black text-gray-800">採点結果</h1>
          <p className="text-xs text-gray-500">{songId}</p>
        </div>

        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded border border-gray-300 bg-white py-12">
          <p className={`text-lg font-bold ${grade.color}`}>{grade.label}</p>
          <p className="font-mono text-8xl font-black text-gray-800">{score}</p>
          <p className="text-gray-400">/ 100 点</p>
        </div>

        <div className="flex w-full max-w-md gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 rounded bg-red-700 py-4 text-base font-black text-white transition hover:bg-red-600"
          >
            ▶ もう一度歌う
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 rounded border-2 border-gray-400 bg-white py-4 text-base font-black text-gray-600 transition hover:bg-gray-50"
          >
            ホームへ
          </button>
        </div>
      </main>

      <footer className="flex h-10 items-center border-t border-gray-300 bg-gray-200 px-4">
        <p className="text-xs text-gray-400">© UtaLab</p>
      </footer>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
