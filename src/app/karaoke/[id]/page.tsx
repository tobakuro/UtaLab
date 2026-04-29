'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { PitchCanvas } from '@/features/karaoke/components/pitch-canvas';
import { useKaraokeSession } from '@/features/karaoke/hooks/use-karaoke-session';
import { PageHeader } from '@/components/layouts/page-header';

export default function KaraokePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const onFinish = useCallback(
    (score: number) => {
      router.push(`/result?score=${score}&songId=${encodeURIComponent(id)}`);
    },
    [id, router],
  );

  const { melody, melodyError, currentTime, isPlaying, pitchState, micError, start, stop } =
    useKaraokeSession({ songId: id, melodyUrl: `/analyzed/${id}/melody.json`, onFinish });

  if (melodyError) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100">
        <PageHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="rounded bg-red-50 px-6 py-4 text-sm font-bold text-red-700">
            ⚠ 楽曲データの読み込みに失敗しました。
          </div>
          <Link
            href="/upload"
            className="rounded bg-red-700 px-8 py-3 font-black text-white hover:bg-red-600"
          >
            アップロードへ戻る
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <PageHeader />

      <main className="flex flex-1 flex-col items-center gap-4 p-6">
        <div className="w-full max-w-3xl rounded border-b-2 border-red-700 bg-white px-4 py-3">
          <h1 className="text-base font-black text-gray-800">{melody?.title ?? '読み込み中...'}</h1>
          <p className="text-xs text-gray-500">伴奏に合わせて歌ってください</p>
        </div>

        <div className="w-full max-w-3xl rounded border border-gray-300 bg-white p-3">
          <PitchCanvas
            melodyNotes={melody?.pitches ?? []}
            currentTime={currentTime}
            userPitch={pitchState.pitch}
          />
          <p className="mt-2 text-center text-xs text-gray-400">
            青いバー: お手本メロディ　／　緑の点: あなたの声
          </p>
        </div>

        <div className="flex w-full max-w-3xl items-center justify-between rounded border border-gray-300 bg-white px-6 py-3">
          <div>
            <p className="text-xs text-gray-400">経過時間</p>
            <p className="font-mono text-2xl font-bold text-gray-800">{currentTime.toFixed(2)} s</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">あなたのピッチ</p>
            <p className="font-mono text-2xl font-bold text-red-700">
              {pitchState.pitch !== null ? `${Math.round(pitchState.pitch)} Hz` : '---'}
            </p>
          </div>
        </div>

        {micError && (
          <div className="w-full max-w-3xl rounded bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
            ⚠ {micError}
          </div>
        )}
        {!melody && !melodyError && <p className="text-sm text-gray-400">メロディ読み込み中...</p>}

        <button
          onClick={isPlaying ? stop : start}
          disabled={!melody}
          className={`w-full max-w-3xl rounded py-4 text-base font-black text-white transition disabled:opacity-50 ${
            isPlaying ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-700 hover:bg-red-600'
          }`}
        >
          {isPlaying ? '■ 停止・採点' : '▶ 歌う'}
        </button>
      </main>

      <footer className="flex h-10 items-center border-t border-gray-300 bg-gray-200 px-4">
        <p className="text-xs text-gray-400">
          イヤホン装着を推奨します。マイクへのアクセス許可が必要です。
        </p>
      </footer>
    </div>
  );
}
