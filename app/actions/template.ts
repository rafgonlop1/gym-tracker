'use server'

import { prisma, DEFAULT_USER_ID } from '@/lib/db'
import { WorkoutType } from '@prisma/client'
import { createWorkout, addExerciseToWorkout } from './workout'

export async function getAllTemplates() {
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
}

export async function getTemplatesByType(type: WorkoutType) {
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
}

export async function createTemplate(
  name: string, 
  type: WorkoutType, 
  exercises: { exerciseId: string; order: number }[]
) {
  return await prisma.workoutTemplate.create({
    data: {
      userId: DEFAULT_USER_ID,
      name,
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
}

export async function updateTemplate(
  templateId: string,
  name: string,
  exercises: { exerciseId: string; order: number }[]
) {
  await prisma.templateExercise.deleteMany({
    where: { templateId },
  })
  
  return await prisma.workoutTemplate.update({
    where: { id: templateId },
    data: {
      name,
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
}

export async function deleteTemplate(templateId: string) {
  return await prisma.workoutTemplate.delete({
    where: { id: templateId },
  })
}

export async function applyTemplateToToday(templateId: string) {
  const template = await prisma.workoutTemplate.findUnique({
    where: { id: templateId },
    include: { 
      exercises: {
        orderBy: { order: 'asc' },
      },
    },
  })
  
  if (!template) {
    throw new Error('Template not found')
  }
  
  const workout = await createWorkout(template.type, new Date())
  
  for (const exercise of template.exercises) {
    await addExerciseToWorkout(workout.id, exercise.exerciseId)
  }
  
  return workout
}

export async function applyTemplateToWorkout(workoutId: string, templateId: string) {
  const template = await prisma.workoutTemplate.findUnique({
    where: { id: templateId },
    include: {
      exercises: {
        orderBy: { order: 'asc' },
      },
    },
  })
  
  if (!template) throw new Error('Template not found')
  
  // Get the current highest order in the workout
  const lastExercise = await prisma.workoutExercise.findFirst({
    where: { workoutId },
    orderBy: { order: 'desc' },
  })
  
  const startOrder = lastExercise ? lastExercise.order + 1 : 1
  
  for (const templateExercise of template.exercises) {
    await prisma.workoutExercise.create({
      data: {
        workoutId,
        exerciseId: templateExercise.exerciseId,
        order: startOrder + templateExercise.order - 1,
      },
    })
  }
  
  return workoutId
}