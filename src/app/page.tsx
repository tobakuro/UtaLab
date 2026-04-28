import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-950 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-5xl font-black text-white">UtaLab</h1>
        <p className="max-w-sm text-gray-400">
          任意の音声ファイルをアップロードすると、AI が自動解析してカラオケ採点できます。
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/upload"
          className="rounded-lg bg-cyan-600 px-8 py-3 font-semibold text-white transition hover:bg-cyan-700"
        >
          曲をアップロード
        </Link>
        <Link
          href="/test"
          className="rounded-lg border border-gray-600 px-8 py-3 font-semibold text-gray-300 transition hover:bg-gray-800"
        >
          デモを試す
        </Link>
      </div>
    </main>
  );
}
