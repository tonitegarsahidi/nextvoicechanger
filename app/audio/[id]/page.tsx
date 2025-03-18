"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import { getAudioById } from "@/lib/db"
import AudioPlayer from "@/components/audio-player"

export default function AudioDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [audio, setAudio] = useState<{ id: number; name: string; blob: Blob } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setLoading(true)
        const id = Number.parseInt(params.id)
        if (isNaN(id)) {
          setError("Invalid audio ID")
          return
        }

        const audioData = await getAudioById(id)
        if (!audioData) {
          setError("Audio not found")
          return
        }

        setAudio(audioData)
      } catch (err) {
        console.error("Error fetching audio:", err)
        setError("Failed to load audio")
      } finally {
        setLoading(false)
      }
    }

    fetchAudio()
  }, [params.id])

  return (
    <div className="container mx-auto px-4 py-8 max-w-md min-h-screen bg-gradient-to-b from-yellow-50 to-blue-50">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center text-purple-600 hover:text-purple-800 hover:bg-purple-100 -ml-2"
          onClick={() => router.back()}
        >
          <ChevronLeft className="mr-1" size={20} />
          Back to My Sounds
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-purple-600 mb-2">Audiology</h1>
        <p className="text-blue-500">Now Playing</p>
      </div>

      {loading ? (
        <Card className="border-4 border-yellow-300 rounded-3xl shadow-lg bg-white">
          <CardContent className="p-6 flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-16 w-16 bg-purple-200 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-purple-100 rounded mb-2"></div>
              <div className="h-3 w-24 bg-blue-100 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-4 border-yellow-300 rounded-3xl shadow-lg bg-white">
          <CardContent className="p-6 text-center">
            <div className="text-5xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Oops!</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => router.push("/")} className="bg-purple-500 hover:bg-purple-600">
              Go Home
            </Button>
          </CardContent>
        </Card>
      ) : audio ? (
        <div className="space-y-6">
          <Card className="border-4 border-yellow-300 rounded-3xl shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center shadow-lg mb-6">
                  <div className="text-5xl">🎵</div>
                </div>
                <h2 className="text-xl font-bold text-purple-700 text-center mb-2">{audio.name}</h2>
              </div>
            </CardContent>
          </Card>

          <AudioPlayer audio={audio} />
        </div>
      ) : null}
    </div>
  )
}

