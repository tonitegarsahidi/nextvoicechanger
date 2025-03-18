"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Download } from "lucide-react"
import MiniPlayer from "./mini-player"

interface AudioListProps {
  audioList: Array<{ id: number; name: string; blob: Blob }>
  onDelete: (id: number) => void
  onDownload: (audio: { id: number; name: string; blob: Blob }) => void
}

export default function AudioList({ audioList, onDelete, onDownload }: AudioListProps) {
  const router = useRouter()
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null)

  const handleAudioClick = (id: number) => {
    router.push(`/audio/${id}`)
  }

  const handlePlayStateChange = (id: number, isPlaying: boolean) => {
    setCurrentlyPlaying(isPlaying ? id : null)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-purple-600 mb-2">My Sounds ({audioList.length})</h3>

      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
        {audioList.map((audio) => (
          <div
            key={audio.id}
            className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
              currentlyPlaying === audio.id
                ? "bg-purple-100 border-2 border-purple-300"
                : "bg-blue-50 hover:bg-blue-100 border-2 border-transparent"
            }`}
            onClick={() => handleAudioClick(audio.id)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <MiniPlayer audio={audio} onPlayStateChange={(isPlaying) => handlePlayStateChange(audio.id, isPlaying)} />

              <div className="truncate">
                <p className="font-medium truncate">{audio.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload(audio)
                }}
              >
                <Download size={18} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(audio.id)
                }}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

