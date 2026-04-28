'use client';

export interface PitchResult {
  pitch: number;
  clarity: number;
}

export type PitchCallback = (result: PitchResult) => void;

export class PitchDetectorNode {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  async start(onPitch: PitchCallback): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('/worklets/pitch-detector.worklet.js');

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'pitch-processor');

    this.workletNode.port.onmessage = (e: MessageEvent<PitchResult>) => {
      onPitch(e.data);
    };

    this.source.connect(this.workletNode);
  }

  stop(): void {
    this.source?.disconnect();
    this.workletNode?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();

    this.source = null;
    this.workletNode = null;
    this.stream = null;
    this.audioContext = null;
  }
}
