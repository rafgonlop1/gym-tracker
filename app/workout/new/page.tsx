'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { WorkoutType } from '@prisma/client'
import { createWorkout } from '@/app/actions/workout'
import { format } from 'date-fns'
import { Calendar, ArrowLeft, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { WorkoutTypeSelector } from '@/components/workout-type-selector'

export default function NewWorkoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dateParam = searchParams.get('date')
  
  const [date, setDate] = useState(() => 
    dateParam ? new Date(dateParam) : new Date()
  )
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleCreate = async () => {
    if (!selectedType) return
    
    setIsCreating(true)
    // Pass the local date - it will be converted to UTC noon in the server action
    const workout = await createWorkout(selectedType, date)
    router.push(`/workout/${workout.id}/edit`)
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/calendar"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Create New Workout</h1>
                <p className="text-sm text-gray-400">Choose date and workout type</p>
              </div>
            </div>
            <Dumbbell className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto p-4">
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Workout Date
            </label>
            <input
              type="date"
              value={mounted ? format(date, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDate(new Date(e.target.value))}
              className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
            <p className="mt-1 text-sm text-gray-400">
              {mounted ? format(date, 'EEEE, MMMM d, yyyy') : 'Loading...'}
            </p>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-4">Select Workout Type</h2>
            <WorkoutTypeSelector onSelect={setSelectedType} />
          </div>
          
          {selectedType && (
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 font-medium transition-colors"
              >
                {isCreating ? 'Creating...' : `Create ${selectedType} Workout`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}