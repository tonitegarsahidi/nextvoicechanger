/// <reference path="./audioworklet.d.ts" />

interface FormantShiftProcessorOptions extends AudioWorkletNodeOptions {
  processorOptions?: {
    port: MessagePort;
  };
}

class FormantShiftProcessor extends AudioWorkletProcessor {
  shift: number;
  formantFilters: { frequency: number; Q: number; gain: number }[];
  bufferSize: number;
  inputBuffer: Float32Array;
  outputBuffer: Float32Array;
  bufferFill: number;
  port: MessagePort;

  constructor(options?: FormantShiftProcessorOptions) {
    super(options);
    this.shift = 0; // -2 to 2

    // Formant filter banks
    this.formantFilters = [
      { frequency: 500, Q: 10, gain: 1 },   // First formant
      { frequency: 1500, Q: 8, gain: 0.7 }, // Second formant
      { frequency: 2500, Q: 6, gain: 0.4 }  // Third formant
    ];

    // Buffer for processing
    this.bufferSize = 2048;
    this.inputBuffer = new Float32Array(this.bufferSize);
    this.outputBuffer = new Float32Array(this.bufferSize);
    this.bufferFill = 0;

    this.port = (options?.processorOptions?.port) as MessagePort;

    this.port.onmessage = (event: { data: { shift: number } }) => {
      if (event.data.shift !== undefined) {
        this.shift = Math.max(-2, Math.min(2, event.data.shift));

        // Update formant frequencies based on shift
        this.formantFilters[0].frequency = 500 * Math.pow(1.5, this.shift);
        this.formantFilters[1].frequency = 1500 * Math.pow(1.5, this.shift);
        this.formantFilters[2].frequency = 2500 * Math.pow(1.5, this.shift);
      }
    };
  }

  // Biquad filter implementation with state variables
  x1: Float32Array = new Float32Array(3);
  x2: Float32Array = new Float32Array(3);
  y1: Float32Array = new Float32Array(3);
  y2: Float32Array = new Float32Array(3);

  applyFilter(sample: number, filter: { frequency: number; Q: number; gain: number }, filterIndex: number) {
    const w0 = 2 * Math.PI * filter.frequency / sampleRate;
    const alpha = Math.sin(w0) / (2 * filter.Q);

    const b0 = (1 + alpha) * filter.gain;
    const b1 = -2 * Math.cos(w0) * filter.gain;
    const b2 = (1 - alpha) * filter.gain;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;

    // Normalize coefficients
    const b0_norm = b0 / a0;
    const b1_norm = b1 / a0;
    const b2_norm = b2 / a0;
    const a1_norm = a1 / a0;
    const a2_norm = a2 / a0;

    // Apply filter with state variables (direct form II)
    const result = b0_norm * sample + b1_norm * this.x1[filterIndex] + b2_norm * this.x2[filterIndex]
                  - a1_norm * this.y1[filterIndex] - a2_norm * this.y2[filterIndex];
    
    // Update state variables
    this.x2[filterIndex] = this.x1[filterIndex];
    this.x1[filterIndex] = sample;
    this.y2[filterIndex] = this.y1[filterIndex];
    this.y1[filterIndex] = result;
    
    return result;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];

    // Process each sample
    for (let i = 0; i < inputChannel.length; i++) {
      let sample = inputChannel[i];

      // Apply formant filters
      let filteredSample = 0;
      for (let i = 0; i < this.formantFilters.length; i++) {
        filteredSample += this.applyFilter(sample, this.formantFilters[i], i);
      }

      // Mix original and filtered signal
      outputChannel[i] = sample * 0.3 + filteredSample * 0.7;
    }

    return true;
  }
}

registerProcessor('formant-shift-processor', FormantShiftProcessor);