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
  measurements: Measurement[];
  target?: number;
  targetType?: "lower" | "higher" | "maintain";
}

export interface Exercise {
  id: string;
  name: string;
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

export interface AppState {
  metrics: Metric[];
  exercises: Exercise[];
  exerciseCategories: ExerciseCategory[];
  view: "dashboard" | "add-metric" | "progress" | "daily-sheet" | "exercises" | "calendar";
  selectedMetricId?: string;
} 