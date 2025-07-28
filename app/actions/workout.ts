'use server'

import { prisma, DEFAULT_USER_ID } from '@/lib/db'
import { WorkoutType, CardioMode } from '@prisma/client'
import { createUTCDateAtNoon, getTodayUTC } from '@/lib/date-utils'
import { DatabaseError, NotFoundError, ValidationError, handleError } from '@/lib/errors'

export async function createWorkout(type: WorkoutType, date: Date) {
  try {
    const dateOnly = createUTCDateAtNoon(date)
    
    // Check if there's already a workout of the same type on the same day
    const existing = await prisma.workout.findFirst({
      where: {
        userId: DEFAULT_USER_ID,
        date: dateOnly,
        type: type,
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
  } catch (error) {
    throw new DatabaseError('Failed to create workout')
  }
}

export async function getTodayWorkouts() {
  try {
    const dateOnly = getTodayUTC()
    
    return await prisma.workout.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        date: dateOnly,
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
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    throw new DatabaseError('Failed to fetch today\'s workouts')
  }
}

// Legacy function - returns the first workout of the day for compatibility
export async function getTodayWorkout() {
  const workouts = await getTodayWorkouts()
  return workouts[0] || null
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  try {
    if (!workoutId || !exerciseId) {
      throw new ValidationError('Workout ID and Exercise ID are required')
    }

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
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to add exercise to workout')
  }
}

export async function removeExerciseFromWorkout(workoutExerciseId: string) {
  try {
    if (!workoutExerciseId) {
      throw new ValidationError('Workout exercise ID is required')
    }

    return await prisma.workoutExercise.delete({
      where: { id: workoutExerciseId },
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to remove exercise from workout')
  }
}

export async function updateExerciseOrder(workoutId: string, exerciseId: string, newOrder: number) {
  try {
    if (!workoutId || !exerciseId || newOrder < 1) {
      throw new ValidationError('Invalid parameters for exercise reordering')
    }

    // Use a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Get all exercises for this workout
      const exercises = await tx.workoutExercise.findMany({
        where: { workoutId },
        orderBy: { order: 'asc' },
      })
      
      // Find the exercise being moved
      const movingExercise = exercises.find(ex => ex.id === exerciseId)
      if (!movingExercise) {
        throw new NotFoundError('Exercise not found in workout')
      }
      
      const oldOrder = movingExercise.order
      
      // Update orders
      if (oldOrder < newOrder) {
        // Moving down - decrease order of exercises in between
        await tx.workoutExercise.updateMany({
          where: {
            workoutId,
            order: {
              gt: oldOrder,
              lte: newOrder,
            },
          },
          data: {
            order: {
              decrement: 1,
            },
          },
        })
      } else if (oldOrder > newOrder) {
        // Moving up - increase order of exercises in between
        await tx.workoutExercise.updateMany({
          where: {
            workoutId,
            order: {
              gte: newOrder,
              lt: oldOrder,
            },
          },
          data: {
            order: {
              increment: 1,
            },
          },
        })
      }
      
      // Update the moved exercise
      await tx.workoutExercise.update({
        where: { id: exerciseId },
        data: { order: newOrder },
      })
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error
    throw new DatabaseError('Failed to update exercise order')
  }
}

export async function addSet(workoutExerciseId: string, reps: number, weight: number, rpe?: number, notes?: string) {
  try {
    if (!workoutExerciseId || reps < 0 || weight < 0) {
      throw new ValidationError('Invalid set parameters')
    }

    if (rpe !== undefined && (rpe < 1 || rpe > 10)) {
      throw new ValidationError('RPE must be between 1 and 10')
    }

    return await prisma.set.create({
      data: { workoutExerciseId, reps, weight, rpe, notes },
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to add set')
  }
}

export async function updateSet(setId: string, reps: number, weight: number, rpe?: number, notes?: string) {
  try {
    if (!setId || reps < 0 || weight < 0) {
      throw new ValidationError('Invalid set parameters')
    }

    if (rpe !== undefined && (rpe < 1 || rpe > 10)) {
      throw new ValidationError('RPE must be between 1 and 10')
    }

    return await prisma.set.update({
      where: { id: setId },
      data: { reps, weight, rpe, notes },
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to update set')
  }
}

export async function deleteSet(setId: string) {
  try {
    if (!setId) {
      throw new ValidationError('Set ID is required')
    }

    return await prisma.set.delete({
      where: { id: setId },
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to delete set')
  }
}

export async function logCardio(
  date: Date, 
  type: WorkoutType, 
  durationMinutes: number, 
  distanceKm?: number, 
  incline?: number,
  mode?: CardioMode,
  avgHeartRate?: number,
  notes?: string
) {
  try {
    if (durationMinutes <= 0) {
      throw new ValidationError('Duration must be greater than 0')
    }

    if (distanceKm !== undefined && distanceKm < 0) {
      throw new ValidationError('Distance cannot be negative')
    }

    if (avgHeartRate !== undefined && (avgHeartRate < 30 || avgHeartRate > 250)) {
      throw new ValidationError('Invalid heart rate')
    }

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
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to log cardio session')
  }
}

export async function getExerciseProgress(
  exerciseId: string, 
  startDate?: Date, 
  endDate?: Date
) {
  try {
    if (!exerciseId) {
      throw new ValidationError('Exercise ID is required')
    }

    const where: any = {
      workoutExercise: {
        exerciseId,
        workout: {
          userId: DEFAULT_USER_ID,
        },
      },
    }
    
    if (startDate || endDate) {
      where.workoutExercise.workout.date = {}
      if (startDate) where.workoutExercise.workout.date.gte = createUTCDateAtNoon(startDate)
      if (endDate) where.workoutExercise.workout.date.lte = createUTCDateAtNoon(endDate)
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
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to fetch exercise progress')
  }
}

export async function getLastWorkoutSets(exerciseId: string) {
  try {
    if (!exerciseId) {
      throw new ValidationError('Exercise ID is required')
    }

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
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to fetch last workout sets')
  }
}

export async function addCMJTest(workoutId: string, heightCm: number, notes?: string) {
  try {
    if (!workoutId) {
      throw new ValidationError('Workout ID is required')
    }

    if (heightCm <= 0 || heightCm > 200) {
      throw new ValidationError('Invalid jump height')
    }

    return await prisma.cMJTest.create({
      data: { workoutId, heightCm, notes },
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to add CMJ test')
  }
}

export async function getCMJHistory(days: number = 30) {
  try {
    if (days <= 0) {
      throw new ValidationError('Days must be greater than 0')
    }

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
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to fetch CMJ history')
  }
}

export async function getWorkoutsForMonth(startDate: Date, endDate: Date) {
  try {
    if (!startDate || !endDate) {
      throw new ValidationError('Start date and end date are required')
    }

    if (startDate > endDate) {
      throw new ValidationError('Start date must be before end date')
    }

    return await prisma.workout.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        date: {
          gte: createUTCDateAtNoon(startDate),
          lte: createUTCDateAtNoon(endDate),
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
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to fetch workouts for month')
  }
}

export async function getWorkoutById(workoutId: string) {
  try {
    if (!workoutId) {
      throw new ValidationError('Workout ID is required')
    }

    const workout = await prisma.workout.findUnique({
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

    if (!workout) {
      throw new NotFoundError('Workout not found')
    }

    return workout
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error
    throw new DatabaseError('Failed to fetch workout')
  }
}

export async function deleteWorkout(workoutId: string) {
  try {
    if (!workoutId) {
      throw new ValidationError('Workout ID is required')
    }

    return await prisma.workout.delete({
      where: { id: workoutId },
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to delete workout')
  }
}