// Pitch shifter processor for AudioWorklet
class PitchShifterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.pitchRatio = 1.0;
    this.grainSize = 512;
    this.overlapRatio = 0.5;

    this.inputBuffer = new Float32Array(this.grainSize * 2);
    this.outputBuffer = new Float32Array(this.grainSize * 2);

    this.inputBufferFill = 0;
    this.outputBufferFill = 0;

    this.port.onmessage = (event) => {
      if (event.data.pitchRatio !== undefined) {
        this.pitchRatio = event.data.pitchRatio;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];

    // Simple time-domain pitch shifting
    // This is a basic implementation - a real one would use FFT
    const stretchFactor = 1.0 / this.pitchRatio;

    for (let i = 0; i < inputChannel.length; i++) {
      // Simple resampling for pitch shift
      const readPos = i * stretchFactor;
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

    return true;
  }
}

registerProcessor('pitch-shifter-processor', PitchShifterProcessor);