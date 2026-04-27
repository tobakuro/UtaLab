'use client';

import { useEffect, useRef } from 'react';

import type { MelodyNote } from '@/features/karaoke/types/melody';

interface Props {
  melodyNotes: MelodyNote[];
  currentTime: number;
  userPitch: number | null;
  width?: number;
  height?: number;
}

const MIN_FREQ = 80;
const MAX_FREQ = 1200;
const WINDOW_SEC = 5;

function freqToY(freq: number, height: number): number {
  const logMin = Math.log2(MIN_FREQ);
  const logMax = Math.log2(MAX_FREQ);
  const logFreq = Math.log2(Math.max(freq, MIN_FREQ));
  const ratio = 1 - (logFreq - logMin) / (logMax - logMin);
  return ratio * height;
}

export function PitchCanvas({ melodyNotes, currentTime, userPitch, width = 800, height = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // 現在時刻の縦線
    const nowX = width * 0.3;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(nowX, 0);
    ctx.lineTo(nowX, height);
    ctx.stroke();

    // お手本ライン(青)
    for (const note of melodyNotes) {
      const noteStartX = nowX + ((note.time - currentTime) / WINDOW_SEC) * width;
      const noteEndX = nowX + ((note.time + note.duration - currentTime) / WINDOW_SEC) * width;

      if (noteEndX < 0 || noteStartX > width) continue;

      const y = freqToY(note.freq, height);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(noteStartX, y - 4, noteEndX - noteStartX, 8);
    }

    // ユーザーピッチ(緑)
    if (userPitch !== null && userPitch > MIN_FREQ) {
      const y = freqToY(userPitch, height);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(nowX, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [melodyNotes, currentTime, userPitch, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full rounded-lg border border-gray-700"
    />
  );
}
