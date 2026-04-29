'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/layouts/page-header';

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
    <div className="flex min-h-screen flex-col bg-gray-100">
      <PageHeader />

      <main className="flex flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-lg flex-col gap-6">
          <div className="rounded border-b-2 border-red-700 bg-white px-4 py-3">
            <h1 className="text-base font-black text-gray-800">曲をアップロード</h1>
            <p className="text-xs text-gray-500">音声ファイルをアップロードすると、AI が自動解析してカラオケ採点ができます</p>
          </div>

          <div
            className="flex cursor-pointer flex-col items-center gap-4 rounded border-2 border-dashed border-gray-300 bg-white px-8 py-14 transition hover:border-red-600"
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
              <p className="text-center font-bold text-gray-800">{file.name}</p>
            ) : (
              <>
                <span className="text-5xl">🎵</span>
                <p className="font-bold text-gray-500">クリックして音声ファイルを選択</p>
                <p className="text-sm text-gray-400">MP3, WAV, FLAC など</p>
              </>
            )}
          </div>

          {status === 'analyzing' && (
            <div className="rounded bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
              ⏳ AI が解析中です... (1〜2分かかります)
            </div>
          )}
          {error && (
            <div className="rounded bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || status === 'analyzing'}
            className="rounded bg-red-700 py-4 text-base font-black text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {status === 'analyzing' ? '解析中...' : '解析してカラオケ開始'}
          </button>
        </div>
      </main>

      <footer className="flex h-10 items-center border-t border-gray-300 bg-gray-200 px-4">
        <p className="text-xs text-gray-400">解析には1〜2分かかります。イヤホン装着を推奨します。</p>
      </footer>
    </div>
  );
}
