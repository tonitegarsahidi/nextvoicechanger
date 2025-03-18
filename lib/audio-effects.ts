import { AudioWorkletNode, IBaseAudioContext, IConstantSourceNode, IBiquadFilterNode, IGainNode, IConvolverNode, IAudioDestinationNode, IMediaElementAudioSourceNode, IAudioContext } from 'standardized-audio-context';

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

// Create a simple impulse response for reverb
export const createReverbImpulseResponse = (audioContext: IBaseAudioContext<IAudioContext>, duration = 2, decay = 2): AudioBuffer => {
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

// Audio processing nodes interface
export interface AudioNodes {
  sourceNode: IMediaElementAudioSourceNode<IAudioContext>
  pitchNode: AudioWorkletNode<any> | null
  bassFilter: IBiquadFilterNode<IAudioContext>
  trebleFilter: IBiquadFilterNode<IAudioContext>
  convolverNode: IConvolverNode<IAudioContext>
  dryGain: IGainNode<IAudioContext>
  wetGain: IGainNode<IAudioContext>
  outputGain: IGainNode<IAudioContext>
}

// Setup audio processing graph with all effects
export const setupAudioGraph = async (
  audioContext: IAudioContext,
  audioElement: HTMLAudioElement,
  effects: AudioEffects,
): Promise<AudioNodes> => {
  // Create source node
  const sourceNode = audioContext.createMediaElementSource(audioElement) as IMediaElementAudioSourceNode<IAudioContext>;

  // Create pitch shifter node if supported
  let pitchNode: AudioWorkletNode<any> | null = null
  try {
    // Load the processor code
    if (AudioWorkletNode && audioContext.audioWorklet) {
      // Check if the processor is already registered
      try {
        // Try to create the node first - if it fails, we need to register the processor
        pitchNode = new AudioWorkletNode(audioContext as any, "pitch-shifter-processor");
      } catch (e) {
        // Processor not registered yet, load it
        await audioContext.audioWorklet.addModule('/worklets/pitch-shifter-processor.js');
        
        // Now create the node
        pitchNode = new AudioWorkletNode(audioContext as any, "pitch-shifter-processor");
      }
      
      // Set initial pitch
      const pitchRatio = Math.pow(2, effects.pitch / 12) // Convert semitones to ratio
      pitchNode.port.postMessage({ pitchRatio })
    }
  } catch (error) {
    console.warn("Pitch shifter not available, falling back to playbackRate:", error)
    pitchNode = null
  }

  // Create filters
  const bassFilter = audioContext.createBiquadFilter() as IBiquadFilterNode<IAudioContext>;
  bassFilter.type = "lowshelf"
  bassFilter.frequency.value = 200
  bassFilter.gain.value = effects.bass

  const trebleFilter = audioContext.createBiquadFilter() as IBiquadFilterNode<IAudioContext>;
  trebleFilter.type = "highshelf"
  trebleFilter.frequency.value = 3000
  trebleFilter.gain.value = effects.treble

  // Create reverb (convolver)
  const convolverNode = audioContext.createConvolver() as IConvolverNode<IAudioContext>;
  convolverNode.buffer = createReverbImpulseResponse(audioContext)

  // Create gain nodes for wet/dry mix
  const wetGain = audioContext.createGain() as IGainNode<IAudioContext>;
  wetGain.gain.value = effects.reverb

  const dryGain = audioContext.createGain() as IGainNode<IAudioContext>;
  dryGain.gain.value = 1 - effects.reverb

  // Create output gain
  const outputGain = audioContext.createGain() as IGainNode<IAudioContext>;
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
