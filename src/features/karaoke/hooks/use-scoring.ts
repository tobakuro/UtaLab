'use client';

import { useCallback, useRef, useState } from 'react';

import { LocalStorageScoreRepository } from '@/features/karaoke/repositories/local-storage-score-repository';
import { pitchScorer } from '@/features/karaoke/scoring/scorers/pitch-scorer';
import type { PitchFrame } from '@/features/karaoke/scoring/types';

const repository = new LocalStorageScoreRepository();

export function useScoring(songId: string) {
  const userFramesRef = useRef<PitchFrame[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const recordPitch = useCallback((time: number, freq: number | null) => {
    if (freq === null) return;
    userFramesRef.current.push({ time, freq });
  }, []);

  const finish = useCallback(
    async (reference: PitchFrame[]): Promise<number> => {
      const score = pitchScorer.score(reference, userFramesRef.current);
      setFinalScore(score);

      await repository.save({
        id: crypto.randomUUID(),
        songId,
        value: score,
        createdAt: new Date().toISOString(),
      });

      return score;
    },
    [songId],
  );

  const reset = useCallback(() => {
    userFramesRef.current = [];
    setFinalScore(null);
  }, []);

  return { recordPitch, finish, reset, finalScore };
}
