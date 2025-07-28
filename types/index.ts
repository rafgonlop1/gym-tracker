import { Prisma } from '@prisma/client'

// Workout with all relations
export type WorkoutWithRelations = Prisma.WorkoutGetPayload<{
  include: {
    exercises: {
      include: {
        exercise: true
        sets: true
      }
    }
    cardio: true
    cmjTests: true
  }
}>

// WorkoutExercise with all relations
export type WorkoutExerciseWithRelations = Prisma.WorkoutExerciseGetPayload<{
  include: {
    exercise: true
    sets: true
  }
}>

// Template with all relations
export type TemplateWithRelations = Prisma.WorkoutTemplateGetPayload<{
  include: {
    exercises: {
      include: {
        exercise: true
      }
    }
  }
}>

// Set with all relations
export type SetWithRelations = Prisma.SetGetPayload<{
  include: {
    workoutExercise: {
      include: {
        exercise: true
        workout: true
      }
    }
  }
}>

// API Response types
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code: string }

// Form data types
export interface SetFormData {
  reps: number
  weight: number
  rpe?: number
  notes?: string
}

export interface CardioFormData {
  durationMinutes: number
  distanceKm?: number
  incline?: number
  mode?: string
  avgHeartRate?: number
  notes?: string
}

export interface CMJTestFormData {
  heightCm: number
  notes?: string
}