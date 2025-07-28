'use client'

import { useState, useEffect } from 'react'
import { getAllTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/app/actions/template'
import { getAllExercises } from '@/app/actions/exercise'
import { WorkoutType } from '@prisma/client'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, GripVertical, Sparkles, FileText } from 'lucide-react'
import Link from 'next/link'
import type { Exercise } from '@prisma/client'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    type: WorkoutType
    exercises: { exerciseId: string; order: number }[]
  }>({
    name: '',
    type: WorkoutType.PULL,
    exercises: [],
  })
  
  useEffect(() => {
    loadTemplates()
    getAllExercises().then(setExercises)
  }, [])
  
  const loadTemplates = async () => {
    const data = await getAllTemplates()
    setTemplates(data)
  }
  
  const handleCreate = async () => {
    if (!formData.name || formData.exercises.length === 0) return
    
    await createTemplate(formData.name, formData.type, formData.exercises)
    setIsCreating(false)
    setFormData({ name: '', type: WorkoutType.PULL, exercises: [] })
    loadTemplates()
  }
  
  const handleUpdate = async () => {
    if (!editingId || !formData.name || formData.exercises.length === 0) return
    
    await updateTemplate(editingId, formData.name, formData.exercises)
    setEditingId(null)
    setFormData({ name: '', type: WorkoutType.PULL, exercises: [] })
    loadTemplates()
  }
  
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id)
      loadTemplates()
    }
  }
  
  const startEdit = (template: any) => {
    setEditingId(template.id)
    setFormData({
      name: template.name,
      type: template.type,
      exercises: template.exercises.map((e: any) => ({
        exerciseId: e.exerciseId,
        order: e.order,
      })),
    })
  }
  
  const addExercise = (exerciseId: string) => {
    const order = formData.exercises.length + 1
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { exerciseId, order }],
    })
  }
  
  const removeExercise = (index: number) => {
    const newExercises = formData.exercises.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      exercises: newExercises.map((e, i) => ({ ...e, order: i + 1 })),
    })
  }
  
  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...formData.exercises]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= newExercises.length) return
    
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]]
    
    setFormData({
      ...formData,
      exercises: newExercises.map((e, i) => ({ ...e, order: i + 1 })),
    })
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
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Workout Templates</h1>
                <p className="text-sm text-gray-400">Create and manage your workout routines</p>
              </div>
            </div>
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto p-4">
        
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="mb-6 flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        )}
        
        {(isCreating || editingId) && (
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {isCreating ? 'Create New Template' : 'Edit Template'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pull Day Advanced"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                />
              </div>
              
              {isCreating && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Workout Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkoutType })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value={WorkoutType.PULL}>Pull</option>
                    <option value={WorkoutType.PUSH}>Push</option>
                    <option value={WorkoutType.LEGS}>Legs</option>
                    <option value={WorkoutType.PLYOMETRICS}>Plyometrics</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Exercises
                </label>
                <div className="space-y-2">
                  {formData.exercises.map((ex, index) => {
                    const exercise = exercises.find(e => e.id === ex.exerciseId)
                    return (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
                        <GripVertical className="w-4 h-4 text-gray-500" />
                        <span className="flex-1">{exercise?.name}</span>
                        <button
                          onClick={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveExercise(index, 'down')}
                          disabled={index === formData.exercises.length - 1}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeExercise(index)}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
                
                <select
                  value=""
                  onChange={(e) => e.target.value && addExercise(e.target.value)}
                  className="mt-2 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Add an exercise...</option>
                  {exercises
                    .filter(e => !formData.exercises.some(ex => ex.exerciseId === e.id))
                    .map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name} ({exercise.category})
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={isCreating ? handleCreate : handleUpdate}
                  disabled={!formData.name || formData.exercises.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isCreating ? 'Create' : 'Update'}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setEditingId(null)
                    setFormData({ name: '', type: WorkoutType.PULL, exercises: [] })
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {templates.map((template) => {
            const getWorkoutTypeColor = (type: WorkoutType) => {
              const colors: Record<WorkoutType, string> = {
                [WorkoutType.PUSH]: 'bg-blue-500/10 text-blue-400',
                [WorkoutType.PULL]: 'bg-green-500/10 text-green-400',
                [WorkoutType.LEGS]: 'bg-red-500/10 text-red-400',
                [WorkoutType.PLYOMETRICS]: 'bg-purple-500/10 text-purple-400',
                [WorkoutType.CARDIO_Z2]: 'bg-yellow-500/10 text-yellow-400',
                [WorkoutType.HIIT]: 'bg-orange-500/10 text-orange-400',
              }
              return colors[type] || 'bg-gray-500/10 text-gray-400'
            }
            
            return (
              <div key={template.id} className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getWorkoutTypeColor(template.type)}`}>
                      {template.type}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(template)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {template.exercises.map((ex: any) => (
                    <div key={ex.id} className="flex items-center gap-3 text-sm">
                      <span className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-xs text-gray-500 font-medium">
                        {ex.order}
                      </span>
                      <span className="text-gray-300">{ex.exercise.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          
          {templates.length === 0 && !isCreating && (
            <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No templates created yet.</p>
              <p className="text-sm text-gray-500 mt-2">Create your first template to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}