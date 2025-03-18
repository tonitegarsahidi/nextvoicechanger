// Granular synthesis processor for AudioWorklet
class GranularProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.grainSize = 4096; // Default grain size
    this.scatter = 0.2;
    this.density = 0.8;
    this.buffer = new Float32Array(32768); // Buffer for grains
    this.bufferFill = 0;
    this.grains = [];
    this.sampleRate = 44100;
    
    this.port.onmessage = (event) => {
      if (event.data.grainSize !== undefined) {
        this.grainSize = Math.floor(event.data.grainSize * this.sampleRate);
      }
      if (event.data.scatter !== undefined) {
        this.scatter = event.data.scatter;
      }
      if (event.data.density !== undefined) {
        this.density = event.data.density;
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
    
    // Clear output
    for (let i = 0; i < outputChannel.length; i++) {
      outputChannel[i] = 0;
    }
    
    // Create new grains based on density
    if (Math.random() < this.density * 0.1) {
      const startPos = Math.floor(Math.random() * (this.buffer.length - this.grainSize));
      const endPos = startPos + this.grainSize;
      const offset = Math.floor(Math.random() * this.scatter * this.sampleRate);
      
      this.grains.push({
        start: startPos,
        end: endPos,
        pos: 0,
        offset: offset
      });
    }
    
    // Process active grains
    for (let i = 0; i < this.grains.length; i++) {
      const grain = this.grains[i];
      
      for (let j = 0; j < outputChannel.length; j++) {
        if (grain.pos < this.grainSize) {
          // Apply envelope (simple triangle)
          const envelope = 1 - Math.abs(2 * grain.pos / this.grainSize - 1);
          const bufferPos = (grain.start + grain.pos) % this.buffer.length;
          
          // Add grain sample to output
          outputChannel[(j + grain.offset) % outputChannel.length] += 
            this.buffer[bufferPos] * envelope * 0.5;
          
          grain.pos++;
        }
      }
    }
    
    // Remove completed grains
    this.grains = this.grains.filter(grain => grain.pos < this.grainSize);
    
    return true;
  }
}

registerProcessor('granular-processor', GranularProcessor);