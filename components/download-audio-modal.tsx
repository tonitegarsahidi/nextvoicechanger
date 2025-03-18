"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Download, Loader2 } from "lucide-react"
import type { AudioEffects } from "@/lib/audio-effects"
import type { AdvancedAudioEffects } from "@/lib/advanced-audio-effects"
import { processAudioWithEffects } from "@/lib/audio-processor"

interface DownloadAudioModalProps {
  isOpen: boolean
  onClose: () => void
  audio: { id: number; name: string; blob: Blob } | null
  basicEffects: AudioEffects
  advancedEffects: AdvancedAudioEffects
}

export default function DownloadAudioModal({
  isOpen,
  onClose,
  audio,
  basicEffects,
  advancedEffects,
}: DownloadAudioModalProps) {
  const [format, setFormat] = useState<"mp3" | "wav">("mp3")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!audio) return

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Process audio with effects
      const processedBlob = await processAudioWithEffects(
        audio.blob,
        basicEffects,
        advancedEffects,
        format,
        (progress) => setProgress(progress * 100),
      )

      // Create download link
      const url = URL.createObjectURL(processedBlob)
      const a = document.createElement("a")

      // Set filename with effect indicator
      let filename = audio.name

      // Remove extension if present
      if (filename.includes(".")) {
        filename = filename.substring(0, filename.lastIndexOf("."))
      }

      // Add effect indicator
      const hasBasicEffects =
        basicEffects.character !== "normal" ||
        basicEffects.pitch !== 0 ||
        basicEffects.bass !== 0 ||
        basicEffects.treble !== 0

      const hasAdvancedEffects = Object.values(advancedEffects).some((effect) => (effect as any).enabled)

      if (hasBasicEffects || hasAdvancedEffects) {
        filename += "_effects"
      }

      a.href = url
      a.download = `${filename}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Close modal after successful download
      setTimeout(() => {
        onClose()
        setIsProcessing(false)
      }, 1000)
    } catch (err) {
      console.error("Error processing audio:", err)
      setError("There was an error processing your audio. Please try again.")
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-purple-600">Download Audio</DialogTitle>
          <DialogDescription>Download your audio with all applied effects.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Choose format:</h3>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as "mp3" | "wav")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mp3" id="mp3" />
                <Label htmlFor="mp3" className="cursor-pointer">
                  MP3
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wav" id="wav" />
                <Label htmlFor="wav" className="cursor-pointer">
                  WAV
                </Label>
              </div>
            </RadioGroup>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing audio...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isProcessing || !audio}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

