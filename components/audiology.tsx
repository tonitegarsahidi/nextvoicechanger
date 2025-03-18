"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Upload, StopCircle } from "lucide-react"
import { initDB, saveAudio, getAllAudios, deleteAudio } from "@/lib/db"
import AudioList from "@/components/audio-list"
import { useToast } from "@/hooks/use-toast"

export default function Audiology() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioList, setAudioList] = useState<Array<{ id: number; name: string; blob: Blob }>>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("record")

  useEffect(() => {
    // Initialize database and load saved audios
    const setup = async () => {
      await initDB()
      loadAudios()
    }
    setup()

    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const loadAudios = async () => {
    const audios = await getAllAudios()
    setAudioList(audios)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        const timestamp = new Date().toISOString()
        const audioName = `Recording_${timestamp}`

        await saveAudio(audioName, audioBlob)
        loadAudios()

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop())

        setIsRecording(false)
        setRecordingTime(0)

        // Switch to the library tab
        setActiveTab("library")

        toast({
          title: "Recording saved!",
          description: "Your audio has been saved successfully.",
        })
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach(async (file) => {
      try {
        const audioBlob = file.slice(0, file.size, file.type)
        await saveAudio(file.name, audioBlob)
        loadAudios()

        toast({
          title: "Audio uploaded!",
          description: `${file.name} has been added to your collection.`,
        })
      } catch (error) {
        console.error("Error uploading audio:", error)
        toast({
          title: "Upload Error",
          description: "There was a problem uploading your audio file.",
          variant: "destructive",
        })
      }
    })

    // Reset the input
    event.target.value = ""
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAudio(id)
      loadAudios()

      toast({
        title: "Audio deleted",
        description: "The audio has been removed from your collection.",
      })
    } catch (error) {
      console.error("Error deleting audio:", error)
      toast({
        title: "Delete Error",
        description: "There was a problem deleting your audio file.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = (audio: { id: number; name: string; blob: Blob }) => {
    const url = URL.createObjectURL(audio.blob)
    const a = document.createElement("a")
    a.href = url
    a.download = audio.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: `${audio.name} is being downloaded.`,
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-purple-600 mb-2">Audiology</h1>
        <p className="text-blue-500">Record, upload, and play your favorite sounds!</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 rounded-full bg-blue-100">
          <TabsTrigger
            value="record"
            className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
          >
            Record
          </TabsTrigger>
          <TabsTrigger
            value="library"
            className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
          >
            My Sounds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="mt-4">
          <Card className="border-4 border-yellow-300 rounded-3xl shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="w-40 h-40 rounded-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center shadow-lg">
                  {isRecording ? (
                    <div className="animate-pulse">
                      <StopCircle size={80} className="text-red-500 cursor-pointer" onClick={stopRecording} />
                    </div>
                  ) : (
                    <Mic size={80} className="text-purple-600 cursor-pointer" onClick={startRecording} />
                  )}
                </div>

                {isRecording ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500 animate-pulse">Recording...</div>
                    <div className="text-xl font-mono mt-2">{formatTime(recordingTime)}</div>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="mt-4 rounded-full px-8 font-bold text-lg"
                      onClick={stopRecording}
                    >
                      Stop Recording
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      variant="default"
                      size="lg"
                      className="bg-purple-500 hover:bg-purple-600 rounded-full px-8 font-bold text-lg"
                      onClick={startRecording}
                    >
                      Start Recording
                    </Button>

                    <div className="mt-6 text-center">
                      <p className="mb-2 text-gray-600">Or upload audio files:</p>
                      <label htmlFor="audio-upload" className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 px-6 rounded-full transition-colors">
                          <Upload size={20} />
                          <span>Upload Audio</span>
                        </div>
                        <input
                          id="audio-upload"
                          type="file"
                          accept="audio/*"
                          multiple
                          className="hidden"
                          onChange={handleUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          <Card className="border-4 border-yellow-300 rounded-3xl shadow-lg bg-white">
            <CardContent className="p-6">
              {audioList.length > 0 ? (
                <AudioList audioList={audioList} onDelete={handleDelete} onDownload={handleDownload} />
              ) : (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">🎵</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No sounds yet</h3>
                  <p className="text-gray-500 mb-4">Record or upload some audio to see it here!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

