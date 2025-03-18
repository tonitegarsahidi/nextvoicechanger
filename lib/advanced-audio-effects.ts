// Advanced audio processing utilities using Web Audio API

import type { AudioEffects } from "./audio-effects"

// Define OversampleType
type OversampleType = "2x" | "4x" | "none"

// Advanced effects interface
export interface AdvancedAudioEffects {
  echo: {
    enabled: boolean
    delayTime: number // 0.1 to 1.0 seconds
    feedback: number // 0 to 0.9
    mix: number // 0 to 1.0
  }
  distortion: {
    enabled: boolean
    amount: number // 0 to 100
    oversample: "2x" | "4x" | "none"
  }
  chorus: {
    enabled: boolean
    rate: number // 0.1 to 8 Hz
    depth: number // 0 to 1.0
    mix: number // 0 to 1.0
  }
  flanger: {
    enabled: boolean
    delay: number // 0.001 to 0.02 seconds
    depth: number // 0.001 to 0.01 seconds
    rate: number // 0.1 to 5 Hz
    feedback: number // 0 to 0.9
  }
  phaser: {
    enabled: boolean
    rate: number // 0.1 to 8 Hz
    depth: number // 0 to 1.0
    feedback: number // 0 to 0.9
    stages: number // 2 to 12
  }
  autoTune: {
    enabled: boolean
    scale: "major" | "minor" | "chromatic"
    amount: number // 0 to 1.0 (subtle to strong)
  }
  formantShift: {
    enabled: boolean
    shift: number // -2 to 2 (lower to higher formants)
  }
  timeStretch: {
    enabled: boolean
    rate: number // 0.5 to 2.0
  }
  compression: {
    enabled: boolean
    threshold: number // -60 to 0 dB
    ratio: number // 1 to 20
    attack: number // 0 to 1.0 seconds
    release: number // 0 to 1.0 seconds
  }
  granular: {
    enabled: boolean
    grainSize: number // 0.01 to 0.5 seconds
    scatter: number // 0 to 1.0
    density: number // 0 to 1.0
  }
}

// Default advanced effects settings
export const defaultAdvancedEffects: AdvancedAudioEffects = {
  echo: {
    enabled: false,
    delayTime: 0.3,
    feedback: 0.4,
    mix: 0.3,
  },
  distortion: {
    enabled: false,
    amount: 20,
    oversample: "4x",
  },
  chorus: {
    enabled: false,
    rate: 1.5,
    depth: 0.7,
    mix: 0.5,
  },
  flanger: {
    enabled: false,
    delay: 0.005,
    depth: 0.002,
    rate: 0.5,
    feedback: 0.5,
  },
  phaser: {
    enabled: false,
    rate: 0.5,
    depth: 0.5,
    feedback: 0.5,
    stages: 6,
  },
  autoTune: {
    enabled: false,
    scale: "major",
    amount: 0.5,
  },
  formantShift: {
    enabled: false,
    shift: 0,
  },
  timeStretch: {
    enabled: false,
    rate: 1.0,
  },
  compression: {
    enabled: false,
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
  },
  granular: {
    enabled: false,
    grainSize: 0.1,
    scatter: 0.2,
    density: 0.8,
  },
}

// Combined effects interface
export interface CombinedAudioEffects {
  basic: AudioEffects
  advanced: AdvancedAudioEffects
}

// Create a delay node for echo effect
export const createDelayNode = (
  audioContext: AudioContext,
  delayTime: number,
  feedback: number,
): { delayNode: DelayNode; feedbackGain: GainNode } => {
  const delayNode = audioContext.createDelay(2.0) // Max 2 seconds delay
  delayNode.delayTime.value = delayTime

  const feedbackGain = audioContext.createGain()
  feedbackGain.gain.value = feedback

  // Connect delay to feedback loop
  delayNode.connect(feedbackGain)
  feedbackGain.connect(delayNode)

  return { delayNode, feedbackGain }
}

// Create a waveshaper node for distortion effect
export const createDistortionNode = (
  audioContext: AudioContext,
  amount: number,
  oversample: OversampleType = "4x",
): WaveShaperNode => {
  const distortion = audioContext.createWaveShaper()
  distortion.oversample = oversample

  // Create distortion curve
  const k = amount >= 100 ? 99.9 : amount // Prevent infinity
  const deg = Math.PI / 180
  const samples = 44100
  const curve = new Float32Array(samples)

  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
  }

  distortion.curve = curve
  return distortion
}

// Create oscillator and gain nodes for chorus/flanger effects
export const createModulationNodes = (
  audioContext: AudioContext,
  rate: number,
  depth: number,
): { oscillator: OscillatorNode; modulationGain: GainNode } => {
  const oscillator = audioContext.createOscillator()
  oscillator.type = "sine"
  oscillator.frequency.value = rate

  const modulationGain = audioContext.createGain()
  modulationGain.gain.value = depth

  oscillator.connect(modulationGain)
  oscillator.start()

  return { oscillator, modulationGain }
}

// Create a compressor node
export const createCompressorNode = (
  audioContext: AudioContext,
  threshold: number,
  ratio: number,
  attack: number,
  release: number,
): DynamicsCompressorNode => {
  const compressor = audioContext.createDynamicsCompressor()
  compressor.threshold.value = threshold
  compressor.ratio.value = ratio
  compressor.attack.value = attack
  compressor.release.value = release
  return compressor
}

// Create a biquad filter for phaser effect
export const createPhaserFilters = (audioContext: AudioContext, stages: number): BiquadFilterNode[] => {
  const filters: BiquadFilterNode[] = []

  for (let i = 0; i < stages; i++) {
    const filter = audioContext.createBiquadFilter()
    filter.type = "allpass"
    filter.frequency.value = 1000 // Will be modulated
    filter.Q.value = 5
    filters.push(filter)
  }

  return filters
}

// Create a worklet for granular synthesis
export const createGranularProcessor = async (audioContext: AudioContext): Promise<boolean> => {
  if (!audioContext.audioWorklet) {
    console.error("AudioWorklet not supported in this browser")
    return false
  }

  try {
    // Check if the processor is already registered
    try {
      // Try to create the node first - if it fails, we need to register the processor
      new AudioWorkletNode(audioContext, "granular-processor");
      console.log("Granular processor already registered");
      return true;
    } catch (e) {
      // Processor not registered yet, load it from the public folder
      await audioContext.audioWorklet.addModule('/worklets/granular-processor.js');
      console.log("Granular processor registered successfully");
      return true;
    }
  } catch (error) {
    console.error("Failed to register granular processor:", error);
    return false;
  }
}

// Create a worklet for auto-tune effect
export const createAutoTuneProcessor = async (audioContext: AudioContext): Promise<boolean> => {
  if (!audioContext.audioWorklet) {
    console.error("AudioWorklet not supported in this browser")
    return false
  }

  try {
    // Check if the processor is already registered
    try {
      // Try to create the node first - if it fails, we need to register the processor
      new AudioWorkletNode(audioContext, "auto-tune-processor");
      console.log("Auto-tune processor already registered");
      return true;
    } catch (e) {
      // Processor not registered yet, load it from the public folder
      await audioContext.audioWorklet.addModule('/worklets/auto-tune-processor.js');
      console.log("Auto-tune processor registered successfully");
      return true;
    }
  } catch (error) {
    console.error("Failed to register auto-tune processor:", error);
    return false;
  }
}

// Create a worklet for formant shifting
export const createFormantShiftProcessor = async (audioContext: AudioContext): Promise<boolean> => {
  if (!audioContext.audioWorklet) {
    console.error("AudioWorklet not supported in this browser")
    return false
  }

  try {
    // Check if the processor is already registered
    try {
      // Try to create the node first - if it fails, we need to register the processor
      new AudioWorkletNode(audioContext, "formant-shift-processor");
      console.log("Formant shift processor already registered");
      return true;
    } catch (e) {
      // Processor not registered yet, load it from the public folder
      await audioContext.audioWorklet.addModule('/worklets/formant-shift-processor.js');
      console.log("Formant shift processor registered successfully");
      return true;
    }
  } catch (error) {
    console.error("Failed to register formant shift processor:", error);
    return false;
  }
}

// Create a worklet for time stretching
export const createTimeStretchProcessor = async (audioContext: AudioContext): Promise<boolean> => {
  if (!audioContext.audioWorklet) {
    console.error("AudioWorklet not supported in this browser")
    return false
  }

  try {
    // Check if the processor is already registered
    try {
      // Try to create the node first - if it fails, we need to register the processor
      new AudioWorkletNode(audioContext, "time-stretch-processor");
      console.log("Time stretch processor already registered");
      return true;
    } catch (e) {
      // Processor not registered yet, load it from the public folder
      await audioContext.audioWorklet.addModule('/worklets/time-stretch-processor.js');
      console.log("Time stretch processor registered successfully");
      return true;
    }
  } catch (error) {
    console.error("Failed to register time stretch processor:", error);
    return false;
  }
}

// Advanced audio nodes interface
export interface AdvancedAudioNodes {
  // Echo effect
  echoDelayNode?: DelayNode
  echoFeedbackGain?: GainNode
  echoMixGain?: GainNode
  echoDryGain?: GainNode

  // Distortion effect
  distortionNode?: WaveShaperNode
  distortionMixGain?: GainNode
  distortionDryGain?: GainNode

  // Chorus effect
  chorusDelayNode?: DelayNode
  chorusOscillator?: OscillatorNode
  chorusModulationGain?: GainNode
  chorusMixGain?: GainNode
  chorusDryGain?: GainNode

  // Flanger effect
  flangerDelayNode?: DelayNode
  flangerOscillator?: OscillatorNode
  flangerModulationGain?: GainNode
  flangerFeedbackGain?: GainNode
  flangerMixGain?: GainNode
  flangerDryGain?: GainNode

  // Phaser effect
  phaserFilters?: BiquadFilterNode[]
  phaserOscillator?: OscillatorNode
  phaserModulationGain?: GainNode
  phaserFeedbackGain?: GainNode
  phaserMixGain?: GainNode
  phaserDryGain?: GainNode

  // Auto-tune effect
  autoTuneNode?: AudioWorkletNode

  // Formant shift effect
  formantShiftNode?: AudioWorkletNode

  // Time stretch effect
  timeStretchNode?: AudioWorkletNode

  // Compression effect
  compressorNode?: DynamicsCompressorNode

  // Granular synthesis effect
  granularNode?: AudioWorkletNode
}

// Setup advanced audio processing graph
export const setupAdvancedAudioGraph = async (
  audioContext: AudioContext,
  sourceNode: MediaElementAudioSourceNode,
  destinationNode: AudioNode,
  effects: AdvancedAudioEffects,
): Promise<AdvancedAudioNodes> => {
  const nodes: AdvancedAudioNodes = {}

  // Create a chain of effects
  let currentNode: AudioNode = sourceNode

  // 1. Echo effect
  if (effects.echo.enabled) {
    const { delayNode, feedbackGain } = createDelayNode(audioContext, effects.echo.delayTime, effects.echo.feedback)

    const dryGain = audioContext.createGain()
    dryGain.gain.value = 1 - effects.echo.mix

    const wetGain = audioContext.createGain()
    wetGain.gain.value = effects.echo.mix

    // Connect
    currentNode.connect(dryGain)
    currentNode.connect(delayNode)
    delayNode.connect(wetGain)

    // Merge dry and wet
    const merger = audioContext.createGain()
    dryGain.connect(merger)
    wetGain.connect(merger)

    // Update current node
    currentNode = merger

    // Store nodes
    nodes.echoDelayNode = delayNode
    nodes.echoFeedbackGain = feedbackGain
    nodes.echoMixGain = wetGain
    nodes.echoDryGain = dryGain
  }

  // 2. Distortion effect
  if (effects.distortion.enabled) {
    const distortionNode = createDistortionNode(
      audioContext,
      effects.distortion.amount,
      effects.distortion.oversample as OversampleType,
    )

    const dryGain = audioContext.createGain()
    dryGain.gain.value = 0.5 // Fixed mix for distortion

    const wetGain = audioContext.createGain()
    wetGain.gain.value = 0.5

    // Connect
    currentNode.connect(dryGain)
    currentNode.connect(distortionNode)
    distortionNode.connect(wetGain)

    // Merge dry and wet
    const merger = audioContext.createGain()
    dryGain.connect(merger)
    wetGain.connect(merger)

    // Update current node
    currentNode = merger

    // Store nodes
    nodes.distortionNode = distortionNode
    nodes.distortionMixGain = wetGain
    nodes.distortionDryGain = dryGain
  }

  // 3. Chorus effect
  if (effects.chorus.enabled) {
    const delayNode = audioContext.createDelay(0.05)
    delayNode.delayTime.value = 0.03 // 30ms delay

    const { oscillator, modulationGain } = createModulationNodes(
      audioContext,
      effects.chorus.rate,
      0.005 * effects.chorus.depth, // Convert to seconds
    )

    // Connect modulation
    modulationGain.connect(delayNode.delayTime)

    const dryGain = audioContext.createGain()
    dryGain.gain.value = 1 - effects.chorus.mix

    const wetGain = audioContext.createGain()
    wetGain.gain.value = effects.chorus.mix

    // Connect
    currentNode.connect(dryGain)
    currentNode.connect(delayNode)
    delayNode.connect(wetGain)

    // Merge dry and wet
    const merger = audioContext.createGain()
    dryGain.connect(merger)
    wetGain.connect(merger)

    // Update current node
    currentNode = merger

    // Store nodes
    nodes.chorusDelayNode = delayNode
    nodes.chorusOscillator = oscillator
    nodes.chorusModulationGain = modulationGain
    nodes.chorusMixGain = wetGain
    nodes.chorusDryGain = dryGain
  }

  // 4. Flanger effect
  if (effects.flanger.enabled) {
    const delayNode = audioContext.createDelay(0.05)
    delayNode.delayTime.value = effects.flanger.delay

    const { oscillator, modulationGain } = createModulationNodes(
      audioContext,
      effects.flanger.rate,
      effects.flanger.depth,
    )

    const feedbackGain = audioContext.createGain()
    feedbackGain.gain.value = effects.flanger.feedback

    // Connect modulation
    modulationGain.connect(delayNode.delayTime)

    // Connect feedback loop
    delayNode.connect(feedbackGain)
    feedbackGain.connect(delayNode)

    const dryGain = audioContext.createGain()
    dryGain.gain.value = 0.5 // Fixed mix for flanger

    const wetGain = audioContext.createGain()
    wetGain.gain.value = 0.5

    // Connect
    currentNode.connect(dryGain)
    currentNode.connect(delayNode)
    delayNode.connect(wetGain)

    // Merge dry and wet
    const merger = audioContext.createGain()
    dryGain.connect(merger)
    wetGain.connect(merger)

    // Update current node
    currentNode = merger

    // Store nodes
    nodes.flangerDelayNode = delayNode
    nodes.flangerOscillator = oscillator
    nodes.flangerModulationGain = modulationGain
    nodes.flangerFeedbackGain = feedbackGain
    nodes.flangerMixGain = wetGain
    nodes.flangerDryGain = dryGain
  }

  // 5. Phaser effect
  if (effects.phaser.enabled) {
    const filters = createPhaserFilters(audioContext, effects.phaser.stages)

    const { oscillator, modulationGain } = createModulationNodes(
      audioContext,
      effects.phaser.rate,
      2000 * effects.phaser.depth, // Scale depth to frequency range
    )

    const feedbackGain = audioContext.createGain()
    feedbackGain.gain.value = effects.phaser.feedback

    // Connect filters in series
    let filterChain: AudioNode = currentNode
    for (const filter of filters) {
      filterChain.connect(filter)
      filterChain = filter

      // Connect modulation to each filter
      modulationGain.connect(filter.frequency)
    }

    // Connect feedback
    filterChain.connect(feedbackGain)
    feedbackGain.connect(filters[0])

    const dryGain = audioContext.createGain()
    dryGain.gain.value = 0.5 // Fixed mix

    const wetGain = audioContext.createGain()
    wetGain.gain.value = 0.5

    // Connect
    currentNode.connect(dryGain)
    filterChain.connect(wetGain)

    // Merge dry and wet
    const merger = audioContext.createGain()
    dryGain.connect(merger)
    wetGain.connect(merger)

    // Update current node
    currentNode = merger

    // Store nodes
    nodes.phaserFilters = filters
    nodes.phaserOscillator = oscillator
    nodes.phaserModulationGain = modulationGain
    nodes.phaserFeedbackGain = feedbackGain
    nodes.phaserMixGain = wetGain
    nodes.phaserDryGain = dryGain
  }

  // 6. Compression effect
  if (effects.compression.enabled) {
    const compressor = createCompressorNode(
      audioContext,
      effects.compression.threshold,
      effects.compression.ratio,
      effects.compression.attack,
      effects.compression.release,
    )

    // Connect
    currentNode.connect(compressor)

    // Update current node
    currentNode = compressor

    // Store node
    nodes.compressorNode = compressor
  }

  // 7. Auto-tune effect
  if (effects.autoTune.enabled) {
    try {
      // Register processor if needed
      await createAutoTuneProcessor(audioContext)

      // Create node
      const autoTuneNode = new AudioWorkletNode(audioContext, "auto-tune-processor")

      // Set parameters
      autoTuneNode.port.postMessage({
        scale: effects.autoTune.scale,
        amount: effects.autoTune.amount,
      })

      // Connect
      currentNode.connect(autoTuneNode)

      // Update current node
      currentNode = autoTuneNode

      // Store node
      nodes.autoTuneNode = autoTuneNode
    } catch (error) {
      console.error("Failed to create auto-tune effect:", error)
    }
  }

  // 8. Formant shift effect
  if (effects.formantShift.enabled) {
    try {
      // Register processor if needed
      await createFormantShiftProcessor(audioContext)

      // Create node
      const formantShiftNode = new AudioWorkletNode(audioContext, "formant-shift-processor")

      // Set parameters
      formantShiftNode.port.postMessage({
        shift: effects.formantShift.shift,
      })

      // Connect
      currentNode.connect(formantShiftNode)

      // Update current node
      currentNode = formantShiftNode

      // Store node
      nodes.formantShiftNode = formantShiftNode
    } catch (error) {
      console.error("Failed to create formant shift effect:", error)
    }
  }

  // 9. Time stretch effect
  if (effects.timeStretch.enabled) {
    try {
      // Register processor if needed
      await createTimeStretchProcessor(audioContext)

      // Create node
      const timeStretchNode = new AudioWorkletNode(audioContext, "time-stretch-processor")

      // Set parameters
      timeStretchNode.port.postMessage({
        rate: effects.timeStretch.rate,
      })

      // Connect
      currentNode.connect(timeStretchNode)

      // Update current node
      currentNode = timeStretchNode

      // Store node
      nodes.timeStretchNode = timeStretchNode
    } catch (error) {
      console.error("Failed to create time stretch effect:", error)
    }
  }

  // 10. Granular synthesis effect
  if (effects.granular.enabled) {
    try {
      // Register processor if needed
      await createGranularProcessor(audioContext)

      // Create node
      const granularNode = new AudioWorkletNode(audioContext, "granular-processor")

      // Set parameters
      granularNode.port.postMessage({
        grainSize: effects.granular.grainSize,
        scatter: effects.granular.scatter,
        density: effects.granular.density,
      })

      // Connect
      currentNode.connect(granularNode)

      // Update current node
      currentNode = granularNode

      // Store node
      nodes.granularNode = granularNode
    } catch (error) {
      console.error("Failed to create granular synthesis effect:", error)
    }
  }

  // Connect final node to destination
  currentNode.connect(destinationNode)

  return nodes
}

// Update advanced audio effects in real-time
export const updateAdvancedAudioEffects = (nodes: AdvancedAudioNodes, effects: AdvancedAudioEffects): void => {
  // 1. Update echo effect
  if (effects.echo.enabled && nodes.echoDelayNode && nodes.echoFeedbackGain && nodes.echoMixGain && nodes.echoDryGain) {
    nodes.echoDelayNode.delayTime.value = effects.echo.delayTime
    nodes.echoFeedbackGain.gain.value = effects.echo.feedback
    nodes.echoMixGain.gain.value = effects.echo.mix
    nodes.echoDryGain.gain.value = 1 - effects.echo.mix
  }

  // 2. Update distortion effect
  if (effects.distortion.enabled && nodes.distortionNode) {
    // Recreate curve with new amount
    const k = effects.distortion.amount >= 100 ? 99.9 : effects.distortion.amount
    const deg = Math.PI / 180
    const samples = 44100
    const curve = new Float32Array(samples)

    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
    }

    nodes.distortionNode.curve = curve
    nodes.distortionNode.oversample = effects.distortion.oversample as OversampleType
  }

  // 3. Update chorus effect
  if (
    effects.chorus.enabled &&
    nodes.chorusOscillator &&
    nodes.chorusModulationGain &&
    nodes.chorusMixGain &&
    nodes.chorusDryGain
  ) {
    nodes.chorusOscillator.frequency.value = effects.chorus.rate
    nodes.chorusModulationGain.gain.value = 0.005 * effects.chorus.depth
    nodes.chorusMixGain.gain.value = effects.chorus.mix
    nodes.chorusDryGain.gain.value = 1 - effects.chorus.mix
  }

  // 4. Update flanger effect
  if (
    effects.flanger.enabled &&
    nodes.flangerDelayNode &&
    nodes.flangerOscillator &&
    nodes.flangerModulationGain &&
    nodes.flangerFeedbackGain
  ) {
    nodes.flangerDelayNode.delayTime.value = effects.flanger.delay
    nodes.flangerOscillator.frequency.value = effects.flanger.rate
    nodes.flangerModulationGain.gain.value = effects.flanger.depth
    nodes.flangerFeedbackGain.gain.value = effects.flanger.feedback
  }

  // 5. Update phaser effect
  if (effects.phaser.enabled && nodes.phaserOscillator && nodes.phaserModulationGain && nodes.phaserFeedbackGain) {
    nodes.phaserOscillator.frequency.value = effects.phaser.rate
    nodes.phaserModulationGain.gain.value = 2000 * effects.phaser.depth
    nodes.phaserFeedbackGain.gain.value = effects.phaser.feedback
  }

  // 6. Update compression effect
  if (effects.compression.enabled && nodes.compressorNode) {
    nodes.compressorNode.threshold.value = effects.compression.threshold
    nodes.compressorNode.ratio.value = effects.compression.ratio
    nodes.compressorNode.attack.value = effects.compression.attack
    nodes.compressorNode.release.value = effects.compression.release
  }

  // 7. Update auto-tune effect
  if (effects.autoTune.enabled && nodes.autoTuneNode) {
    nodes.autoTuneNode.port.postMessage({
      scale: effects.autoTune.scale,
      amount: effects.autoTune.amount,
    })
  }

  // 8. Update formant shift effect
  if (effects.formantShift.enabled && nodes.formantShiftNode) {
    nodes.formantShiftNode.port.postMessage({
      shift: effects.formantShift.shift,
    })
  }

  // 9. Update time stretch effect
  if (effects.timeStretch.enabled && nodes.timeStretchNode) {
    nodes.timeStretchNode.port.postMessage({
      rate: effects.timeStretch.rate,
    })
  }

  // 10. Update granular synthesis effect
  if (effects.granular.enabled && nodes.granularNode) {
    nodes.granularNode.port.postMessage({
      grainSize: effects.granular.grainSize,
      scatter: effects.granular.scatter,
      density: effects.granular.density,
    })
  }
}

