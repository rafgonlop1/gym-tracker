'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'
import { SetTracker } from './set-tracker'

interface SortableExerciseItemProps {
  exercise: any
  isDragging: boolean
  onRemove: (workoutExerciseId: string) => void
  onUpdate: () => void
}

export function SortableExerciseItem({ exercise, isDragging, onRemove, onUpdate }: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="absolute -top-3 -left-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          {...attributes}
          {...listeners}
          className="p-2 bg-gray-700/80 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors backdrop-blur-sm cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => onRemove(exercise.id)}
          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors backdrop-blur-sm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <SetTracker
        workoutExerciseId={exercise.id}
        exerciseId={exercise.exercise.id}
        exerciseName={exercise.exercise.name}
        sets={exercise.sets}
        onUpdate={onUpdate}
      />
    </div>
  )
}