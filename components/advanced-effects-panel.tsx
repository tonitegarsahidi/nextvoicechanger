"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import {
  Repeat,
  Zap,
  Users,
  Wind,
  Waves,
  Music,
  NetworkIcon as VoiceNetwork,
  Timer,
  Gauge,
  Sparkles,
  RotateCcw,
} from "lucide-react"
import { type AdvancedAudioEffects, defaultAdvancedEffects } from "@/lib/advanced-audio-effects"

interface AdvancedEffectsPanelProps {
  effects: AdvancedAudioEffects
  onChange: (effects: AdvancedAudioEffects) => void
}

export default function AdvancedEffectsPanel({ effects, onChange }: AdvancedEffectsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("echo")

  const handleReset = () => {
    onChange({ ...defaultAdvancedEffects })
  }

  const updateEffect = <K extends keyof AdvancedAudioEffects, P extends keyof AdvancedAudioEffects[K]>(
    effect: K,
    param: P,
    value: AdvancedAudioEffects[K][P],
  ) => {
    onChange({
      ...effects,
      [effect]: {
        ...effects[effect],
        [param]: value,
      },
    })
  }

  return (
    <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-700">Advanced Effects</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs bg-white hover:bg-gray-100 border-purple-200 flex items-center gap-1"
        >
          <RotateCcw size={12} />
          Reset All
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4 rounded-xl bg-white h-auto p-1">
          <TabsTrigger
            value="echo"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <Repeat className="w-4 h-4" />
            <span className="text-[10px]">Echo</span>
          </TabsTrigger>
          <TabsTrigger
            value="distortion"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <Zap className="w-4 h-4" />
            <span className="text-[10px]">Distort</span>
          </TabsTrigger>
          <TabsTrigger
            value="chorus"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px]">Chorus</span>
          </TabsTrigger>
          <TabsTrigger
            value="flanger"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <Wind className="w-4 h-4" />
            <span className="text-[10px]">Flanger</span>
          </TabsTrigger>
          <TabsTrigger
            value="phaser"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <Waves className="w-4 h-4" />
            <span className="text-[10px]">Phaser</span>
          </TabsTrigger>
        </TabsList>

        <TabsList className="grid grid-cols-5 mb-4 rounded-xl bg-white h-auto p-1">
          <TabsTrigger
            value="autotune"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <Music className="w-4 h-4" />
            <span className="text-[10px]">AutoTune</span>
          </TabsTrigger>
          <TabsTrigger
            value="formant"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <VoiceNetwork className="w-4 h-4" />
            <span className="text-[10px]">Formant</span>
          </TabsTrigger>
          <TabsTrigger
            value="timestretch"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <Timer className="w-4 h-4" />
            <span className="text-[10px]">Time</span>
          </TabsTrigger>
          <TabsTrigger
            value="compression"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <Gauge className="w-4 h-4" />
            <span className="text-[10px]">Compress</span>
          </TabsTrigger>
          <TabsTrigger
            value="granular"
            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white py-1 px-2 h-auto flex flex-col items-center gap-1"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px]">Granular</span>
          </TabsTrigger>
        </TabsList>

        {/* Echo Effect */}
        <TabsContent value="echo" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="echo-enabled" className="font-medium">
              Echo Effect
            </Label>
            <Switch
              id="echo-enabled"
              checked={effects.echo.enabled}
              onCheckedChange={(checked) => updateEffect("echo", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Delay Time</Label>
                <span className="text-xs text-gray-500">{effects.echo.delayTime.toFixed(2)}s</span>
              </div>
              <Slider
                disabled={!effects.echo.enabled}
                value={[effects.echo.delayTime]}
                min={0.1}
                max={1.0}
                step={0.01}
                onValueChange={(value) => updateEffect("echo", "delayTime", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Feedback</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.echo.feedback * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.echo.enabled}
                value={[effects.echo.feedback]}
                min={0}
                max={0.9}
                step={0.01}
                onValueChange={(value) => updateEffect("echo", "feedback", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Mix</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.echo.mix * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.echo.enabled}
                value={[effects.echo.mix]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => updateEffect("echo", "mix", value[0])}
              />
            </div>
          </div>
        </TabsContent>

        {/* Distortion Effect */}
        <TabsContent value="distortion" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="distortion-enabled" className="font-medium">
              Distortion Effect
            </Label>
            <Switch
              id="distortion-enabled"
              checked={effects.distortion.enabled}
              onCheckedChange={(checked) => updateEffect("distortion", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Amount</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.distortion.amount)}</span>
              </div>
              <Slider
                disabled={!effects.distortion.enabled}
                value={[effects.distortion.amount]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => updateEffect("distortion", "amount", value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Oversample</Label>
              <RadioGroup
                disabled={!effects.distortion.enabled}
                value={effects.distortion.oversample}
                onValueChange={(value) => updateEffect("distortion", "oversample", value as "2x" | "4x" | "none")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="cursor-pointer">
                    None
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2x" id="2x" />
                  <Label htmlFor="2x" className="cursor-pointer">
                    2x
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4x" id="4x" />
                  <Label htmlFor="4x" className="cursor-pointer">
                    4x
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </TabsContent>

        {/* Chorus Effect */}
        <TabsContent value="chorus" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="chorus-enabled" className="font-medium">
              Chorus Effect
            </Label>
            <Switch
              id="chorus-enabled"
              checked={effects.chorus.enabled}
              onCheckedChange={(checked) => updateEffect("chorus", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Rate</Label>
                <span className="text-xs text-gray-500">{effects.chorus.rate.toFixed(1)} Hz</span>
              </div>
              <Slider
                disabled={!effects.chorus.enabled}
                value={[effects.chorus.rate]}
                min={0.1}
                max={8}
                step={0.1}
                onValueChange={(value) => updateEffect("chorus", "rate", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Depth</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.chorus.depth * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.chorus.enabled}
                value={[effects.chorus.depth]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => updateEffect("chorus", "depth", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Mix</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.chorus.mix * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.chorus.enabled}
                value={[effects.chorus.mix]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => updateEffect("chorus", "mix", value[0])}
              />
            </div>
          </div>
        </TabsContent>

        {/* Flanger Effect */}
        <TabsContent value="flanger" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="flanger-enabled" className="font-medium">
              Flanger Effect
            </Label>
            <Switch
              id="flanger-enabled"
              checked={effects.flanger.enabled}
              onCheckedChange={(checked) => updateEffect("flanger", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Delay</Label>
                <span className="text-xs text-gray-500">{effects.flanger.delay.toFixed(3)}s</span>
              </div>
              <Slider
                disabled={!effects.flanger.enabled}
                value={[effects.flanger.delay]}
                min={0.001}
                max={0.02}
                step={0.001}
                onValueChange={(value) => updateEffect("flanger", "delay", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Depth</Label>
                <span className="text-xs text-gray-500">{effects.flanger.depth.toFixed(3)}s</span>
              </div>
              <Slider
                disabled={!effects.flanger.enabled}
                value={[effects.flanger.depth]}
                min={0.001}
                max={0.01}
                step={0.001}
                onValueChange={(value) => updateEffect("flanger", "depth", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Rate</Label>
                <span className="text-xs text-gray-500">{effects.flanger.rate.toFixed(1)} Hz</span>
              </div>
              <Slider
                disabled={!effects.flanger.enabled}
                value={[effects.flanger.rate]}
                min={0.1}
                max={5}
                step={0.1}
                onValueChange={(value) => updateEffect("flanger", "rate", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Feedback</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.flanger.feedback * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.flanger.enabled}
                value={[effects.flanger.feedback]}
                min={0}
                max={0.9}
                step={0.01}
                onValueChange={(value) => updateEffect("flanger", "feedback", value[0])}
              />
            </div>
          </div>
        </TabsContent>

        {/* Phaser Effect */}
        <TabsContent value="phaser" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="phaser-enabled" className="font-medium">
              Phaser Effect
            </Label>
            <Switch
              id="phaser-enabled"
              checked={effects.phaser.enabled}
              onCheckedChange={(checked) => updateEffect("phaser", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Rate</Label>
                <span className="text-xs text-gray-500">{effects.phaser.rate.toFixed(1)} Hz</span>
              </div>
              <Slider
                disabled={!effects.phaser.enabled}
                value={[effects.phaser.rate]}
                min={0.1}
                max={8}
                step={0.1}
                onValueChange={(value) => updateEffect("phaser", "rate", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Depth</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.phaser.depth * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.phaser.enabled}
                value={[effects.phaser.depth]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => updateEffect("phaser", "depth", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Feedback</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.phaser.feedback * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.phaser.enabled}
                value={[effects.phaser.feedback]}
                min={0}
                max={0.9}
                step={0.01}
                onValueChange={(value) => updateEffect("phaser", "feedback", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Stages</Label>
                <span className="text-xs text-gray-500">{effects.phaser.stages}</span>
              </div>
              <Slider
                disabled={!effects.phaser.enabled}
                value={[effects.phaser.stages]}
                min={2}
                max={12}
                step={2}
                onValueChange={(value) => updateEffect("phaser", "stages", value[0])}
              />
            </div>
          </div>
        </TabsContent>

        {/* Auto-Tune Effect */}
        <TabsContent value="autotune" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autotune-enabled" className="font-medium">
              Auto-Tune Effect
            </Label>
            <Switch
              id="autotune-enabled"
              checked={effects.autoTune.enabled}
              onCheckedChange={(checked) => updateEffect("autoTune", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Scale</Label>
              <RadioGroup
                disabled={!effects.autoTune.enabled}
                value={effects.autoTune.scale}
                onValueChange={(value) => updateEffect("autoTune", "scale", value as "major" | "minor" | "chromatic")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="major" id="major" />
                  <Label htmlFor="major" className="cursor-pointer">
                    Major
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minor" id="minor" />
                  <Label htmlFor="minor" className="cursor-pointer">
                    Minor
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="chromatic" id="chromatic" />
                  <Label htmlFor="chromatic" className="cursor-pointer">
                    Chromatic
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Amount</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.autoTune.amount * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.autoTune.enabled}
                value={[effects.autoTune.amount]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => updateEffect("autoTune", "amount", value[0])}
              />
            </div>
          </div>
        </TabsContent>

        {/* Formant Shift Effect */}
        <TabsContent value="formant" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="formant-enabled" className="font-medium">
              Formant Shift Effect
            </Label>
            <Switch
              id="formant-enabled"
              checked={effects.formantShift.enabled}
              onCheckedChange={(checked) => updateEffect("formantShift", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Shift</Label>
                <span className="text-xs text-gray-500">
                  {effects.formantShift.shift > 0 ? "+" : ""}
                  {effects.formantShift.shift.toFixed(1)}
                </span>
              </div>
              <Slider
                disabled={!effects.formantShift.enabled}
                value={[effects.formantShift.shift]}
                min={-2}
                max={2}
                step={0.1}
                onValueChange={(value) => updateEffect("formantShift", "shift", value[0])}
              />
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>Deeper</span>
                <span>Normal</span>
                <span>Higher</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Time Stretch Effect */}
        <TabsContent value="timestretch" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="timestretch-enabled" className="font-medium">
              Time Stretch Effect
            </Label>
            <Switch
              id="timestretch-enabled"
              checked={effects.timeStretch.enabled}
              onCheckedChange={(checked) => updateEffect("timeStretch", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Rate</Label>
                <span className="text-xs text-gray-500">{effects.timeStretch.rate.toFixed(1)}x</span>
              </div>
              <Slider
                disabled={!effects.timeStretch.enabled}
                value={[effects.timeStretch.rate]}
                min={0.5}
                max={2.0}
                step={0.1}
                onValueChange={(value) => updateEffect("timeStretch", "rate", value[0])}
              />
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>Slower</span>
                <span>Normal</span>
                <span>Faster</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Compression Effect */}
        <TabsContent value="compression" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="compression-enabled" className="font-medium">
              Compression Effect
            </Label>
            <Switch
              id="compression-enabled"
              checked={effects.compression.enabled}
              onCheckedChange={(checked) => updateEffect("compression", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Threshold</Label>
                <span className="text-xs text-gray-500">{effects.compression.threshold} dB</span>
              </div>
              <Slider
                disabled={!effects.compression.enabled}
                value={[effects.compression.threshold]}
                min={-60}
                max={0}
                step={1}
                onValueChange={(value) => updateEffect("compression", "threshold", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Ratio</Label>
                <span className="text-xs text-gray-500">{effects.compression.ratio}:1</span>
              </div>
              <Slider
                disabled={!effects.compression.enabled}
                value={[effects.compression.ratio]}
                min={1}
                max={20}
                step={0.5}
                onValueChange={(value) => updateEffect("compression", "ratio", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Attack</Label>
                <span className="text-xs text-gray-500">{effects.compression.attack.toFixed(3)}s</span>
              </div>
              <Slider
                disabled={!effects.compression.enabled}
                value={[effects.compression.attack]}
                min={0}
                max={1}
                step={0.001}
                onValueChange={(value) => updateEffect("compression", "attack", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Release</Label>
                <span className="text-xs text-gray-500">{effects.compression.release.toFixed(2)}s</span>
              </div>
              <Slider
                disabled={!effects.compression.enabled}
                value={[effects.compression.release]}
                min={0.01}
                max={1}
                step={0.01}
                onValueChange={(value) => updateEffect("compression", "release", value[0])}
              />
            </div>
          </div>
        </TabsContent>

        {/* Granular Synthesis Effect */}
        <TabsContent value="granular" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="granular-enabled" className="font-medium">
              Granular Synthesis Effect
            </Label>
            <Switch
              id="granular-enabled"
              checked={effects.granular.enabled}
              onCheckedChange={(checked) => updateEffect("granular", "enabled", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Grain Size</Label>
                <span className="text-xs text-gray-500">{effects.granular.grainSize.toFixed(2)}s</span>
              </div>
              <Slider
                disabled={!effects.granular.enabled}
                value={[effects.granular.grainSize]}
                min={0.01}
                max={0.5}
                step={0.01}
                onValueChange={(value) => updateEffect("granular", "grainSize", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Scatter</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.granular.scatter * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.granular.enabled}
                value={[effects.granular.scatter]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => updateEffect("granular", "scatter", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Density</Label>
                <span className="text-xs text-gray-500">{Math.round(effects.granular.density * 100)}%</span>
              </div>
              <Slider
                disabled={!effects.granular.enabled}
                value={[effects.granular.density]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => updateEffect("granular", "density", value[0])}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

