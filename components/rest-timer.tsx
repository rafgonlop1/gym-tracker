'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Clock, X } from 'lucide-react'
import { useTimer } from '@/hooks/use-timer'
import { Button } from './button'

interface TimerPreset {
  name: string
  seconds: number
}

const DEFAULT_PRESETS: TimerPreset[] = [
  { name: '30s', seconds: 30 },
  { name: '45s', seconds: 45 },
  { name: '1min', seconds: 60 },
  { name: '90s', seconds: 90 },
  { name: '2min', seconds: 120 },
  { name: '3min', seconds: 180 },
]

const STORAGE_KEY = 'gym-tracker-timer-settings'

interface TimerSettings {
  defaultTime: number
  soundEnabled: boolean
  customPresets: TimerPreset[]
}

export function RestTimer() {
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<TimerSettings>({
    defaultTime: 60,
    soundEnabled: true,
    customPresets: [],
  })
  const [customTime, setCustomTime] = useState('')

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load timer settings')
      }
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const playSound = () => {
    if (settings.soundEnabled) {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }
  }

  const timer = useTimer({
    initialTime: settings.defaultTime,
    onComplete: () => {
      playSound()
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
    },
  })

  const allPresets = [...DEFAULT_PRESETS, ...settings.customPresets]

  const handleAddCustomPreset = () => {
    const minutes = parseInt(customTime.split(':')[0] || '0')
    const seconds = parseInt(customTime.split(':')[1] || '0')
    const totalSeconds = minutes * 60 + seconds
    
    if (totalSeconds > 0 && totalSeconds <= 600) { // Max 10 minutes
      const newPreset: TimerPreset = {
        name: customTime,
        seconds: totalSeconds,
      }
      setSettings(prev => ({
        ...prev,
        customPresets: [...prev.customPresets, newPreset],
      }))
      setCustomTime('')
    }
  }

  const handleRemoveCustomPreset = (index: number) => {
    setSettings(prev => ({
      ...prev,
      customPresets: prev.customPresets.filter((_, i) => i !== index),
    }))
  }

  const getProgressPercentage = () => {
    return ((settings.defaultTime - timer.seconds) / settings.defaultTime) * 100
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold">Rest Timer</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {!showSettings ? (
        <>
          {/* Timer Display */}
          <div className="relative mb-6">
            <div className="text-5xl font-mono font-bold text-center mb-2">
              {timer.formattedTime}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-linear"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={timer.stop}
              disabled={!timer.isRunning && !timer.isPaused}
              leftIcon={<RotateCcw className="w-5 h-5" />}
            >
              Reset
            </Button>
            
            <Button
              variant="primary"
              size="lg"
              onClick={timer.toggle}
              leftIcon={timer.isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            >
              {timer.isRunning ? 'Pause' : timer.isPaused ? 'Resume' : 'Start'}
            </Button>
          </div>

          {/* Preset Times */}
          <div className="grid grid-cols-3 gap-2">
            {allPresets.map((preset, index) => (
              <button
                key={`${preset.name}-${index}`}
                onClick={() => {
                  timer.setTime(preset.seconds)
                  setSettings(prev => ({ ...prev, defaultTime: preset.seconds }))
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.defaultTime === preset.seconds
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Settings Panel */
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm">Sound notifications</span>
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-gray-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </label>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Custom Presets</h4>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="mm:ss"
                pattern="[0-9]{1,2}:[0-9]{2}"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                variant="secondary"
                onClick={handleAddCustomPreset}
                disabled={!customTime || !customTime.match(/^\d{1,2}:\d{2}$/)}
              >
                Add
              </Button>
            </div>
            
            {settings.customPresets.length > 0 && (
              <div className="space-y-1">
                {settings.customPresets.map((preset, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                    <span className="text-sm">{preset.name}</span>
                    <button
                      onClick={() => handleRemoveCustomPreset(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(false)}
            className="w-full"
          >
            Done
          </Button>
        </div>
      )}
    </div>
  )
}