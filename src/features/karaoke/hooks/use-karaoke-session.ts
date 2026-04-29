'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AccompanimentPlayer } from '@/features/karaoke/audio/accompaniment-player';
import type { MelodyData } from '@/features/karaoke/types/melody';
import { usePitchDetector } from './use-pitch-detector';
import { useScoring } from './use-scoring';

interface Options {
  songId: string;
  melodyUrl: string;
  onFinish?: (score: number) => void;
}

export function useKaraokeSession({ songId, melodyUrl, onFinish }: Options) {
  const [melody, setMelody] = useState<MelodyData | null>(null);
  const [melodyError, setMelodyError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const playerRef = useRef<AccompanimentPlayer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const { pitchState, error: micError, start: startMic, stop: stopMic } = usePitchDetector();
  const { recordPitch, finish, reset } = useScoring(songId);

  useEffect(() => {
    setMelody(null);
    setMelodyError(false);
    fetch(melodyUrl)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setMelody)
      .catch(() => setMelodyError(true));
  }, [melodyUrl]);

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
    if (!melody) return;
    const reference = melody.pitches.map((n) => ({
      time: n.time,
      freq: n.freq,
      duration: n.duration,
    }));
    const score = await finish(reference);
    onFinish?.(score);
  }, [stopMic, melody, finish, onFinish]);

  useEffect(() => {
    return () => {
      playerRef.current?.stop();
      if (animationIdRef.current !== null) cancelAnimationFrame(animationIdRef.current);
    };
  }, []);

  return { melody, melodyError, currentTime, isPlaying, pitchState, micError, start, stop };
}
