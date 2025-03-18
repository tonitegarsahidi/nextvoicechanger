"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type AudioEffects, defaultEffects, applyCharacterPreset } from "@/lib/audio-effects"
import { Music, Wand2, Volume, FastForward, Waves } from "lucide-react"

interface AudioEffectsPanelProps {
  effects: AudioEffects
  onChange: (effects: AudioEffects) => void
}

export default function AudioEffectsPanel({ effects, onChange }: AudioEffectsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("characters")

  const handleCharacterChange = (character: "normal" | "chipmunk" | "robot" | "deep") => {
    const newEffects = applyCharacterPreset(effects, character)
    onChange(newEffects)
  }

  const handleReset = () => {
    onChange({ ...defaultEffects })
  }

  return (
    <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-700">Sound Effects</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs bg-white hover:bg-gray-100 border-purple-200"
        >
          Reset All
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 rounded-full bg-white">
          <TabsTrigger
            value="characters"
            className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Characters
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
          >
            <Music className="w-4 h-4 mr-2" />
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 ${
                effects.character === "normal" ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-blue-50"
              }`}
              onClick={() => handleCharacterChange("normal")}
            >
              <span className="text-lg">🎙️</span>
              <span className="text-xs">Normal</span>
            </Button>

            <Button
              variant="outline"
              className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 ${
                effects.character === "chipmunk" ? "bg-pink-100 border-pink-300" : "bg-white hover:bg-pink-50"
              }`}
              onClick={() => handleCharacterChange("chipmunk")}
            >
              <span className="text-lg">🐿️</span>
              <span className="text-xs">Chipmunk</span>
            </Button>

            <Button
              variant="outline"
              className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 ${
                effects.character === "robot" ? "bg-gray-100 border-gray-300" : "bg-white hover:bg-gray-50"
              }`}
              onClick={() => handleCharacterChange("robot")}
            >
              <span className="text-lg">🤖</span>
              <span className="text-xs">Robot</span>
            </Button>

            <Button
              variant="outline"
              className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 ${
                effects.character === "deep" ? "bg-purple-100 border-purple-300" : "bg-white hover:bg-purple-50"
              }`}
              onClick={() => handleCharacterChange("deep")}
            >
              <span className="text-lg">🐻</span>
              <span className="text-xs">Deep Voice</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Music className="w-4 h-4" />
                  Pitch
                </label>
                <span className="text-xs text-gray-500">
                  {effects.pitch > 0 ? "+" : ""}
                  {effects.pitch}
                </span>
              </div>
              <Slider
                value={[effects.pitch]}
                min={-12}
                max={12}
                step={1}
                onValueChange={(value) => onChange({ ...effects, pitch: value[0], character: "normal" })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Volume className="w-4 h-4" />
                  Bass
                </label>
                <span className="text-xs text-gray-500">
                  {effects.bass > 0 ? "+" : ""}
                  {effects.bass}
                </span>
              </div>
              <Slider
                value={[effects.bass]}
                min={-10}
                max={10}
                step={1}
                onValueChange={(value) => onChange({ ...effects, bass: value[0], character: "normal" })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Volume className="w-4 h-4" />
                  Treble
                </label>
                <span className="text-xs text-gray-500">
                  {effects.treble > 0 ? "+" : ""}
                  {effects.treble}
                </span>
              </div>
              <Slider
                value={[effects.treble]}
                min={-10}
                max={10}
                step={1}
                onValueChange={(value) => onChange({ ...effects, treble: value[0], character: "normal" })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Waves className="w-4 h-4" />
                  Reverb
                </label>
                <span className="text-xs text-gray-500">{Math.round(effects.reverb * 100)}%</span>
              </div>
              <Slider
                value={[effects.reverb]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => onChange({ ...effects, reverb: value[0], character: "normal" })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <FastForward className="w-4 h-4" />
                  Speed
                </label>
                <span className="text-xs text-gray-500">{effects.speed.toFixed(1)}x</span>
              </div>
              <Slider
                value={[effects.speed]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(value) => onChange({ ...effects, speed: value[0], character: "normal" })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

