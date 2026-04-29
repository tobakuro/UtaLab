'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/layouts/page-header';

type Status = 'idle' | 'analyzing' | 'error';

const STAGES = [
  'ファイルをアップロード中...',
  'Demucs でボーカル/伴奏を分離中...',
  'CREPE でメロディを抽出中...',
  '保存中...',
];

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setStatus('analyzing');
    setError(null);
    setStageIndex(0);

    // ステージを時間ベースで進める（見た目のフィードバック用）
    const stageTimer = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 35_000); // ~35秒ごとに次のステージへ

    const body = new FormData();
    body.append('file', file);
    body.append('title', title);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body });
      clearInterval(stageTimer);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '解析に失敗しました');
        setStatus('error');
        return;
      }
      const { jobId } = await res.json();
      router.push(`/karaoke/${jobId}`);
    } catch {
      clearInterval(stageTimer);
      setError('ネットワークエラーが発生しました');
      setStatus('error');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <PageHeader />

      <main className="flex flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-lg flex-col gap-6">
          <div className="rounded border-b-2 border-red-700 bg-white px-4 py-3">
            <h1 className="text-base font-black text-gray-800">曲をアップロード</h1>
            <p className="text-xs text-gray-500">
              音声ファイルをアップロードすると AI が自動解析してカラオケ採点ができます
            </p>
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
              onChange={(e) => handleFileChange(e.target.files?.[0])}
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

          {file && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-600">曲名</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="曲名を入力"
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-red-500 focus:outline-none"
              />
            </div>
          )}

          {status === 'analyzing' && (
            <div className="flex flex-col gap-3 rounded bg-orange-50 px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                <p className="text-sm font-bold text-orange-700">{STAGES[stageIndex]}</p>
              </div>
              <div className="flex gap-1">
                {STAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= stageIndex ? 'bg-orange-500' : 'bg-orange-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-orange-600">
                解析には1〜2分かかります。このページを閉じないでください。
              </p>
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
        <p className="text-xs text-gray-400">
          解析には1〜2分かかります。イヤホン装着を推奨します。
        </p>
      </footer>
    </div>
  );
}
