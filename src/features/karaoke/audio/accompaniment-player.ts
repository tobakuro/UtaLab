export class AccompanimentPlayer {
  private audioContext: AudioContext | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;
  private startTime = 0;

  async load(url: string): Promise<void> {
    this.audioContext = new AudioContext();
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.bufferSource = this.audioContext.createBufferSource();
    this.bufferSource.buffer = audioBuffer;
    this.bufferSource.connect(this.audioContext.destination);
  }

  play(): number {
    if (!this.audioContext || !this.bufferSource) return 0;
    this.startTime = this.audioContext.currentTime;
    this.bufferSource.start(this.startTime);
    return this.startTime;
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    return this.audioContext.currentTime - this.startTime;
  }

  stop(): void {
    this.bufferSource?.stop();
    this.bufferSource = null;
    this.audioContext?.close();
    this.audioContext = null;
    this.startTime = 0;
  }
}
