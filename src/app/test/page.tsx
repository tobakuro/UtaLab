'use client';

import { useEffect, useRef, useState } from 'react';

export default function TestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const render = () => {
      animationIdRef.current = requestAnimationFrame(render);
      analyser.getFloatTimeDomainData(dataArray);

      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const y = ((dataArray[i] + 1) / 2) * canvas.height;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    render();
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsActive(true);
      draw();
    } catch (e) {
      setError('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。');
      console.error(e);
    }
  };

  const stop = () => {
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setIsActive(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    return () => {
      if (animationIdRef.current !== null) cancelAnimationFrame(animationIdRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-8">
      <h1 className="text-2xl font-bold text-white">Day 1 検証 — マイク波形表示</h1>

      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full max-w-3xl rounded-lg border border-gray-700 bg-gray-900"
      />

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
        {isActive ? '🎤 マイク入力中...' : 'ボタンを押してマイクを開始してください'}
      </p>
    </main>
  );
}
