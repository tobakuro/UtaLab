import Link from 'next/link';
import { desc } from 'drizzle-orm';

import { getDb } from '@/db';
import { scores, songs } from '@/db/schema';
import { PageHeader } from '@/components/layouts/page-header';

export const dynamic = 'force-dynamic';

async function getSongsWithBestScore() {
  const db = getDb();
  const allSongs = await db.select().from(songs).orderBy(desc(songs.createdAt));

  const scoreRows = await db.select({ songId: scores.songId, value: scores.value }).from(scores);

  const bestScoreBySong = new Map<string, number>();
  for (const row of scoreRows) {
    const current = bestScoreBySong.get(row.songId) ?? 0;
    if (row.value > current) bestScoreBySong.set(row.songId, row.value);
  }

  return allSongs.map((song) => ({
    ...song,
    bestScore: bestScoreBySong.get(song.id) ?? null,
  }));
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default async function SongsPage() {
  const songList = await getSongsWithBestScore();

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <PageHeader />

      <main className="flex flex-1 flex-col items-center gap-4 p-6">
        <div className="w-full max-w-3xl rounded border-b-2 border-red-700 bg-white px-4 py-3">
          <h1 className="text-base font-black text-gray-800">マイ楽曲</h1>
          <p className="text-xs text-gray-500">解析済みの楽曲一覧</p>
        </div>

        {songList.length === 0 ? (
          <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded border border-gray-300 bg-white py-16">
            <p className="text-sm text-gray-400">まだ楽曲がありません</p>
            <Link
              href="/upload"
              className="rounded bg-red-700 px-6 py-2 text-sm font-black text-white hover:bg-red-600"
            >
              曲をアップロード
            </Link>
          </div>
        ) : (
          <ul className="w-full max-w-3xl divide-y divide-gray-200 overflow-hidden rounded border border-gray-300 bg-white">
            {songList.map((song) => (
              <li
                key={song.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-gray-800">{song.title}</p>
                  <p className="text-xs text-gray-400">
                    {formatDuration(song.duration)} ·{' '}
                    {new Date(song.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  {song.bestScore !== null && (
                    <span className="font-mono text-sm font-bold text-gray-600">
                      Best: {song.bestScore}点
                    </span>
                  )}
                  <Link
                    href={`/karaoke/${song.id}`}
                    className="rounded bg-red-700 px-4 py-1.5 text-xs font-black text-white hover:bg-red-600"
                  >
                    ▶ 歌う
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/upload"
          className="w-full max-w-3xl rounded border-2 border-dashed border-gray-300 bg-white py-4 text-center text-sm font-bold text-gray-500 transition hover:border-red-500 hover:text-red-600"
        >
          ＋ 曲をアップロード
        </Link>
      </main>

      <footer className="flex h-10 items-center border-t border-gray-300 bg-gray-200 px-4">
        <p className="text-xs text-gray-400">© UtaLab</p>
      </footer>
    </div>
  );
}
