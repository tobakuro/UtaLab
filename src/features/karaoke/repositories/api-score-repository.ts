import type { Score, ScoreRepository } from './score-repository';

export class ApiScoreRepository implements ScoreRepository {
  async save(score: Score): Promise<void> {
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId: score.songId, value: score.value }),
    });
  }

  async list(): Promise<Score[]> {
    const res = await fetch('/api/scores');
    return res.json();
  }
}
