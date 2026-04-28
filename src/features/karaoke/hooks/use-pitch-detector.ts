'use client';

import { useCallback, useRef, useState } from 'react';

import { PitchDetectorNode, type PitchResult } from '@/features/karaoke/audio/pitch-detector';

const CLARITY_THRESHOLD = 0.9;

export interface PitchState {
  pitch: number | null;
  clarity: number;
}

export function usePitchDetector() {
  const detectorRef = useRef<PitchDetectorNode | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [pitchState, setPitchState] = useState<PitchState>({ pitch: null, clarity: 0 });
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const detector = new PitchDetectorNode();
      await detector.start((result: PitchResult) => {
        setPitchState({
          pitch: result.clarity >= CLARITY_THRESHOLD ? result.pitch : null,
          clarity: result.clarity,
        });
      });
      detectorRef.current = detector;
      setIsActive(true);
    } catch {
      setError('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。');
    }
  }, []);

  const stop = useCallback(() => {
    detectorRef.current?.stop();
    detectorRef.current = null;
    setIsActive(false);
    setPitchState({ pitch: null, clarity: 0 });
  }, []);

  return { isActive, pitchState, error, start, stop };
}
