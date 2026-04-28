'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'idle' | 'analyzing' | 'error';

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setStatus('analyzing');
    setError(null);

    const body = new FormData();
    body.append('file', file);

    const res = await fetch('/api/analyze', { method: 'POST', body });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? '解析に失敗しました');
      setStatus('error');
      return;
    }

    const { jobId } = await res.json();
    router.push(`/karaoke/${jobId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-950 p-8">
      <h1 className="text-3xl font-bold text-white">曲をアップロード</h1>

      <div
        className="flex w-full max-w-md cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-600 bg-gray-900 px-8 py-12 transition hover:border-cyan-500"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <p className="text-center text-white">{file.name}</p>
        ) : (
          <>
            <p className="text-gray-400">クリックして音声ファイルを選択</p>
            <p className="text-sm text-gray-600">MP3, WAV, FLAC など</p>
          </>
        )}
      </div>

      {status === 'analyzing' && (
        <p className="animate-pulse text-cyan-400">AI が解析中です... (1〜2分かかります)</p>
      )}
      {error && <p className="text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!file || status === 'analyzing'}
        className="rounded-lg bg-cyan-600 px-10 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50"
      >
        {status === 'analyzing' ? '解析中...' : '解析してカラオケ開始'}
      </button>
    </main>
  );
}
