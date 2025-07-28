'use client'

import { useState, useEffect } from 'react'
import { WorkoutType } from '@prisma/client'
import { getTodayWorkouts, deleteWorkout, createWorkout, getWorkoutsForMonth } from '@/app/actions/workout'
import { getTemplatesByType } from '@/app/actions/template'
import { format, startOfMonth, endOfMonth, subDays, isSameDay } from 'date-fns'
import { 
  Calendar, 
  TrendingUp, 
  Dumbbell,
  Plus,
  Clock,
  Activity,
  Trash2,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
  Timer,
  ArrowRight,
  Sparkles,
  Flame,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quickStartType, setQuickStartType] = useState<WorkoutType | 'show' | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    setMounted(true)
    loadDashboardData()
  }, [])
  
  const loadDashboardData = async () => {
    setLoading(true)
    
    // Load all data in parallel
    const [workouts, recentWorkouts, allTemplates] = await Promise.all([
      getTodayWorkouts(),
      getWorkoutsForMonth(subDays(new Date(), 30), new Date()),
      Promise.all([
        getTemplatesByType(WorkoutType.PUSH),
        getTemplatesByType(WorkoutType.PULL),
        getTemplatesByType(WorkoutType.LEGS),
      ]).then(results => results.flat())
    ])
    
    setTodayWorkouts(workouts)
    setRecentWorkouts(recentWorkouts)
    setTemplates(allTemplates.slice(0, 4)) // Show only 4 templates
    setLoading(false)
  }
  
  const handleQuickStart = async (type: WorkoutType) => {
    setIsCreating(true)
    const workout = await createWorkout(type, new Date())
    router.push(`/workout/${workout.id}/edit`)
  }
  
  // Get available workout types (ones not already created today)
  const getAvailableWorkoutTypes = () => {
    const createdTypes = todayWorkouts.map(w => w.type)
    return Object.values(WorkoutType).filter(type => !createdTypes.includes(type))
  }
  
  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Delete this workout?')) return
    await deleteWorkout(workoutId)
    await loadDashboardData()
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
  
  const getWorkoutTypeColor = (type: WorkoutType) => {
    const colors = {
      [WorkoutType.PUSH]: 'from-blue-500 to-blue-600',
      [WorkoutType.PULL]: 'from-green-500 to-green-600',
      [WorkoutType.LEGS]: 'from-red-500 to-red-600',
      [WorkoutType.CARDIO_Z2]: 'from-yellow-500 to-yellow-600',
      [WorkoutType.HIIT]: 'from-orange-500 to-orange-600',
      [WorkoutType.PLYOMETRICS]: 'from-purple-500 to-purple-600',
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }
  
  const getStats = () => {
    const thisWeek = recentWorkouts.filter(w => {
      const date = new Date(w.date)
      return date >= subDays(new Date(), 7)
    })
    
    const thisMonth = recentWorkouts
    
    return {
      weekCount: thisWeek.length,
      monthCount: thisMonth.length,
      streak: calculateStreak(),
      weekVolume: calculateVolume(thisWeek)
    }
  }
  
  const calculateStreak = () => {
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i)
      const hasWorkout = recentWorkouts.some(w => 
        isSameDay(new Date(w.date), checkDate)
      )
      
      if (hasWorkout) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    
    return streak
  }
  
  const calculateVolume = (workouts: any[]) => {
    let total = 0
    workouts.forEach(w => {
      w.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((set: any) => {
          total += set.weight * set.reps
        })
      })
    })
    return Math.round(total)
  }
  
  const stats = getStats()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold">Gym Tracker</h1>
            </div>
            
            <nav className="flex items-center gap-2">
              <Link
                href="/calendar"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Calendar"
              >
                <Calendar className="w-5 h-5" />
              </Link>
              <Link
                href="/progress"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Progress"
              >
                <BarChart3 className="w-5 h-5" />
              </Link>
              <Link
                href="/templates"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Templates"
              >
                <Sparkles className="w-5 h-5" />
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-4">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Today's Workouts - Large Card */}
          <div className="md:col-span-2 lg:col-span-2">
            {todayWorkouts.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Active Sessions Today</p>
                      <h2 className="text-2xl font-bold">{todayWorkouts.length} Workout{todayWorkouts.length !== 1 ? 's' : ''}</h2>
                    </div>
                    <button
                      onClick={() => setQuickStartType('show')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Workout</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {todayWorkouts.map((workout) => (
                      <div key={workout.id} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getWorkoutTypeIcon(workout.type)}</span>
                            <div>
                              <h3 className="font-semibold">{workout.type} Workout</h3>
                              <p className="text-sm text-gray-400">
                                {workout.exercises?.length || 0} exercises • 
                                {workout.exercises?.reduce((acc: number, ex: any) => acc + ex.sets.length, 0) || 0} sets
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <Link
                          href={`/workout/${workout.id}/edit`}
                          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 group"
                        >
                          Continue
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Workout Type Selector Modal */}
                {quickStartType === 'show' && (
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Add New Workout</h3>
                      <button
                        onClick={() => setQuickStartType(null)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {getAvailableWorkoutTypes().map((type) => (
                        <button
                          key={type}
                          onClick={() => handleQuickStart(type)}
                          disabled={isCreating}
                          className={`p-4 rounded-xl bg-gradient-to-br ${getWorkoutTypeColor(type)} hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50`}
                        >
                          <p className="text-2xl mb-1">{getWorkoutTypeIcon(type)}</p>
                          <p className="font-medium text-sm">{type.replace('_', ' ')}</p>
                        </button>
                      ))}
                    </div>
                    
                    {getAvailableWorkoutTypes().length === 0 && (
                      <p className="text-center text-gray-400 py-8">
                        You've already created all workout types for today! 🎉
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 h-full border border-gray-700">
                <h2 className="text-xl font-bold mb-2">Start Today's Workout</h2>
                <p className="text-gray-400 mb-6">Choose a workout type to begin</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.values(WorkoutType).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleQuickStart(type)}
                      disabled={isCreating}
                      className={`p-4 rounded-xl bg-gradient-to-br ${getWorkoutTypeColor(type)} hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50`}
                    >
                      <p className="text-2xl mb-1">{getWorkoutTypeIcon(type)}</p>
                      <p className="font-medium text-sm">{type.replace('_', ' ')}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Stats Cards */}
          <div className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold">{stats.streak}</span>
              </div>
              <p className="text-gray-400 text-sm">Day Streak</p>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.weekCount}</span>
              </div>
              <p className="text-gray-400 text-sm">This Week</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.monthCount}</span>
              </div>
              <p className="text-gray-400 text-sm">This Month</p>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span className="text-2xl font-bold">{stats.weekVolume}</span>
              </div>
              <p className="text-gray-400 text-sm">Week Volume</p>
            </div>
          </div>
        </div>
        
        {/* Templates Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Quick Start Templates</h2>
            <Link 
              href="/templates"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={async () => {
                  const workout = await createWorkout(template.type, new Date())
                  router.push(`/workout/${workout.id}/edit?template=${template.id}`)
                }}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:bg-gray-800 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{getWorkoutTypeIcon(template.type)}</span>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-medium mb-1">{template.name}</h3>
                <p className="text-sm text-gray-400">{template.exercises.length} exercises</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Recent Workouts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <Link 
              href="/calendar"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
            >
              View calendar
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentWorkouts.slice(0, 6).map((workout) => (
              <Link
                key={workout.id}
                href={`/workout/${workout.id}/edit`}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:bg-gray-800 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getWorkoutTypeIcon(workout.type)}</span>
                    <div>
                      <p className="font-medium">{workout.type}</p>
                      <p className="text-sm text-gray-400">
                        {mounted ? format(new Date(workout.date), 'MMM d') : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{workout.exercises?.length || 0} exercises</span>
                  <span>•</span>
                  <span>
                    {workout.exercises?.reduce((acc: number, ex: any) => acc + ex.sets.length, 0) || 0} sets
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}