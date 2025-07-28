'use client'

import { useState, useEffect, useRef } from 'react'
import { searchExercises, getAllExercises } from '@/app/actions/exercise'
import { Search, Plus, X, Dumbbell } from 'lucide-react'
import type { Exercise } from '@prisma/client'

interface ExerciseSearchProps {
  onSelect: (exercise: Exercise) => void
}

export function ExerciseSearch({ onSelect }: ExerciseSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Exercise[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    // Load all exercises when component mounts
    getAllExercises().then(setAllExercises)
  }, [])
  
  useEffect(() => {
    if (query.length > 0) {
      setLoading(true)
      searchExercises(query).then(results => {
        setResults(results)
        setLoading(false)
      })
    } else {
      setResults(allExercises)
    }
  }, [query, allExercises])
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])
  
  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise)
    setQuery('')
    setIsOpen(false)
  }
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      push: 'text-blue-400',
      pull: 'text-green-400',
      legs: 'text-red-400',
      core: 'text-purple-400',
      plyo: 'text-orange-400',
    }
    return colors[category] || 'text-gray-400'
  }
  
  const groupedExercises = results.reduce((acc, exercise) => {
    if (!acc[exercise.category]) {
      acc[exercise.category] = []
    }
    acc[exercise.category].push(exercise)
    return acc
  }, {} as Record<string, Exercise[]>)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Exercise
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-x-4 top-20 max-w-2xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-blue-400" />
                  Add Exercise
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                />
              </div>
            </div>
            
            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : Object.keys(groupedExercises).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedExercises).map(([category, exercises]) => (
                    <div key={category}>
                      <h4 className={`text-sm font-medium mb-2 capitalize ${getCategoryColor(category)}`}>
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {exercises.map((exercise) => (
                          <button
                            key={exercise.id}
                            onClick={() => handleSelect(exercise)}
                            className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-white">{exercise.name}</p>
                                <p className="text-sm text-gray-400">
                                  {exercise.muscleGroups.join(', ')}
                                </p>
                              </div>
                              <Plus className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No exercises found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}