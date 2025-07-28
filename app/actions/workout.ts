'use server'

import { prisma, DEFAULT_USER_ID } from '@/lib/db'
import { WorkoutType } from '@prisma/client'

export async function createWorkout(type: WorkoutType, date: Date) {
  // Create date at noon UTC to avoid timezone issues
  const dateOnly = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0))
  
  const existing = await prisma.workout.findUnique({
    where: {
      userId_date: {
        userId: DEFAULT_USER_ID,
        date: dateOnly,
      },
    },
  })
  
  if (existing) {
    return existing
  }
  
  return await prisma.workout.create({
    data: { 
      userId: DEFAULT_USER_ID, 
      type, 
      date: dateOnly 
    },
  })
}

export async function getTodayWorkout() {
  const today = new Date()
  // Create date at noon UTC to avoid timezone issues
  const dateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0))
  
  return await prisma.workout.findUnique({
    where: {
      userId_date: {
        userId: DEFAULT_USER_ID,
        date: dateOnly,
      },
    },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      cardio: true,
      cmjTests: true,
    },
  })
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const lastExercise = await prisma.workoutExercise.findFirst({
    where: { workoutId },
    orderBy: { order: 'desc' },
  })
  
  const order = lastExercise ? lastExercise.order + 1 : 1
  
  return await prisma.workoutExercise.create({
    data: { workoutId, exerciseId, order },
    include: {
      exercise: true,
      sets: true,
    },
  })
}

export async function removeExerciseFromWorkout(workoutExerciseId: string) {
  return await prisma.workoutExercise.delete({
    where: { id: workoutExerciseId },
  })
}

export async function addSet(workoutExerciseId: string, reps: number, weight: number, rpe?: number, notes?: string) {
  return await prisma.set.create({
    data: { workoutExerciseId, reps, weight, rpe, notes },
  })
}

export async function updateSet(setId: string, reps: number, weight: number, rpe?: number, notes?: string) {
  return await prisma.set.update({
    where: { id: setId },
    data: { reps, weight, rpe, notes },
  })
}

export async function deleteSet(setId: string) {
  return await prisma.set.delete({
    where: { id: setId },
  })
}

export async function logCardio(
  date: Date, 
  type: WorkoutType, 
  durationMinutes: number, 
  distanceKm?: number, 
  incline?: number,
  mode?: string,
  avgHeartRate?: number,
  notes?: string
) {
  // Date is already handled properly in createWorkout
  const workout = await createWorkout(type, date)
  
  const existing = await prisma.cardioSession.findUnique({
    where: { workoutId: workout.id },
  })
  
  if (existing) {
    return await prisma.cardioSession.update({
      where: { id: existing.id },
      data: { durationMinutes, distanceKm, incline, mode, avgHeartRate, notes },
    })
  }
  
  return await prisma.cardioSession.create({
    data: { workoutId: workout.id, durationMinutes, distanceKm, incline, mode, avgHeartRate, notes },
  })
}

export async function getExerciseProgress(
  exerciseId: string, 
  startDate?: Date, 
  endDate?: Date
) {
  const where: any = {
    workoutExercise: {
      exerciseId,
      workout: {},
    },
  }
  
  if (startDate || endDate) {
    where.workoutExercise.workout.date = {}
    if (startDate) where.workoutExercise.workout.date.gte = startDate
    if (endDate) where.workoutExercise.workout.date.lte = endDate
  }
  
  const sets = await prisma.set.findMany({
    where,
    include: {
      workoutExercise: {
        include: { 
          workout: true,
          exercise: true,
        },
      },
    },
    orderBy: { 
      workoutExercise: { 
        workout: { 
          date: 'desc' 
        } 
      } 
    },
  })
  
  const groupedByDate = sets.reduce((acc, set) => {
    const date = set.workoutExercise.workout.date.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(set)
    return acc
  }, {} as Record<string, typeof sets>)
  
  return Object.entries(groupedByDate).map(([date, sets]) => {
    const bestSet = sets.reduce((best, current) => {
      const currentVolume = current.weight * current.reps
      const bestVolume = best.weight * best.reps
      return currentVolume > bestVolume ? current : best
    })
    
    return {
      date,
      sets,
      bestSet,
      exercise: sets[0].workoutExercise.exercise,
    }
  })
}

export async function getLastWorkoutSets(exerciseId: string) {
  const lastWorkout = await prisma.workoutExercise.findFirst({
    where: {
      exerciseId,
      workout: {
        userId: DEFAULT_USER_ID,
      },
    },
    orderBy: {
      workout: {
        date: 'desc',
      },
    },
    include: {
      sets: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  
  return lastWorkout?.sets || []
}

export async function addCMJTest(workoutId: string, heightCm: number, notes?: string) {
  return await prisma.cMJTest.create({
    data: { workoutId, heightCm, notes },
  })
}

export async function getCMJHistory(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  return await prisma.cMJTest.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
      workout: {
        userId: DEFAULT_USER_ID,
      },
    },
    include: {
      workout: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function getWorkoutsForMonth(startDate: Date, endDate: Date) {
  return await prisma.workout.findMany({
    where: {
      userId: DEFAULT_USER_ID,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      cardio: true,
      cmjTests: true,
    },
    orderBy: {
      date: 'asc',
    },
  })
}

export async function getWorkoutById(workoutId: string) {
  return await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      cardio: true,
      cmjTests: true,
    },
  })
}

export async function deleteWorkout(workoutId: string) {
  return await prisma.workout.delete({
    where: { id: workoutId },
  })
}