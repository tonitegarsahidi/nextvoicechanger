// Time stretch processor for AudioWorklet
class TimeStretchProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.rate = 1.0; // 0.5 to 2.0
    this.windowSize = 1024;
    this.buffer = new Float32Array(this.windowSize * 2);
    this.bufferFill = 0;
    this.readPosition = 0;

    this.port.onmessage = (event) => {
      if (event.data.rate !== undefined) {
        this.rate = Math.max(0.5, Math.min(2.0, event.data.rate));
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

    // Add input to buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferFill] = inputChannel[i];
      this.bufferFill = (this.bufferFill + 1) % this.buffer.length;
    }

    // Read from buffer at time-stretched rate
    for (let i = 0; i < outputChannel.length; i++) {
      // Calculate read position
      const readPos = this.readPosition;
      const readPosInt = Math.floor(readPos);
      const readPosFrac = readPos - readPosInt;

      // Linear interpolation
      const pos1 = readPosInt % this.buffer.length;
      const pos2 = (readPosInt + 1) % this.buffer.length;

      outputChannel[i] = this.buffer[pos1] * (1 - readPosFrac) +
        this.buffer[pos2] * readPosFrac;

      // Advance read position at specified rate
      this.readPosition += this.rate;

      // Wrap read position
      if (this.readPosition >= this.buffer.length) {
        this.readPosition -= this.buffer.length;
      }
    }

    return true;
  }
}

registerProcessor('time-stretch-processor', TimeStretchProcessor);