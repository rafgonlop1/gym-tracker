import type { Metric, ExerciseCategory, Exercise } from '~/types';

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
  { id: "push-upper", name: "Push Upper", day: "Lunes" },
  { id: "pull-upper", name: "Pull Upper", day: "Miércoles" },
  { id: "legs-glutes", name: "Legs & Glutes", day: "Jueves" },
  { id: "hiit-plio", name: "HIIT / Pliometría", day: "Sábado" }
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

  // HIIT / Pliometría (Sábado)
  { id: "med-ball-chest-pass", name: "Med-Ball Chest Pass (de pie)", category: "hiit-plio", sets: "4", reps: "8" },
  { id: "box-jump", name: "Box Jump", category: "hiit-plio", sets: "4", reps: "5" },
  { id: "depth-jump", name: "Depth Jump", category: "hiit-plio", sets: "3", reps: "5" },
  { id: "explosive-bulgarian", name: "Explosive Bulgarian Split", category: "hiit-plio", sets: "3", reps: "6", notes: "c/pierna" }
]; 