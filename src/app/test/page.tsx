'use client';

import { useEffect, useRef } from 'react';

import { usePitchDetector } from '@/features/karaoke/hooks/use-pitch-detector';

function hzToNoteName(hz: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const semitone = Math.round(12 * Math.log2(hz / 440) + 69);
  const name = noteNames[((semitone % 12) + 12) % 12];
  const octave = Math.floor(semitone / 12) - 1;
  return `${name}${octave}`;
}

export default function TestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isActive, pitchState, error, start, stop } = usePitchDetector();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (pitchState.pitch === null) return;

    const minHz = 80;
    const maxHz = 1200;
    const logMin = Math.log2(minHz);
    const logMax = Math.log2(maxHz);
    const logPitch = Math.log2(pitchState.pitch);
    const x = ((logPitch - logMin) / (logMax - logMin)) * canvas.width;

    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(x, canvas.height / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }, [pitchState]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-8">
      <h1 className="text-2xl font-bold text-white">Day 2 検証 — リアルタイムピッチ検出</h1>

      <canvas
        ref={canvasRef}
        width={800}
        height={100}
        className="w-full max-w-3xl rounded-lg border border-gray-700 bg-gray-900"
      />

      <div className="flex w-full max-w-3xl flex-col items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 p-6">
        <p className="text-5xl font-bold tabular-nums text-cyan-400">
          {pitchState.pitch !== null ? `${Math.round(pitchState.pitch)} Hz` : '---'}
        </p>
        <p className="text-2xl text-gray-300">
          {pitchState.pitch !== null ? hzToNoteName(pitchState.pitch) : '---'}
        </p>
        <p className="text-sm text-gray-500">clarity: {(pitchState.clarity * 100).toFixed(1)}%</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={isActive ? stop : start}
        className={`rounded-lg px-8 py-3 font-semibold text-white transition-colors ${
          isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'
        }`}
      >
        {isActive ? '停止' : 'マイク開始'}
      </button>

      <p className="text-sm text-gray-400">
        {isActive ? '🎤 ピッチ検出中...' : 'ボタンを押してマイクを開始してください'}
      </p>
    </main>
  );
}
