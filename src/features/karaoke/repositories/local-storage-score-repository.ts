'use client';

import type { Score, ScoreRepository } from '@/features/karaoke/repositories/score-repository';

const STORAGE_KEY = 'utalab:scores';

export class LocalStorageScoreRepository implements ScoreRepository {
  async save(score: Score): Promise<void> {
    const scores = await this.list();
    scores.push(score);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  }

  async list(): Promise<Score[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Score[];
    } catch {
      return [];
    }
  }
}
