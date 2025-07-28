'use client'

import { useState, useEffect } from 'react'
import { getWorkoutsForMonth, deleteWorkout } from '@/app/actions/workout'
import { WorkoutType } from '@prisma/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Home, Trash2, Edit3, Plus, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatWorkoutDate } from '@/lib/date-utils'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [workouts, setWorkouts] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      loadWorkouts()
    }
  }, [currentMonth, mounted])
  
  const loadWorkouts = async () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    // Create UTC dates to match server
    const startUTC = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0, 0))
    const endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0, 0))
    const data = await getWorkoutsForMonth(startUTC, endUTC)
    setWorkouts(data)
  }
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })
  
  const getWorkoutForDay = (date: Date) => {
    return workouts.find(w => {
      const workoutDate = new Date(w.date)
      return workoutDate.getUTCFullYear() === date.getFullYear() &&
             workoutDate.getUTCMonth() === date.getMonth() &&
             workoutDate.getUTCDate() === date.getDate()
    })
  }
  
  const getWorkoutColor = (type: WorkoutType) => {
    const colors = {
      [WorkoutType.PUSH]: 'bg-blue-500',
      [WorkoutType.PULL]: 'bg-green-500',
      [WorkoutType.LEGS]: 'bg-red-500',
      [WorkoutType.CARDIO_Z2]: 'bg-yellow-500',
      [WorkoutType.HIIT]: 'bg-orange-500',
      [WorkoutType.PLYOMETRICS]: 'bg-purple-500',
    }
    return colors[type] || 'bg-gray-500'
  }
  
  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return
    
    setDeleting(true)
    await deleteWorkout(workoutId)
    await loadWorkouts()
    setSelectedWorkout(null)
    setDeleting(false)
  }
  
  const handleDateClick = (date: Date) => {
    const workout = getWorkoutForDay(date)
    setSelectedDate(date)
    setSelectedWorkout(workout)
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Workout Calendar</h1>
                <p className="text-sm text-gray-400">Track your training history</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Today</span>
            </Link>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-4">
        
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-3 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">
              {mounted ? format(currentMonth, 'MMMM yyyy') : 'Loading...'}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-3 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const workout = getWorkoutForDay(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`
                    relative aspect-square p-2 border-2 rounded-xl transition-all
                    ${isToday ? 'border-blue-500 bg-blue-500/20' : 'border-gray-700 bg-gray-900'}
                    ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
                    hover:bg-gray-800 hover:border-gray-600
                  `}
                >
                  <div className="text-sm font-semibold mb-1">
                    {format(day, 'd')}
                  </div>
                  {workout && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className={`h-2 w-full rounded-full ${getWorkoutColor(workout.type)}`} />
                      <p className="text-xs text-gray-400 mt-1 truncate">{workout.type}</p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {Object.values(WorkoutType).map((type) => (
              <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${getWorkoutColor(type)}`} />
                <span className="text-sm font-medium capitalize text-gray-300">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
        
        {selectedDate && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-b border-gray-700">
              <h3 className="text-2xl font-bold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
            </div>
            
            <div className="p-6">
              {selectedWorkout ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${getWorkoutColor(selectedWorkout.type)}`} />
                      <h4 className="text-xl font-semibold capitalize">
                        {selectedWorkout.type.replace('_', ' ')} Workout
                      </h4>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/workout/${selectedWorkout.id}/edit`}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteWorkout(selectedWorkout.id)}
                        disabled={deleting}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-semibold mb-3">Exercises Performed</h5>
                      <div className="space-y-3">
                        {selectedWorkout.exercises.map((we: any) => (
                          <div key={we.id} className="bg-gray-900 rounded-xl p-4">
                            <h6 className="font-medium mb-2">{we.exercise.name}</h6>
                            {we.sets.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {we.sets.map((set: any, index: number) => (
                                  <div key={set.id} className="text-sm bg-gray-800 rounded-lg p-2">
                                    <span className="font-medium">Set {index + 1}:</span>
                                    <span className="text-gray-400"> {set.weight}kg × {set.reps}</span>
                                    {set.rpe && <span className="text-gray-500"> @{set.rpe}</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No sets recorded</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedWorkout.cardio && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                      <h5 className="font-semibold mb-2">Cardio Session</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Duration:</span>
                          <p className="font-medium">{selectedWorkout.cardio.durationMinutes} min</p>
                        </div>
                        {selectedWorkout.cardio.distanceKm && (
                          <div>
                            <span className="text-gray-400">Distance:</span>
                            <p className="font-medium">{selectedWorkout.cardio.distanceKm} km</p>
                          </div>
                        )}
                        {selectedWorkout.cardio.incline && (
                          <div>
                            <span className="text-gray-400">Incline:</span>
                            <p className="font-medium">{selectedWorkout.cardio.incline}%</p>
                          </div>
                        )}
                        {selectedWorkout.cardio.avgHeartRate && (
                          <div>
                            <span className="text-gray-400">Avg HR:</span>
                            <p className="font-medium">{selectedWorkout.cardio.avgHeartRate} bpm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Link
                    href={`/workout/${selectedWorkout.id}/edit`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  >
                    <Edit3 className="w-5 h-5" />
                    Edit Full Workout
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Dumbbell className="w-10 h-10 text-gray-600" />
                  </div>
                  <p className="text-gray-400 mb-6">No workout recorded for this date.</p>
                  <Link
                    href={`/workout/new?date=${selectedDate.toISOString()}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Create Workout
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}