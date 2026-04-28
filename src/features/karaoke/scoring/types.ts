export interface PitchFrame {
  time: number;
  freq: number;
  duration?: number;
}

export interface Scorer {
  name: string;
  weight: number;
  score(reference: PitchFrame[], user: PitchFrame[]): number;
}
