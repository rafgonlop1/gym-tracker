'use client'

import { useState, useEffect, useCallback } from 'react'
import { addSet, updateSet, deleteSet, getLastWorkoutSets } from '@/app/actions/workout'
import { Plus, Trash2, Check, X, TrendingUp, Weight } from 'lucide-react'
import { VALIDATION } from '@/lib/constants'
import type { Set } from '@prisma/client'
import type { SetFormData } from '@/types'

interface SetTrackerProps {
  workoutExerciseId: string
  exerciseId: string
  exerciseName: string
  sets: Set[]
  onUpdate: () => void
}

export function SetTracker({ 
  workoutExerciseId, 
  exerciseId,
  exerciseName, 
  sets, 
  onUpdate 
}: SetTrackerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    reps: '', 
    weight: '', 
    rpe: '', 
    notes: '' 
  })
  const [lastSets, setLastSets] = useState<Set[]>([])
  
  useEffect(() => {
    getLastWorkoutSets(exerciseId).then(setLastSets)
  }, [exerciseId])
  
  const handleAdd = async () => {
    try {
      const reps = parseInt(formData.reps)
      const weight = parseFloat(formData.weight)
      const rpe = formData.rpe ? parseInt(formData.rpe) : undefined
      
      if (isNaN(reps) || isNaN(weight)) return
      if (reps < VALIDATION.MIN_REPS || reps > VALIDATION.MAX_REPS) return
      if (weight < VALIDATION.MIN_WEIGHT || weight > VALIDATION.MAX_WEIGHT) return
      if (rpe !== undefined && (rpe < VALIDATION.MIN_RPE || rpe > VALIDATION.MAX_RPE)) return
      
      await addSet(
        workoutExerciseId,
        reps,
        weight,
        rpe,
        formData.notes || undefined
      )
      
      setFormData({ reps: '', weight: '', rpe: '', notes: '' })
      setIsAdding(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to add set:', error)
    }
  }
  
  const handleUpdate = async (setId: string) => {
    try {
      const reps = parseInt(formData.reps)
      const weight = parseFloat(formData.weight)
      const rpe = formData.rpe ? parseInt(formData.rpe) : undefined
      
      if (isNaN(reps) || isNaN(weight)) return
      if (reps < VALIDATION.MIN_REPS || reps > VALIDATION.MAX_REPS) return
      if (weight < VALIDATION.MIN_WEIGHT || weight > VALIDATION.MAX_WEIGHT) return
      if (rpe !== undefined && (rpe < VALIDATION.MIN_RPE || rpe > VALIDATION.MAX_RPE)) return
      
      await updateSet(
        setId,
        reps,
        weight,
        rpe,
        formData.notes || undefined
      )
      
      setEditingId(null)
      onUpdate()
    } catch (error) {
      console.error('Failed to update set:', error)
    }
  }
  
  const handleDelete = async (setId: string) => {
    try {
      await deleteSet(setId)
      onUpdate()
    } catch (error) {
      console.error('Failed to delete set:', error)
    }
  }
  
  const prefillLastSet = useCallback((index: number) => {
    if (lastSets[index]) {
      setFormData({
        reps: lastSets[index].reps.toString(),
        weight: lastSets[index].weight.toString(),
        rpe: '',
        notes: '',
      })
    }
  }, [lastSets])
  
  const bestSet = sets.length > 0 
    ? sets.reduce((best, current) => {
        const currentVolume = current.weight * current.reps
        const bestVolume = best.weight * best.reps
        return currentVolume > bestVolume ? current : best
      })
    : null
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{exerciseName}</h3>
          {bestSet && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>Best: {bestSet.weight}kg × {bestSet.reps}</span>
              {bestSet.rpe && <span className="text-gray-500">@{bestSet.rpe}</span>}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {lastSets.length > 0 && sets.length === 0 && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm font-medium text-blue-400 mb-1">Previous workout:</p>
            <div className="flex flex-wrap gap-2">
              {lastSets.map((s, i) => (
                <span key={i} className="px-2 py-1 bg-gray-700 rounded text-sm">
                  {s.weight}kg × {s.reps}
                  {s.rpe && <span className="text-gray-400"> @{s.rpe}</span>}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {sets.map((set, index) => (
            <div key={set.id} className="group">
              {editingId === set.id ? (
                <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg">
                  <span className="w-8 text-center text-sm font-medium text-gray-500">#{index + 1}</span>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="kg"
                    className="w-20 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    step="0.5"
                  />
                  <span className="text-gray-500">×</span>
                  <input
                    type="number"
                    value={formData.reps}
                    onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                    placeholder="reps"
                    className="w-20 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                  <input
                    type="number"
                    value={formData.rpe}
                    onChange={(e) => setFormData({ ...formData, rpe: e.target.value })}
                    placeholder="RPE"
                    className="w-16 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min={VALIDATION.MIN_RPE}
                    max={VALIDATION.MAX_RPE}
                  />
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={() => handleUpdate(set.id)}
                      className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                  <span className="w-8 text-center text-sm font-medium text-gray-500">#{index + 1}</span>
                  <button
                    onClick={() => {
                      setEditingId(set.id)
                      setFormData({
                        reps: set.reps.toString(),
                        weight: set.weight.toString(),
                        rpe: set.rpe?.toString() || '',
                        notes: set.notes || '',
                      })
                    }}
                    className="flex-1 text-left flex items-center gap-3"
                  >
                    <div className="flex items-center gap-1">
                      <Weight className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{set.weight}kg</span>
                    </div>
                    <span className="text-gray-600">×</span>
                    <span className="font-medium">{set.reps} reps</span>
                    {set.rpe && (
                      <>
                        <span className="text-gray-600">@</span>
                        <span className="text-gray-400">RPE {set.rpe}</span>
                      </>
                    )}
                    {set.notes && (
                      <span className="text-sm text-gray-500 italic">"{set.notes}"</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(set.id)}
                    className="p-1.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {isAdding ? (
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="w-8 text-center text-sm font-medium text-blue-400">#{sets.length + 1}</span>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="kg"
                className="w-20 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                step="0.5"
                autoFocus
              />
              <span className="text-gray-500">×</span>
              <input
                type="number"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                placeholder="reps"
                className="w-20 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
              <input
                type="number"
                value={formData.rpe}
                onChange={(e) => setFormData({ ...formData, rpe: e.target.value })}
                placeholder="RPE"
                className="w-16 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                min={VALIDATION.MIN_RPE}
                max={VALIDATION.MAX_RPE}
              />
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={handleAdd}
                  className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false)
                    setFormData({ reps: '', weight: '', rpe: '', notes: '' })
                  }}
                  className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAdding(true)
                prefillLastSet(sets.length)
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-blue-400 hover:bg-blue-500/10 rounded-lg border-2 border-dashed border-gray-700 hover:border-blue-500/50 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Set</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}