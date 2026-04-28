import { PitchDetector } from '/worklets/pitchy.js';

const BUFFER_SIZE = 2048;

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.detector = PitchDetector.forFloat32Array(BUFFER_SIZE);
    this.buffer = new Float32Array(BUFFER_SIZE);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferIndex++] = input[i];

      if (this.bufferIndex >= BUFFER_SIZE) {
        const [pitch, clarity] = this.detector.findPitch(this.buffer, sampleRate);
        this.port.postMessage({ pitch, clarity });
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
