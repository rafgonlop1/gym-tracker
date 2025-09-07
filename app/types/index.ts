// Types
export interface Measurement {
  date: string;
  value: number;
  notes?: string;
}

export interface Metric {
  id: string;
  name: string;
  unit: string;
  icon: string;
  color: string;
  targetType: "increase" | "decrease" | "lower" | "higher";
  target?: number;
  measurements: Measurement[];
}

export interface Exercise {
  id: string;
  name:string;
  category: string;
  sets?: string;
  reps?: string;
  rpe?: string;
  notes?: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  day?: string;
}

export type AppView = "dashboard" | "add-metric" | "manage-metrics" | "exercises" | "calendar" | "progress" | "timer" | "workout-selection" | "workout-active" | "templates";

export type WorkoutType = "push" | "pull" | "legs" | "plyometrics" | "hiit" | "cardio";

export interface WorkoutTypeConfig {
  id: WorkoutType;
  name: string;
  description: string;
  icon: string;
  color: string;
  estimatedDuration?: string;
}

export type TimerMode = "rest" | "tabata";

export interface TabataConfig {
  warmupTime: number;
  workTime: number;
  restTime: number;
  rounds: number;
}

export type TabataPhase = "warmup" | "work" | "rest" | "finished";

// Workout session types
export interface ExerciseSet {
  setNumber: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  completed: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  exerciseId?: string;
  exerciseName: string;
  sets: ExerciseSet[];
  restTime?: number; // in seconds
  notes?: string;
}

export interface CardioActivity {
  id: string;
  name: string;
  duration?: number; // in minutes
  distance?: number; // in km
  calories?: number;
  heartRate?: {
    avg?: number;
    max?: number;
  };
  intensity?: number; // 1-10 scale
  notes?: string;
}

export interface HIITRound {
  roundNumber: number;
  workTime: number; // in seconds
  restTime: number; // in seconds
  exercises: string[];
  intensity?: number; // 1-10 scale
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string;
  workoutType: WorkoutType;
  startTime: string;
  endTime?: string;
  exercises?: WorkoutExercise[]; // for push/pull/legs/plyometrics
  cardioActivities?: CardioActivity[]; // for cardio
  hiitRounds?: HIITRound[]; // for HIIT
  totalDuration?: number; // in minutes
  notes?: string;
  completed: boolean;
}

// Daily photo types
export type PhotoType = "front" | "back" | "side";

export interface DailyPhoto {
  id: string;
  type: PhotoType;
  dataUrl: string; // signed URL for display
  fileName?: string; // file path in storage for deletion
  timestamp: string; // ISO string
}

export interface DailyPhotos {
  date: string; // YYYY-MM-DD format
  photos: DailyPhoto[];
}

export interface WorkoutTemplate {
  id: string;
  user_id: string | null;
  name: string;
  workoutType: WorkoutType;
  exercises: WorkoutExercise[];
  description?: string;
}


export interface AppState {
  metrics: Metric[];
  exercises: Exercise[];
  exerciseCategories: ExerciseCategory[];
  view: AppView;
  selectedMetricId?: string;
  selectedWorkoutType?: WorkoutType;
  selectedDate?: string;
  currentWorkoutSession?: WorkoutSession;
  workoutSessions: WorkoutSession[];
  dailyPhotos: DailyPhotos[];
  templates: WorkoutTemplate[];
  lastWorkoutUpdate?: number;
}

export type AppDispatch = (action: any) => void;
