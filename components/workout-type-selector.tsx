'use client'

import { WorkoutType } from '@prisma/client'
import { Activity, Dumbbell, Heart, Zap } from 'lucide-react'

interface WorkoutTypeSelectorProps {
  onSelect: (type: WorkoutType) => void
  selected?: WorkoutType
}

const workoutTypes = [
  { type: WorkoutType.PULL, label: 'Pull', icon: Dumbbell, color: 'from-green-500 to-green-600', emoji: '🏋️' },
  { type: WorkoutType.PUSH, label: 'Push', icon: Dumbbell, color: 'from-blue-500 to-blue-600', emoji: '💪' },
  { type: WorkoutType.LEGS, label: 'Legs', icon: Dumbbell, color: 'from-red-500 to-red-600', emoji: '🦵' },
  { type: WorkoutType.CARDIO_Z2, label: 'Cardio Z2', icon: Heart, color: 'from-yellow-500 to-yellow-600', emoji: '🏃' },
  { type: WorkoutType.PLYOMETRICS, label: 'Plyometrics', icon: Zap, color: 'from-purple-500 to-purple-600', emoji: '🦘' },
  { type: WorkoutType.HIIT, label: 'HIIT', icon: Activity, color: 'from-orange-500 to-orange-600', emoji: '⚡' },
]

export function WorkoutTypeSelector({ onSelect, selected }: WorkoutTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {workoutTypes.map(({ type, label, icon: Icon, color, emoji }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
            selected === type
              ? `bg-gradient-to-br ${color} text-white shadow-lg`
              : 'bg-gray-900 border border-gray-700 hover:bg-gray-800'
          }`}
        >
          <p className="text-3xl mb-2">{emoji}</p>
          <p className="font-medium">{label}</p>
        </button>
      ))}
    </div>
  )
}