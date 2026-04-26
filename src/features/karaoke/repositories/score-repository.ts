export interface Score {
  id: string;
  songId: string;
  value: number;
  createdAt: string;
}

export interface ScoreRepository {
  save(score: Score): Promise<void>;
  list(): Promise<Score[]>;
}
