'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { WorkoutType } from '@prisma/client'
import { getWorkoutById, addExerciseToWorkout, removeExerciseFromWorkout } from '@/app/actions/workout'
import { getTemplatesByType, applyTemplateToWorkout } from '@/app/actions/template'
import { ExerciseSearch } from '@/components/exercise-search'
import { SetTracker } from '@/components/set-tracker'
import { CardioTracker } from '@/components/cardio-tracker'
import { CMJTracker } from '@/components/cmj-tracker'
import { SortableExerciseList } from '@/components/sortable-exercise-list'
import { format } from 'date-fns'
import { Calendar, FileText, X, ChevronLeft, CheckCircle, Plus, Sparkles, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatWorkoutDate } from '@/lib/date-utils'

export default function EditWorkoutPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const workoutId = params.id as string
  const templateId = searchParams.get('template')
  
  const [workout, setWorkout] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadWorkout()
  }, [workoutId])
  
  useEffect(() => {
    // Auto-apply template if coming from dashboard
    if (templateId && workout && workout.exercises.length === 0) {
      handleApplyTemplate(templateId)
    }
  }, [templateId, workout])
  
  useEffect(() => {
    if (workout && !isCardio(workout.type)) {
      getTemplatesByType(workout.type).then(setTemplates)
    }
  }, [workout])
  
  const loadWorkout = async () => {
    setLoading(true)
    const data = await getWorkoutById(workoutId)
    setWorkout(data)
    setLoading(false)
  }
  
  const isCardio = (type: WorkoutType) => {
    return [WorkoutType.CARDIO_Z2, WorkoutType.HIIT].includes(type)
  }
  
  const handleAddExercise = async (exercise: any) => {
    await addExerciseToWorkout(workoutId, exercise.id)
    await loadWorkout()
  }
  
  const handleRemoveExercise = async (workoutExerciseId: string) => {
    await removeExerciseFromWorkout(workoutExerciseId)
    await loadWorkout()
  }
  
  const handleApplyTemplate = async (templateId: string) => {
    await applyTemplateToWorkout(workoutId, templateId)
    await loadWorkout()
    setShowTemplates(false)
  }
  
  const getWorkoutTypeIcon = (type: WorkoutType) => {
    const icons = {
      [WorkoutType.PUSH]: '💪',
      [WorkoutType.PULL]: '🏋️',
      [WorkoutType.LEGS]: '🦵',
      [WorkoutType.CARDIO_Z2]: '🏃',
      [WorkoutType.HIIT]: '⚡',
      [WorkoutType.PLYOMETRICS]: '🦘',
    }
    return icons[type] || '💪'
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }
  
  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Workout not found</p>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getWorkoutTypeIcon(workout.type)}</span>
                <div>
                  <h1 className="text-xl font-bold">{workout.type} Workout</h1>
                  <p className="text-sm text-gray-400">{formatWorkoutDate(workout.date)}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Finish</span>
            </button>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-4">
        <div className="space-y-6">
          {workout.type === WorkoutType.PLYOMETRICS && (
            <CMJTracker 
              workoutId={workoutId}
              onUpdate={loadWorkout}
            />
          )}
          
          {isCardio(workout.type) ? (
            <CardioTracker 
              type={workout.type} 
              existingSession={workout.cardio}
              onUpdate={loadWorkout}
            />
          ) : (
            <>
              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ExerciseSearch onSelect={handleAddExercise} />
                {templates.length > 0 && (
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Apply Template
                  </button>
                )}
              </div>
              
              {showTemplates && (
                <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
                  <h3 className="font-semibold mb-3">Available Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template.id)}
                        className="text-left p-4 bg-gray-900 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
                      >
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-400">
                          {template.exercises.length} exercises
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {workout.exercises?.length === 0 && (
                <div className="text-center py-16 bg-gray-800/50 border border-gray-700 rounded-2xl">
                  <Plus className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No exercises added yet</p>
                  <p className="text-sm text-gray-500 mt-2">Add exercises or apply a template to get started!</p>
                </div>
              )}
              
              {workout.exercises && workout.exercises.length > 0 && (
                <SortableExerciseList
                  exercises={workout.exercises}
                  onRemove={handleRemoveExercise}
                  onUpdate={loadWorkout}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}