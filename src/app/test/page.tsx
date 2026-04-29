'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AccompanimentPlayer } from '@/features/karaoke/audio/accompaniment-player';
import { PitchCanvas } from '@/features/karaoke/components/pitch-canvas';
import { usePitchDetector } from '@/features/karaoke/hooks/use-pitch-detector';
import { useScoring } from '@/features/karaoke/hooks/use-scoring';
import type { MelodyData } from '@/features/karaoke/types/melody';
import { PageHeader } from '@/components/layouts/page-header';

const MELODY_URL = '/samples/sample-001.melody.json';
const SONG_ID = 'sample-001';

export default function TestPage() {
  const router = useRouter();
  const [melody, setMelody] = useState<MelodyData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const playerRef = useRef<AccompanimentPlayer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const { pitchState, error: micError, start: startMic, stop: stopMic } = usePitchDetector();
  const { recordPitch, finish, reset } = useScoring(SONG_ID);

  useEffect(() => {
    fetch(MELODY_URL).then((r) => r.json()).then(setMelody);
  }, []);

  const tickRef = useRef<() => void>(() => {});
  const tick = useCallback(() => {
    if (!playerRef.current) return;
    setCurrentTime(playerRef.current.getCurrentTime());
    animationIdRef.current = requestAnimationFrame(tickRef.current);
  }, []);
  useEffect(() => { tickRef.current = tick; }, [tick]);

  useEffect(() => {
    if (isPlaying) recordPitch(currentTime, pitchState.pitch);
  }, [currentTime, pitchState.pitch, isPlaying, recordPitch]);

  const start = useCallback(async () => {
    if (!melody) return;
    reset();
    const player = new AccompanimentPlayer();
    await player.load(melody.accompaniment);
    playerRef.current = player;
    player.play();
    setIsPlaying(true);
    animationIdRef.current = requestAnimationFrame(tick);
    await startMic();
  }, [melody, tick, startMic, reset]);

  const stop = useCallback(async () => {
    playerRef.current?.stop();
    playerRef.current = null;
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    stopMic();
    setIsPlaying(false);
    setCurrentTime(0);
    if (melody) {
      const reference = melody.pitches.map((n) => ({ time: n.time, freq: n.freq, duration: n.duration }));
      const score = await finish(reference);
      router.push(`/result?score=${score}&songId=${SONG_ID}`);
    }
  }, [stopMic, melody, finish, router]);

  useEffect(() => {
    return () => {
      playerRef.current?.stop();
      if (animationIdRef.current !== null) cancelAnimationFrame(animationIdRef.current);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <PageHeader />

      <main className="flex flex-1 flex-col items-center gap-4 p-6">
        <div className="w-full max-w-3xl rounded border-b-2 border-red-700 bg-white px-4 py-3">
          <h1 className="text-base font-black text-gray-800">採点デモ</h1>
          <p className="text-xs text-gray-500">サンプル曲でカラオケ採点を体験できます</p>
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
        {!melody && <p className="text-sm text-gray-400">メロディ読み込み中...</p>}

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
        <p className="text-xs text-gray-400">イヤホン装着を推奨します。マイクへのアクセス許可が必要です。</p>
      </footer>
    </div>
  );
}
