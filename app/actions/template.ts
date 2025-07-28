'use server'

import { prisma, DEFAULT_USER_ID } from '@/lib/db'
import { WorkoutType } from '@prisma/client'
import { createWorkout, addExerciseToWorkout } from './workout'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors'

export async function getAllTemplates() {
  try {
    return await prisma.workoutTemplate.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    throw new DatabaseError('Failed to fetch templates')
  }
}

export async function getTemplatesByType(type: WorkoutType) {
  try {
    return await prisma.workoutTemplate.findMany({
      where: { 
        userId: DEFAULT_USER_ID,
        type,
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    throw new DatabaseError('Failed to fetch templates by type')
  }
}

export async function createTemplate(
  name: string, 
  type: WorkoutType, 
  exercises: { exerciseId: string; order: number }[]
) {
  try {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Template name is required')
    }

    if (!exercises || exercises.length === 0) {
      throw new ValidationError('At least one exercise is required')
    }

    return await prisma.workoutTemplate.create({
      data: {
        userId: DEFAULT_USER_ID,
        name: name.trim(),
        type,
        exercises: {
          create: exercises,
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to create template')
  }
}

export async function updateTemplate(
  templateId: string,
  name: string,
  exercises: { exerciseId: string; order: number }[]
) {
  try {
    if (!templateId) {
      throw new ValidationError('Template ID is required')
    }

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Template name is required')
    }

    if (!exercises || exercises.length === 0) {
      throw new ValidationError('At least one exercise is required')
    }

    // Use transaction to ensure consistency
    return await prisma.$transaction(async (tx) => {
      await tx.templateExercise.deleteMany({
        where: { templateId },
      })
      
      return await tx.workoutTemplate.update({
        where: { id: templateId },
        data: {
          name: name.trim(),
          exercises: {
            create: exercises,
          },
        },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
      })
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to update template')
  }
}

export async function deleteTemplate(templateId: string) {
  try {
    if (!templateId) {
      throw new ValidationError('Template ID is required')
    }

    return await prisma.workoutTemplate.delete({
      where: { id: templateId },
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to delete template')
  }
}

export async function applyTemplateToToday(templateId: string) {
  try {
    if (!templateId) {
      throw new ValidationError('Template ID is required')
    }

    const template = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: { 
        exercises: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    if (!template) {
      throw new NotFoundError('Template not found')
    }
    
    const workout = await createWorkout(template.type, new Date())
    
    // Use Promise.all for better performance
    await Promise.all(
      template.exercises.map((exercise) =>
        addExerciseToWorkout(workout.id, exercise.exerciseId)
      )
    )
    
    return workout
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error
    throw new DatabaseError('Failed to apply template')
  }
}

export async function applyTemplateToWorkout(workoutId: string, templateId: string) {
  try {
    if (!workoutId || !templateId) {
      throw new ValidationError('Workout ID and Template ID are required')
    }

    const template = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    if (!template) {
      throw new NotFoundError('Template not found')
    }
    
    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Get the current highest order in the workout
      const lastExercise = await tx.workoutExercise.findFirst({
        where: { workoutId },
        orderBy: { order: 'desc' },
      })
      
      const startOrder = lastExercise ? lastExercise.order + 1 : 1
      
      // Create all exercises in batch
      await tx.workoutExercise.createMany({
        data: template.exercises.map((templateExercise, index) => ({
          workoutId,
          exerciseId: templateExercise.exerciseId,
          order: startOrder + index,
        })),
      })
    })
    
    return workoutId
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error
    throw new DatabaseError('Failed to apply template to workout')
  }
}