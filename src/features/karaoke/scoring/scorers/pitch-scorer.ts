import type { PitchFrame, Scorer } from '@/features/karaoke/scoring/types';

const MATCH_THRESHOLD_SEMITONES = 2;

function freqToSemitone(freq: number): number {
  return 12 * Math.log2(freq / 440);
}

function findReferenceFreq(time: number, reference: PitchFrame[]): number | null {
  for (const note of reference) {
    const end = note.time + (note.duration ?? 0);
    if (time >= note.time && time < end) return note.freq;
  }
  return null;
}

export const pitchScorer: Scorer = {
  name: 'pitch',
  weight: 1,
  score(reference: PitchFrame[], user: PitchFrame[]): number {
    if (user.length === 0) return 0;

    // ノート範囲内に入るユーザーフレームのみ評価対象にする
    const scorableFrames = user.filter((f) => findReferenceFreq(f.time, reference) !== null);
    if (scorableFrames.length === 0) return 0;

    let matched = 0;
    for (const frame of scorableFrames) {
      const refFreq = findReferenceFreq(frame.time, reference)!;
      const diff = Math.abs(freqToSemitone(frame.freq) - freqToSemitone(refFreq));
      if (diff <= MATCH_THRESHOLD_SEMITONES) matched++;
    }

    return Math.round((matched / scorableFrames.length) * 100);
  },
};
