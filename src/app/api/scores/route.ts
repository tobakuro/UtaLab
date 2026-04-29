import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { scores, songs } from '@/db/schema';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const songId = searchParams.get('songId');

  const rows = await db
    .select({
      id: scores.id,
      value: scores.value,
      createdAt: scores.createdAt,
      songId: scores.songId,
      songTitle: songs.title,
    })
    .from(scores)
    .innerJoin(songs, eq(scores.songId, songs.id))
    .where(songId ? eq(scores.songId, songId) : undefined)
    .orderBy(desc(scores.createdAt))
    .limit(50);

  return Response.json(rows);
}

export async function POST(request: Request) {
  const db = getDb();
  const { songId, value } = await request.json();
  if (!songId || typeof value !== 'number') {
    return Response.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const [row] = await db.insert(scores).values({ songId, value }).returning();

  return Response.json(row, { status: 201 });
}
