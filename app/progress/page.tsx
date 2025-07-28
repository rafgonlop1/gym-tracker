'use client'

import { useState, useEffect } from 'react'
import { getAllExercises } from '@/app/actions/exercise'
import { getExerciseProgress } from '@/app/actions/workout'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { TrendingUp, Weight, ChevronLeft, BarChart3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Exercise } from '@prisma/client'

export default function ProgressPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    getAllExercises().then(setExercises)
  }, [])
  
  useEffect(() => {
    if (selectedExercise) {
      setLoading(true)
      getExerciseProgress(selectedExercise).then((data) => {
        setProgress(data)
        setLoading(false)
      })
    }
  }, [selectedExercise])
  
  const chartData = progress.map((entry) => ({
    date: format(new Date(entry.date), 'MMM d'),
    weight: entry.bestSet.weight,
    reps: entry.bestSet.reps,
    volume: entry.bestSet.weight * entry.bestSet.reps,
  }))
  
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
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Progress Tracking</h1>
                <p className="text-sm text-gray-400">Track your strength gains over time</p>
              </div>
            </div>
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto p-4">
        
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl mb-6">
          <label htmlFor="exercise-select" className="block text-sm font-medium text-gray-300 mb-2">
            Select Exercise
          </label>
          {mounted ? (
            <select
              id="exercise-select"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Choose an exercise...</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.category})
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-500">
              Loading exercises...
            </div>
          )}
        </div>
        
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading progress data...</p>
          </div>
        )}
        
        {!loading && selectedExercise && progress.length === 0 && (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
            <Weight className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No data recorded for this exercise yet.</p>
            <p className="text-sm text-gray-500 mt-2">Start tracking to see your progress!</p>
          </div>
        )}
        
        {!loading && progress.length > 0 && (
          <>
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Weight Progress
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#E5E7EB' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#60A5FA" 
                    strokeWidth={2}
                    dot={{ fill: '#60A5FA', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <h2 className="text-xl font-semibold p-6 pb-4 border-b border-gray-700">Workout History</h2>
              <div className="divide-y divide-gray-700">
                {progress.map((entry) => (
                  <div key={entry.date} className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium">
                        {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                        Best: {entry.bestSet.weight}kg × {entry.bestSet.reps}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {entry.sets.map((set: any, index: number) => (
                        <div key={set.id} className="px-3 py-2 bg-gray-900 rounded-lg">
                          <span className="text-gray-400">Set {index + 1}:</span>
                          <span className="ml-2 font-medium">{set.weight}kg × {set.reps}</span>
                          {set.notes && <span className="text-gray-500 block text-xs mt-1">{set.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}