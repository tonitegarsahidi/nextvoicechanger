// Type definitions for AudioWorklet API

declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: AudioWorkletNodeOptions);
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(
  name: string, 
  constructor: { new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor }
);

declare const sampleRate: number;