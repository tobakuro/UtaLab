export interface MelodyNote {
  time: number;
  freq: number;
  duration: number;
}

export interface MelodyData {
  songId: string;
  title: string;
  accompaniment: string;
  duration: number;
  pitches: MelodyNote[];
}
