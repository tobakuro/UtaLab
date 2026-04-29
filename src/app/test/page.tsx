'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { PitchCanvas } from '@/features/karaoke/components/pitch-canvas';
import { useKaraokeSession } from '@/features/karaoke/hooks/use-karaoke-session';

const MELODY_URL = '/samples/sample-001.melody.json';
const SONG_ID = 'sample-001';

export default function TestPage() {
  const router = useRouter();

  const onFinish = useCallback(
    (score: number) => {
      router.push(`/result?score=${score}&songId=${SONG_ID}`);
    },
    [router],
  );

  const { melody, currentTime, isPlaying, pitchState, micError, start, stop } = useKaraokeSession({
    songId: SONG_ID,
    melodyUrl: MELODY_URL,
    onFinish,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-8">
      <h1 className="text-2xl font-bold text-white">採点デモ — サンプル曲</h1>

      <PitchCanvas
        melodyNotes={melody?.pitches ?? []}
        currentTime={currentTime}
        userPitch={pitchState.pitch}
      />

      <div className="flex w-full max-w-3xl items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-6 py-4">
        <div>
          <p className="text-sm text-gray-400">経過時間</p>
          <p className="font-mono text-2xl text-white">{currentTime.toFixed(2)} s</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">あなたのピッチ</p>
          <p className="font-mono text-2xl text-green-400">
            {pitchState.pitch !== null ? `${Math.round(pitchState.pitch)} Hz` : '---'}
          </p>
        </div>
      </div>

      {micError && <p className="text-sm text-red-400">{micError}</p>}
      {!melody && <p className="text-sm text-gray-400">メロディ読み込み中...</p>}

      <button
        onClick={isPlaying ? stop : start}
        disabled={!melody}
        className={`rounded-lg px-8 py-3 font-semibold text-white transition-colors disabled:opacity-50 ${
          isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'
        }`}
      >
        {isPlaying ? '停止・採点' : '歌う'}
      </button>

      <p className="text-sm text-gray-400">青いバー: お手本メロディ / 緑の点: あなたの声</p>
    </main>
  );
}
