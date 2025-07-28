'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableExerciseItem } from './sortable-exercise-item'
import { updateExerciseOrder } from '@/app/actions/workout'

interface SortableExerciseListProps {
  exercises: any[]
  onRemove: (workoutExerciseId: string) => void
  onUpdate: () => void
}

export function SortableExerciseList({ exercises, onRemove, onUpdate }: SortableExerciseListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = exercises.findIndex((ex) => ex.id === active.id)
      const newIndex = exercises.findIndex((ex) => ex.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Update order in database
        await updateExerciseOrder(exercises[0].workoutId, active.id as string, newIndex + 1)
        onUpdate()
      }
    }
    
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(event.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={exercises.map(ex => ex.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {exercises.map((we) => (
            <SortableExerciseItem
              key={we.id}
              exercise={we}
              isDragging={activeId === we.id}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}