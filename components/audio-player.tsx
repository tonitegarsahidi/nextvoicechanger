"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, Volume1, VolumeX, ChevronDown, ChevronUp, Download, Wand2 } from "lucide-react"
import {
  type AudioEffects,
  defaultEffects,
  setupAudioGraph,
  updateAudioEffects,
  type AudioNodes,
} from "@/lib/audio-effects"
import {
  type AdvancedAudioEffects,
  defaultAdvancedEffects,
  setupAdvancedAudioGraph,
  updateAdvancedAudioEffects,
  type AdvancedAudioNodes,
} from "@/lib/advanced-audio-effects"
import AudioEffectsPanel from "./audio-effects-panel"
import AdvancedEffectsPanel from "./advanced-effects-panel"
import DownloadAudioModal from "./download-audio-modal"

interface AudioPlayerProps {
  audio: { id: number; name: string; blob: Blob }
}

export default function AudioPlayer({ audio }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [basicEffects, setBasicEffects] = useState<AudioEffects>({ ...defaultEffects })
  const [advancedEffects, setAdvancedEffects] = useState<AdvancedAudioEffects>({ ...defaultAdvancedEffects })
  const [showBasicEffects, setShowBasicEffects] = useState(false)
  const [showAdvancedEffects, setShowAdvancedEffects] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [audioContextInitialized, setAudioContextInitialized] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const basicNodesRef = useRef<AudioNodes | null>(null)
  const advancedNodesRef = useRef<AdvancedAudioNodes | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const effectsAppliedRef = useRef(false)
  const sourceNodeCreatedRef = useRef(false) // Track if we've already created a source node

  // Initialize or reinitialize audio context and processing graph
  const initAudioContext = async () => {
    // Clean up existing context if any
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        // First disconnect any existing nodes to avoid conflicts
        if (basicNodesRef.current && basicNodesRef.current.outputGain) {
          basicNodesRef.current.outputGain.disconnect();
        }
        
        // Then close the context
        await audioContextRef.current.close();
      } catch (err) {
        console.warn("Error closing previous audio context:", err);
      } finally {
        audioContextRef.current = null;
        basicNodesRef.current = null;
        advancedNodesRef.current = null;
        sourceNodeCreatedRef.current = false; // Reset the source node flag
      }
    }

    if (!audioRef.current) return;

    try {
      // Create new audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Set up basic audio processing graph
      // Use type assertion to work around type incompatibility
      basicNodesRef.current = await setupAudioGraph(
        audioContextRef.current as any,
        audioRef.current,
        basicEffects
      );

      // Set up advanced audio processing graph if any effects are enabled
      const anyAdvancedEffectEnabled = Object.entries(advancedEffects).some(([_, effect]) => (effect as any).enabled);

      if (anyAdvancedEffectEnabled && basicNodesRef.current) {
        // Connect advanced effects after basic effects
        // Use type assertion to work around type incompatibility
        advancedNodesRef.current = await setupAdvancedAudioGraph(
          audioContextRef.current as any,
          basicNodesRef.current.sourceNode as any,
          audioContextRef.current.destination as any,
          advancedEffects,
        );
      }

      // Mark as initialized
      setAudioContextInitialized(true);
      effectsAppliedRef.current = true;
      sourceNodeCreatedRef.current = true; // Mark that we've created a source node

      console.log("Audio context initialized with effects");
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      setAudioContextInitialized(false);
    }
  }

  // Set up audio element and load audio
  useEffect(() => {
    // Create audio element and URL for the blob
    const url = URL.createObjectURL(audio.blob)
    audioUrlRef.current = url

    const audioElement = new Audio(url)
    audioRef.current = audioElement

    // Reset effects when changing audio
    setBasicEffects({ ...defaultEffects })
    setAdvancedEffects({ ...defaultAdvancedEffects })
    setShowBasicEffects(false)
    setShowAdvancedEffects(false)
    effectsAppliedRef.current = false

    // Set initial state
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setAudioContextInitialized(false)

    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata)
    audioElement.addEventListener("timeupdate", handleTimeUpdate)
    audioElement.addEventListener("ended", handleEnded)

    // Set initial volume
    audioElement.volume = volume

    // Clean up on unmount or when audio changes
    return () => {
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audioElement.removeEventListener("timeupdate", handleTimeUpdate)
      audioElement.removeEventListener("ended", handleEnded)
      audioElement.pause()
      audioElement.src = ""

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }

      // Clean up audio context and nodes
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch((err: Error) => console.error("Error closing audio context:", err))
        audioContextRef.current = null
        basicNodesRef.current = null
        advancedNodesRef.current = null
      }

      setIsPlaying(false)
      setCurrentTime(0)
      effectsAppliedRef.current = false
      sourceNodeCreatedRef.current = false // Reset the source node flag
    }
  }, [audio])

  // Update basic effects when they change
  useEffect(() => {
    if (audioContextInitialized && basicNodesRef.current && audioRef.current) {
      updateAudioEffects(audioRef.current, basicNodesRef.current, basicEffects)
      console.log("Updated basic audio effects")
    }
  }, [basicEffects, audioContextInitialized])

  // Update advanced effects when they change
  useEffect(() => {
    if (audioContextInitialized && advancedNodesRef.current) {
      updateAdvancedAudioEffects(advancedNodesRef.current, advancedEffects)
      console.log("Updated advanced audio effects")
    }
  }, [advancedEffects, audioContextInitialized])

  const togglePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        // Initialize audio context if not already done
        if (!audioContextInitialized) {
          // Reset source node flag before initializing
          sourceNodeCreatedRef.current = false
          await initAudioContext()
        }

        // Resume audio context if suspended (autoplay policy)
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume()
        }

        // Play audio
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error toggling playback:", error)
    }
  }

  const handleTimeChange = (value: number[]) => {
    if (!audioRef.current) return

    const newTime = value[0]

    // Validate that the time is a finite number and within valid range
    if (isFinite(newTime) && newTime >= 0 && newTime <= (audioRef.current.duration || 0)) {
      try {
        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
      } catch (error) {
        console.error("Error setting currentTime:", error)
      }
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return

    const newVolume = value[0]
    audioRef.current.volume = newVolume

    // Update output gain if available
    if (basicNodesRef.current && basicNodesRef.current.outputGain) {
      basicNodesRef.current.outputGain.gain.value = newVolume
    }

    setVolume(newVolume)
  }

  const handleBasicEffectsChange = async (newEffects: AudioEffects) => {
    setBasicEffects(newEffects)

    // If effects have changed significantly and we're playing,
    // we might need to reinitialize the audio context for some effects
    const significantChange =
      newEffects.pitch !== basicEffects.pitch || Math.abs(newEffects.speed - basicEffects.speed) > 0.1

    if (isPlaying && significantChange && !effectsAppliedRef.current) {
      // Pause, reinitialize, then play
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime
        audioRef.current.pause()

        // Reset source node flag before reinitializing
        sourceNodeCreatedRef.current = false
        await initAudioContext()

        // Restore position and play
        if (audioRef.current) {
          audioRef.current.currentTime = currentTime
          await audioRef.current.play().catch((err) => console.error("Error resuming playback:", err))
        }
      }
    }
  }

  const handleAdvancedEffectsChange = async (newEffects: AdvancedAudioEffects) => {
    setAdvancedEffects(newEffects)

    // Check if any effect was enabled or disabled
    const wasAnyEffectEnabled = Object.entries(advancedEffects).some(([_, effect]) => (effect as any).enabled)

    const isAnyEffectEnabled = Object.entries(newEffects).some(([_, effect]) => (effect as any).enabled)

    // If the enabled state changed, we need to reinitialize
    if (wasAnyEffectEnabled !== isAnyEffectEnabled) {
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime
        const wasPlaying = !audioRef.current.paused

        if (wasPlaying) {
          audioRef.current.pause()
        }

        // Reset source node flag before reinitializing
        sourceNodeCreatedRef.current = false
        await initAudioContext()

        // Restore position and play state
        if (audioRef.current) {
          audioRef.current.currentTime = currentTime

          if (wasPlaying) {
            await audioRef.current.play().catch((err) => console.error("Error resuming playback:", err))
          }
        }
      }
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) {
      return "0:00"
    }
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={18} />
    if (volume < 0.5) return <Volume1 size={18} />
    return <Volume2 size={18} />
  }

  // Count enabled advanced effects
  const enabledAdvancedEffectsCount = Object.values(advancedEffects).filter((effect) => (effect as any).enabled).length

  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-purple-500 text-white hover:bg-purple-600"
          onClick={togglePlayPause}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </Button>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-purple-800">{audio.name}</p>
          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Slider
          value={[isFinite(currentTime) ? currentTime : 0]}
          min={0}
          max={isFinite(duration) && duration > 0 ? duration : 100}
          step={0.1}
          onValueChange={handleTimeChange}
          className="cursor-pointer"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-purple-700"
              onClick={() => handleVolumeChange([volume === 0 ? 0.5 : 0])}
            >
              {getVolumeIcon()}
            </Button>

            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-24 cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${showBasicEffects ? "bg-purple-200 border-purple-300" : "bg-white hover:bg-gray-100 border-purple-200"} flex items-center gap-1`}
              onClick={() => {
                setShowBasicEffects(!showBasicEffects)
                if (!showBasicEffects) setShowAdvancedEffects(false)
              }}
            >
              Effects
              {showBasicEffects ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${showAdvancedEffects ? "bg-purple-200 border-purple-300" : "bg-white hover:bg-gray-100 border-purple-200"} flex items-center gap-1`}
              onClick={() => {
                setShowAdvancedEffects(!showAdvancedEffects)
                if (!showAdvancedEffects) setShowBasicEffects(false)
              }}
            >
              <Wand2 size={14} className="mr-1" />
              Advanced
              {enabledAdvancedEffectsCount > 0 && (
                <span className="ml-1 bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {enabledAdvancedEffectsCount}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-white hover:bg-gray-100 border-purple-200 flex items-center gap-1"
              onClick={() => setShowDownloadModal(true)}
            >
              <Download size={14} className="mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {showBasicEffects && (
        <div className="mt-4">
          <AudioEffectsPanel effects={basicEffects} onChange={handleBasicEffectsChange} />
        </div>
      )}

      {showAdvancedEffects && (
        <div className="mt-4">
          <AdvancedEffectsPanel effects={advancedEffects} onChange={handleAdvancedEffectsChange} />
        </div>
      )}

      <DownloadAudioModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        audio={audio}
        basicEffects={basicEffects}
        advancedEffects={advancedEffects}
      />
    </div>
  )
}

