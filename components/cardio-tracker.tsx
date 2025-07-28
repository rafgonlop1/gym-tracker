'use client'

import { useState } from 'react'
import { logCardio } from '@/app/actions/workout'
import { WorkoutType, CardioMode } from '@prisma/client'
import { Timer, Route, TrendingUp, Activity, Heart, Save } from 'lucide-react'

interface CardioTrackerProps {
  type: WorkoutType
  existingSession?: {
    durationMinutes: number
    distanceKm?: number | null
    incline?: number | null
    mode?: CardioMode | null
    avgHeartRate?: number | null
    notes?: string | null
  }
  onUpdate: () => void
}

export function CardioTracker({ type, existingSession, onUpdate }: CardioTrackerProps) {
  const [duration, setDuration] = useState(existingSession?.durationMinutes?.toString() || '')
  const [distance, setDistance] = useState(existingSession?.distanceKm?.toString() || '')
  const [incline, setIncline] = useState(existingSession?.incline?.toString() || '')
  const [mode, setMode] = useState<CardioMode>(existingSession?.mode || CardioMode.TREADMILL)
  const [avgHeartRate, setAvgHeartRate] = useState(existingSession?.avgHeartRate?.toString() || '')
  const [notes, setNotes] = useState(existingSession?.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSave = async () => {
    if (!duration) return
    
    setIsSaving(true)
    await logCardio(
      new Date(),
      type,
      parseInt(duration),
      distance ? parseFloat(distance) : undefined,
      incline ? parseFloat(incline) : undefined,
      mode,
      avgHeartRate ? parseInt(avgHeartRate) : undefined,
      notes || undefined
    )
    setIsSaving(false)
    onUpdate()
  }
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-400" />
        Log Cardio Session
      </h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
              <Timer className="w-4 h-4 text-blue-400" />
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as CardioMode)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value={CardioMode.TREADMILL}>Treadmill</option>
              <option value={CardioMode.BIKE}>Bike</option>
              <option value={CardioMode.ELLIPTICAL}>Elliptical</option>
              <option value={CardioMode.ROWING}>Rowing</option>
              <option value={CardioMode.OTHER}>Other</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
              <Route className="w-4 h-4 text-green-400" />
              Distance (km)
            </label>
            <input
              type="number"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="5.0"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Incline (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={incline}
              onChange={(e) => setIncline(e.target.value)}
              placeholder="1.0"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            />
          </div>
        </div>
        
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
            <Activity className="w-4 h-4 text-red-400" />
            Average Heart Rate (bpm)
          </label>
          <input
            type="number"
            value={avgHeartRate}
            onChange={(e) => setAvgHeartRate(e.target.value)}
            placeholder="150"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any observations..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            rows={3}
          />
        </div>
        
        <button
          onClick={handleSave}
          disabled={!duration || isSaving}
          className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : existingSession ? 'Update Session' : 'Save Session'}
        </button>
      </div>
    </div>
  )
}