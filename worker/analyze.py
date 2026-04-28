"""
音声ファイルを解析して伴奏とメロディJSONを生成する。

Usage:
    uv run python analyze.py <input_audio> <output_dir>

Output:
    <output_dir>/accompaniment.wav  -- ボーカル除去済み伴奏
    <output_dir>/melody.json        -- ピッチ列JSON
"""

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import crepe
import librosa
import numpy as np
import soundfile as sf


CONFIDENCE_THRESHOLD = 0.5
SAMPLE_RATE = 16000


def separate_vocals(input_path: Path, work_dir: Path) -> tuple[Path, Path]:
    """Demucs でボーカルと伴奏を分離する。(vocals.wav, no_vocals.wav) を返す。"""
    subprocess.run(
        ["demucs", "--two-stems=vocals", str(input_path), "-o", str(work_dir)],
        check=True,
    )
    stem = work_dir / "htdemucs" / input_path.stem
    return stem / "vocals.wav", stem / "no_vocals.wav"


def extract_melody(vocals_path: Path) -> tuple[list[dict], float]:
    """CREPE でピッチ列を抽出する。(pitches, duration) を返す。"""
    audio, sr = librosa.load(str(vocals_path), sr=SAMPLE_RATE, mono=True)
    duration = len(audio) / sr

    times, frequencies, confidences, _ = crepe.predict(
        audio, sr, viterbi=True, verbose=0
    )

    pitches = []
    i = 0
    while i < len(times):
        if confidences[i] < CONFIDENCE_THRESHOLD:
            i += 1
            continue

        # 同じ信頼度以上が続く区間をまとめてノートにする
        start = i
        while i < len(times) and confidences[i] >= CONFIDENCE_THRESHOLD:
            i += 1
        end = i - 1

        freq = float(np.median(frequencies[start : end + 1]))
        note_duration = float(times[end] - times[start]) + 0.01  # 最小幅
        pitches.append(
            {"time": round(float(times[start]), 3), "freq": round(freq, 2), "duration": round(note_duration, 3)}
        )

    return pitches, duration


def analyze(input_path: str, output_dir: str) -> dict:
    """メインの解析関数。Modal 移行時はこの関数に decorator を付けるだけ。"""
    inp = Path(input_path)
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)

        print(f"[1/3] Demucs でボーカル分離中: {inp.name}")
        vocals, no_vocals = separate_vocals(inp, tmp_path)

        print("[2/3] CREPE でメロディ抽出中...")
        pitches, duration = extract_melody(vocals)

        print("[3/3] 結果を保存中...")
        accompaniment_out = out / "accompaniment.wav"
        shutil.copy(no_vocals, accompaniment_out)

        result = {
            "songId": inp.stem,
            "title": inp.stem,
            "accompaniment": str(accompaniment_out),
            "duration": round(duration, 3),
            "pitches": pitches,
        }
        (out / "melody.json").write_text(json.dumps(result, indent=2, ensure_ascii=False))

    print(f"完了: {len(pitches)} ノート, {duration:.1f} 秒")
    return result


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: uv run python analyze.py <input_audio> <output_dir>")
        sys.exit(1)
    analyze(sys.argv[1], sys.argv[2])
