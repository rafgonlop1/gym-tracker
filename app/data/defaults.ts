import type { Metric, ExerciseCategory, Exercise, WorkoutTypeConfig } from '~/types';

// Initial data
export const defaultMetrics: Metric[] = [
  {
    id: "peso",
    name: "Peso",
    unit: "kg",
    icon: "⚖️",
    color: "blue",
    target: 73,
    targetType: "lower",
    measurements: [
      { date: "2025-07-25", value: 74.8 },
      { date: "2025-07-27", value: 74.5 },
      { date: "2025-07-28", value: 74.2 },
      { date: "2025-07-30", value: 73.9 },
      { date: "2025-07-31", value: 73.6 },
    ]
  },
  {
    id: "cintura",
    name: "Cintura",
    unit: "cm",
    icon: "📏",
    color: "green",
    target: 80,
    targetType: "lower",
    measurements: [
      { date: "2025-07-25", value: 83 },
      { date: "2025-07-27", value: 82.5 },
      { date: "2025-07-28", value: 82 },
      { date: "2025-07-30", value: 81.5 },
      { date: "2025-07-31", value: 81 },
    ]
  },
  {
    id: "rpe-lumbar",
    name: "RPE Lumbar",
    unit: "/10",
    icon: "🏃",
    color: "orange",
    target: 2,
    targetType: "lower",
    measurements: [
      { date: "2025-07-25", value: 4 },
      { date: "2025-07-27", value: 3 },
      { date: "2025-07-28", value: 3 },
      { date: "2025-07-30", value: 2 },
      { date: "2025-07-31", value: 2 },
    ]
  }
];

// Initial exercise categories
export const defaultExerciseCategories: ExerciseCategory[] = [
  { id: "push-upper", name: "Push Upper" },
  { id: "pull-upper", name: "Pull Upper" },
  { id: "legs-glutes", name: "Legs & Glutes" },
  { id: "hiit-plio", name: "HIIT & Pliometría" },
  { id: "cardio", name: "Cardio" }
];

// Initial exercises
export const defaultExercises: Exercise[] = [
  // Push Upper (Lunes)
  { id: "bench-press", name: "Bench Press", category: "push-upper", sets: "3", reps: "8", rpe: "6-7" },
  { id: "incline-db-press", name: "Incline DB Press", category: "push-upper", sets: "3", reps: "10" },
  { id: "overhead-press", name: "Overhead Press (mancuerna, sentado 80°)", category: "push-upper", sets: "3", reps: "8-10" },
  { id: "weighted-dips", name: "Weighted Dips", category: "push-upper", sets: "3", reps: "8-12" },
  { id: "lateral-raise", name: "Lateral Raise", category: "push-upper", sets: "3", reps: "15" },
  { id: "rope-triceps", name: "Rope Triceps Press-down", category: "push-upper", sets: "3", reps: "15" },
  { id: "overhead-triceps", name: "Overhead DB Triceps Extension", category: "push-upper", sets: "2", reps: "12-15", notes: "Accesorio extra" },

  // Pull Upper (Miércoles)
  { id: "weighted-pullups", name: "Weighted Pull-Ups", category: "pull-upper", sets: "3", reps: "8" },
  { id: "single-arm-row", name: "Single-Arm DB Row (con apoyo)", category: "pull-upper", sets: "3", reps: "10" },
  { id: "chest-supported-row", name: "Chest-Supported Row", category: "pull-upper", sets: "3", reps: "8-10" },
  { id: "face-pull", name: "Face Pull", category: "pull-upper", sets: "3", reps: "15" },
  { id: "inverted-row", name: "Inverted Row", category: "pull-upper", sets: "2", reps: "12" },
  { id: "ez-bar-curl", name: "EZ-Bar Curl", category: "pull-upper", sets: "3", reps: "10-12" },
  { id: "hammer-curl", name: "Hammer Curl", category: "pull-upper", sets: "3", reps: "12-15" },
  { id: "incline-db-curl", name: "Incline DB Curl", category: "pull-upper", sets: "2", reps: "12-15", notes: "Accesorio extra" },

  // Legs & Glutes (Jueves)
  { id: "back-squat", name: "Back Squat o Safety-Bar Squat", category: "legs-glutes", sets: "3", reps: "8", rpe: "6-7" },
  { id: "dumbbell-rdl", name: "Dumbbell RDL", category: "legs-glutes", sets: "3", reps: "8-10", notes: "Bisagra sin compresión axial" },
  { id: "hip-thrust", name: "Hip Thrust", category: "legs-glutes", sets: "3", reps: "10" },
  { id: "bulgarian-split", name: "Bulgarian Split Squat", category: "legs-glutes", sets: "3", reps: "10", notes: "c/pierna" },
  { id: "leg-extension", name: "Leg Extension", category: "legs-glutes", sets: "2", reps: "15" },
  { id: "lying-leg-curl", name: "Lying Leg Curl", category: "legs-glutes", sets: "2", reps: "15" },
  { id: "machine-abductor", name: "Machine Abductor", category: "legs-glutes", sets: "2", reps: "15" },
  { id: "hollow-body-hold", name: "Hollow Body Hold", category: "legs-glutes", sets: "3", reps: "20 s" },

  // HIIT & Pliometría
  { id: "burpees", name: "Burpees", category: "hiit-plio", sets: "4", reps: "30 s" },
  { id: "jump-squats", name: "Jump Squats", category: "hiit-plio", sets: "4", reps: "45 s" },
  { id: "mountain-climbers", name: "Mountain Climbers", category: "hiit-plio", sets: "4", reps: "30 s" },
  { id: "box-jumps", name: "Box Jumps", category: "hiit-plio", sets: "3", reps: "10" },
  { id: "high-knees", name: "High Knees", category: "hiit-plio", sets: "4", reps: "30 s" },
  { id: "jump-lunges", name: "Jump Lunges", category: "hiit-plio", sets: "3", reps: "20", notes: "c/pierna" },
  { id: "plyo-pushups", name: "Plyo Push-ups", category: "hiit-plio", sets: "3", reps: "8-12" },
  { id: "battle-ropes", name: "Battle Ropes", category: "hiit-plio", sets: "4", reps: "30 s" },

  // Cardio
  { id: "treadmill-run", name: "Treadmill Running", category: "cardio", sets: "1", reps: "30 min" },
  { id: "elliptical", name: "Elliptical", category: "cardio", sets: "1", reps: "25 min" },
  { id: "stationary-bike", name: "Stationary Bike", category: "cardio", sets: "1", reps: "30 min" },
  { id: "rowing-machine", name: "Rowing Machine", category: "cardio", sets: "1", reps: "20 min" },
  { id: "outdoor-run", name: "Outdoor Running", category: "cardio", sets: "1", reps: "5-10 km" },
  { id: "swimming", name: "Swimming", category: "cardio", sets: "1", reps: "30 min" },
  { id: "stair-climber", name: "Stair Climber", category: "cardio", sets: "1", reps: "20 min" }
];

// Workout type configurations
export const workoutTypes: WorkoutTypeConfig[] = [
  {
    id: "push",
    name: "Push",
    description: "Entrenamiento de empuje - Pecho, hombros y tríceps",
    icon: "💪",
    color: "red",
    estimatedDuration: "60-75 min"
  },
  {
    id: "pull",
    name: "Pull", 
    description: "Entrenamiento de tracción - Espalda y bíceps",
    icon: "🎯",
    color: "blue",
    estimatedDuration: "60-75 min"
  },
  {
    id: "legs",
    name: "Legs",
    description: "Entrenamiento de piernas y glúteos",
    icon: "🦵",
    color: "green",
    estimatedDuration: "75-90 min"
  },
  {
    id: "plyometrics",
    name: "Pliometría",
    description: "Entrenamiento de fuerza explosiva y potencia",
    icon: "🚀",
    color: "purple",
    estimatedDuration: "30-40 min"
  },
  {
    id: "hiit",
    name: "HIIT",
    description: "Entrenamiento de alta intensidad por intervalos",
    icon: "⚡",
    color: "orange",
    estimatedDuration: "20-30 min"
  },
  {
    id: "cardio",
    name: "Cardio",
    description: "Entrenamiento cardiovascular y resistencia",
    icon: "❤️",
    color: "pink",
    estimatedDuration: "30-60 min"
  }
];
