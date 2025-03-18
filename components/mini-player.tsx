"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

interface MiniPlayerProps {
  audio: { id: number; name: string; blob: Blob }
  onPlayStateChange?: (isPlaying: boolean) => void
}

export default function MiniPlayer({ audio, onPlayStateChange }: MiniPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrl = useRef<string | null>(null)

  useEffect(() => {
    // Create audio element and URL for the blob
    const url = URL.createObjectURL(audio.blob)
    audioUrl.current = url

    const audioElement = new Audio(url)
    audioRef.current = audioElement

    // Set up event listeners
    const handleEnded = () => {
      setIsPlaying(false)
      if (onPlayStateChange) onPlayStateChange(false)
    }

    audioElement.addEventListener("ended", handleEnded)

    // Clean up on unmount or when audio changes
    return () => {
      audioElement.removeEventListener("ended", handleEnded)
      audioElement.pause()
      audioElement.src = ""
      if (audioUrl.current) {
        URL.revokeObjectURL(audioUrl.current)
      }
      setIsPlaying(false)
    }
  }, [audio, onPlayStateChange])

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering parent click events

    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      // Stop any other playing audio first
      document.querySelectorAll("audio").forEach((audio) => {
        audio.pause()
      })

      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error)
      })
    }

    setIsPlaying(!isPlaying)
    if (onPlayStateChange) onPlayStateChange(!isPlaying)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-10 w-10 rounded-full ${
        isPlaying
          ? "bg-purple-500 text-white hover:bg-purple-600"
          : "bg-purple-200 text-purple-700 hover:bg-purple-300 hover:text-purple-800"
      } flex-shrink-0`}
      onClick={togglePlayPause}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
    </Button>
  )
}

