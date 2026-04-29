import crypto from 'crypto';
import { spawn } from 'child_process';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';

import { getDb } from '@/db';
import { songs } from '@/db/schema';

export const maxDuration = 300;

function runPythonWorker(inputPath: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('uv', ['run', 'python', 'analyze.py', inputPath, outputDir], {
      cwd: join(process.cwd(), 'worker'),
    });
    const stderrLines: string[] = [];
    proc.stderr.on('data', (chunk) => stderrLines.push(String(chunk)));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`analyze.py がコード ${code} で終了しました\n${stderrLines.join('')}`));
    });
    proc.on('error', reject);
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return Response.json({ error: 'ファイルが選択されていません' }, { status: 400 });
  }

  const title =
    (formData.get('title') as string | null)?.trim() || file.name.replace(/\.[^.]+$/, '');

  const id = crypto.randomUUID();
  const tmpDir = join(process.cwd(), 'tmp', id);
  const inputPath = join(tmpDir, file.name);
  const outputDir = join(process.cwd(), 'public', 'analyzed', id);

  try {
    await mkdir(tmpDir, { recursive: true });
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
    await runPythonWorker(inputPath, outputDir);

    const melodyPath = join(outputDir, 'melody.json');
    const melody = JSON.parse(await readFile(melodyPath, 'utf-8'));
    melody.title = title;
    melody.accompaniment = `/analyzed/${id}/accompaniment.wav`;
    melody.songId = id;
    await writeFile(melodyPath, JSON.stringify(melody, null, 2));

    await getDb().insert(songs).values({ id, title, duration: melody.duration });

    return Response.json({ jobId: id, status: 'done', melodyUrl: `/analyzed/${id}/melody.json` });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
