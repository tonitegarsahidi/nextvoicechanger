// Audio processing utilities using Web Audio API

export interface AudioEffects {
  character: "normal" | "chipmunk" | "robot" | "deep"
  pitch: number // -12 to 12 semitones
  treble: number // -10 to 10 dB
  bass: number // -10 to 10 dB
  reverb: number // 0 to 1
  speed: number // 0.5 to 2.0
}

export const defaultEffects: AudioEffects = {
  character: "normal",
  pitch: 0,
  treble: 0,
  bass: 0,
  reverb: 0,
  speed: 1.0,
}

// Create a simple impulse response for reverb
export const createReverbImpulseResponse = (audioContext: AudioContext, duration = 2, decay = 2): AudioBuffer => {
  const sampleRate = audioContext.sampleRate
  const length = sampleRate * duration
  const impulse = audioContext.createBuffer(2, length, sampleRate)
  const leftChannel = impulse.getChannelData(0)
  const rightChannel = impulse.getChannelData(1)

  for (let i = 0; i < length; i++) {
    const n = i / length
    // Decay exponentially
    const amplitude = Math.pow(1 - n, decay)
    // Random noise
    leftChannel[i] = (Math.random() * 2 - 1) * amplitude
    rightChannel[i] = (Math.random() * 2 - 1) * amplitude
  }

  return impulse
}

// Apply character presets
export const applyCharacterPreset = (
  effects: AudioEffects,
  character: "normal" | "chipmunk" | "robot" | "deep",
): AudioEffects => {
  const newEffects = { ...effects, character }

  switch (character) {
    case "chipmunk":
      newEffects.pitch = 7
      newEffects.speed = 1.3
      newEffects.treble = 5
      newEffects.bass = -2
      newEffects.reverb = 0.1
      break
    case "robot":
      newEffects.pitch = 0
      newEffects.speed = 1.0
      newEffects.treble = 8
      newEffects.bass = 3
      newEffects.reverb = 0.4
      break
    case "deep":
      newEffects.pitch = -5
      newEffects.speed = 0.8
      newEffects.treble = -2
      newEffects.bass = 8
      newEffects.reverb = 0.3
      break
    case "normal":
    default:
      newEffects.pitch = 0
      newEffects.speed = 1.0
      newEffects.treble = 0
      newEffects.bass = 0
      newEffects.reverb = 0
      break
  }

  return newEffects
}

// Create pitch shift worklet processor
export const createPitchShiftProcessor = async (audioContext: AudioContext): Promise<void> => {
  // Only register once
  if (!audioContext.audioWorklet) {
    console.error("AudioWorklet not supported in this browser")
    return
  }

  try {
    // Check if already registered
    await audioContext.audioWorklet.addModule(
      URL.createObjectURL(
        new Blob(
          [
            `
            class PitchShifterProcessor extends AudioWorkletProcessor {
              constructor() {
                super();
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
            `,
          ],
          { type: "application/javascript" },
        ),
      ),
    )
    console.log("PitchShifter processor registered successfully")
  } catch (error) {
    console.error("Failed to register PitchShifter processor:", error)
  }
}

// Audio processing nodes interface
export interface AudioNodes {
  sourceNode: MediaElementAudioSourceNode
  pitchNode: AudioWorkletNode | null
  bassFilter: BiquadFilterNode
  trebleFilter: BiquadFilterNode
  convolverNode: ConvolverNode
  dryGain: GainNode
  wetGain: GainNode
  outputGain: GainNode
}

// Setup audio processing graph with all effects
export const setupAudioGraph = async (
  audioContext: AudioContext,
  audioElement: HTMLAudioElement,
  effects: AudioEffects,
): Promise<AudioNodes> => {
  // Register pitch shifter worklet if needed
  await createPitchShiftProcessor(audioContext)

  // Create source node
  const sourceNode = audioContext.createMediaElementSource(audioElement)

  // Create pitch shifter node if supported
  let pitchNode: AudioWorkletNode | null = null
  try {
    pitchNode = new AudioWorkletNode(audioContext, "pitch-shifter-processor")
    // Set initial pitch
    const pitchRatio = Math.pow(2, effects.pitch / 12) // Convert semitones to ratio
    pitchNode.port.postMessage({ pitchRatio })
  } catch (error) {
    console.warn("Pitch shifter not available, falling back to playbackRate:", error)
    pitchNode = null
  }

  // Create filters
  const bassFilter = audioContext.createBiquadFilter()
  bassFilter.type = "lowshelf"
  bassFilter.frequency.value = 200
  bassFilter.gain.value = effects.bass

  const trebleFilter = audioContext.createBiquadFilter()
  trebleFilter.type = "highshelf"
  trebleFilter.frequency.value = 3000
  trebleFilter.gain.value = effects.treble

  // Create reverb (convolver)
  const convolverNode = audioContext.createConvolver()
  convolverNode.buffer = createReverbImpulseResponse(audioContext)

  // Create gain nodes for wet/dry mix
  const wetGain = audioContext.createGain()
  wetGain.gain.value = effects.reverb

  const dryGain = audioContext.createGain()
  dryGain.gain.value = 1 - effects.reverb

  // Create output gain
  const outputGain = audioContext.createGain()
  outputGain.gain.value = 1.0

  // Connect the nodes
  if (pitchNode) {
    // With pitch shifter
    sourceNode.connect(pitchNode)
    pitchNode.connect(bassFilter)
  } else {
    // Without pitch shifter (fallback)
    sourceNode.connect(bassFilter)
  }

  bassFilter.connect(trebleFilter)

  // Dry path
  trebleFilter.connect(dryGain)
  dryGain.connect(outputGain)

  // Wet (reverb) path
  trebleFilter.connect(convolverNode)
  convolverNode.connect(wetGain)
  wetGain.connect(outputGain)

  // Final output
  outputGain.connect(audioContext.destination)

  // Apply speed
  audioElement.playbackRate = effects.speed

  return {
    sourceNode,
    pitchNode,
    bassFilter,
    trebleFilter,
    convolverNode,
    dryGain,
    wetGain,
    outputGain,
  }
}

// Update audio effects in real-time
export const updateAudioEffects = (audioElement: HTMLAudioElement, nodes: AudioNodes, effects: AudioEffects): void => {
  // Update filter values
  nodes.trebleFilter.gain.value = effects.treble
  nodes.bassFilter.gain.value = effects.bass

  // Update reverb mix
  nodes.wetGain.gain.value = effects.reverb
  nodes.dryGain.gain.value = 1 - effects.reverb

  // Update playback rate (speed)
  audioElement.playbackRate = effects.speed

  // Update pitch if available
  if (nodes.pitchNode) {
    const pitchRatio = Math.pow(2, effects.pitch / 12) // Convert semitones to ratio
    nodes.pitchNode.port.postMessage({ pitchRatio })
  } else {
    // Fallback for pitch: we'll use a combination of playbackRate and time stretching
    // This is a compromise that affects both pitch and speed
    console.log("Using fallback pitch adjustment via playbackRate")
  }
}

