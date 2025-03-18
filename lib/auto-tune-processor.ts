/// <reference path="./audioworklet.d.ts" />

interface AutoTuneProcessorOptions extends AudioWorkletNodeOptions {
  processorOptions?: {
    port: MessagePort;
  };
}

class AutoTuneProcessor extends AudioWorkletProcessor {
  scales: { [key: string]: number[] };
  currentScale: number[];
  amount: number;
  rootNote: number;
  bufferSize: number;
  buffer: Float32Array;
  bufferIndex: number;
  currentPitch: number;
  targetPitch: number;
  port: MessagePort;
  sampleRate: number;

  constructor(options?: AutoTuneProcessorOptions) {
    super(options);
    // Define musical scales (semitone offsets from root)
    this.scales = {
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10]
    };

    this.currentScale = this.scales.major;
    this.amount = 0.5; // 0 to 1 (subtle to strong)
    this.rootNote = 0; // C

    // For pitch detection
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;

    // For pitch correction
    this.currentPitch = 0;
    this.targetPitch = 0;

    this.port = (options?.processorOptions?.port) as MessagePort;
    this.sampleRate = sampleRate;

    this.port.onmessage = (event: { data: { scale: string; amount: number } }) => {
      if (event.data.scale) {
        this.currentScale = this.scales[event.data.scale] || this.scales.major;
      }
      if (event.data.amount !== undefined) {
        this.amount = Math.max(0, Math.min(1, event.data.amount));
      }
    };
  }

  // Simple pitch detection using zero-crossing
  detectPitch(buffer: Float32Array) {
    let crossings = 0;
    let prevSample = 0;

    for (let i = 0; i < buffer.length; i++) {
      if ((prevSample < 0 && buffer[i] >= 0) ||
        (prevSample >= 0 && buffer[i] < 0)) {
        crossings++;
      }
      prevSample = buffer[i];
    }

    // Calculate frequency from zero-crossings
    const secondsPerBuffer = buffer.length / this.sampleRate;
    return crossings / (2 * secondsPerBuffer);
  }

  // Find closest note in scale
  findClosestNote(frequency: number) {
    // Convert frequency to MIDI note number
    const noteNumber = 12 * (Math.log2(frequency / 440) + 4.75);

    // Get the semitone offset from C
    const semitone = Math.round(noteNumber) % 12;

    // Find closest note in scale
    let closestNote = this.currentScale[0];
    let minDistance = 12;

    for (const note of this.currentScale) {
      const distance = Math.abs(semitone - note);
      if (distance < minDistance) {
        minDistance = distance;
        closestNote = note;
      }
    }

    // Calculate target frequency
    const octave = Math.floor(noteNumber / 12);
    const targetNoteNumber = octave * 12 + closestNote;
    return 440 * Math.pow(2, (targetNoteNumber - 69) / 12);
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];

    // Fill buffer for pitch detection
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex] = inputChannel[i];
      this.bufferIndex = (this.bufferIndex + 1) % this.bufferSize;

      // When buffer is full, detect pitch
      if (this.bufferIndex === 0) {
        const detectedFreq = this.detectPitch(this.buffer);
        if (detectedFreq > 50 && detectedFreq < 2000) { // Valid vocal range
          this.currentPitch = detectedFreq;
          this.targetPitch = this.findClosestNote(detectedFreq);
        }
      }
    }

    // Simple time-domain pitch shifting
    if (this.currentPitch > 0 && this.targetPitch > 0) {
      const ratio = this.targetPitch / this.currentPitch;
      const blendedRatio = 1 + (ratio - 1) * this.amount;

      for (let i = 0; i < outputChannel.length; i++) {
        // Simple resampling for pitch correction
        const readPos = i / blendedRatio;
        const readPosFloor = Math.floor(readPos);
        const readPosFrac = readPos - readPosFloor;

        if (readPosFloor >= 0 && readPosFloor < inputChannel.length - 1) {
          // Linear interpolation
          outputChannel[i] = inputChannel[readPosFloor] * (1 - readPosFrac) +
            inputChannel[readPosFloor + 1] * readPosFrac;
        } else if (readPosFloor >= 0 && readPosFloor < inputChannel.length) {
          outputChannel[i] = inputChannel[readPosFloor];
        } else {
          outputChannel[i] = 0;
        }
      }
    } else {
      // Pass through if no pitch detected
      for (let i = 0; i < outputChannel.length; i++) {
        outputChannel[i] = inputChannel[i];
      }
    }

    return true;
  }
}

registerProcessor('auto-tune-processor', AutoTuneProcessor);