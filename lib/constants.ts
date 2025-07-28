import { WorkoutType } from '@prisma/client'

// Workout type configurations
export const WORKOUT_TYPE_CONFIG = {
  [WorkoutType.PUSH]: {
    icon: '💪',
    color: 'from-blue-500 to-blue-600',
    label: 'Push',
  },
  [WorkoutType.PULL]: {
    icon: '🏋️',
    color: 'from-green-500 to-green-600',
    label: 'Pull',
  },
  [WorkoutType.LEGS]: {
    icon: '🦵',
    color: 'from-red-500 to-red-600',
    label: 'Legs',
  },
  [WorkoutType.CARDIO_Z2]: {
    icon: '🏃',
    color: 'from-yellow-500 to-yellow-600',
    label: 'Cardio Z2',
  },
  [WorkoutType.HIIT]: {
    icon: '⚡',
    color: 'from-orange-500 to-orange-600',
    label: 'HIIT',
  },
  [WorkoutType.PLYOMETRICS]: {
    icon: '🦘',
    color: 'from-purple-500 to-purple-600',
    label: 'Plyometrics',
  },
} as const

// RPE (Rate of Perceived Exertion) scale
export const RPE_SCALE = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Easy',
  4: 'Moderate',
  5: 'Moderate',
  6: 'Somewhat Hard',
  7: 'Hard',
  8: 'Hard',
  9: 'Very Hard',
  10: 'Maximum Effort',
} as const

// Validation constants
export const VALIDATION = {
  MIN_REPS: 0,
  MAX_REPS: 999,
  MIN_WEIGHT: 0,
  MAX_WEIGHT: 999,
  MIN_RPE: 1,
  MAX_RPE: 10,
  MIN_DURATION_MINUTES: 1,
  MAX_DURATION_MINUTES: 600,
  MIN_HEART_RATE: 30,
  MAX_HEART_RATE: 250,
  MIN_CMJ_HEIGHT: 0,
  MAX_CMJ_HEIGHT: 200,
} as const

// UI constants
export const UI = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  MAX_RECENT_WORKOUTS: 30,
  MAX_DISPLAY_TEMPLATES: 4,
  MAX_DISPLAY_RECENT: 6,
} as const