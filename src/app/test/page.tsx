'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AccompanimentPlayer } from '@/features/karaoke/audio/accompaniment-player';
import { PitchCanvas } from '@/features/karaoke/components/pitch-canvas';
import { usePitchDetector } from '@/features/karaoke/hooks/use-pitch-detector';
import { useScoring } from '@/features/karaoke/hooks/use-scoring';
import type { MelodyData } from '@/features/karaoke/types/melody';

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
    fetch(MELODY_URL)
      .then((r) => r.json())
      .then(setMelody);
  }, []);

  const tickRef = useRef<() => void>(() => {});
  const tick = useCallback(() => {
    if (!playerRef.current) return;
    setCurrentTime(playerRef.current.getCurrentTime());
    animationIdRef.current = requestAnimationFrame(tickRef.current);
  }, []);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (isPlaying) {
      recordPitch(currentTime, pitchState.pitch);
    }
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
      const reference = melody.pitches.map((n) => ({
        time: n.time,
        freq: n.freq,
        duration: n.duration,
      }));
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-8">
      <h1 className="text-2xl font-bold text-white">Day 3 検証 — 伴奏再生 + ピッチライン</h1>

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
        {isPlaying ? '停止' : '歌う'}
      </button>

      <p className="text-sm text-gray-400">青いバー: お手本メロディ / 緑の点: あなたの声</p>
    </main>
  );
}
