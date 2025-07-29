import type { AppState, Metric, Exercise, ExerciseCategory } from '~/types';

// Reducer for state management
export function appReducer(state: AppState, action: any): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view, selectedMetricId: action.metricId };
    
    case "ADD_METRIC":
      const newMetric: Metric = {
        id: action.metric.name.toLowerCase().replace(/\s+/g, "-"),
        ...action.metric,
        measurements: []
      };
      return {
        ...state,
        metrics: [...state.metrics, newMetric],
        view: "dashboard"
      };
    
    case "ADD_DAILY_MEASUREMENTS":
      return {
        ...state,
        metrics: state.metrics.map(metric => {
          const dailyValue = action.measurements[metric.id];
          if (dailyValue) {
            const newMeasurement = {
              date: action.date,
              value: parseFloat(dailyValue.value),
              notes: dailyValue.notes || undefined
            };
            return {
              ...metric,
              measurements: [...metric.measurements, newMeasurement].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              )
            };
          }
          return metric;
        })
      };
    
    case "ADD_EXERCISE":
      const newExercise: Exercise = {
        id: action.exercise.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
        ...action.exercise
      };
      return {
        ...state,
        exercises: [...state.exercises, newExercise]
      };
    
    case "ADD_EXERCISE_CATEGORY":
      const newCategory: ExerciseCategory = {
        id: action.category.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
        ...action.category
      };
      return {
        ...state,
        exerciseCategories: [...state.exerciseCategories, newCategory]
      };
    
    case "LOAD_DATA":
      return { 
        ...state, 
        metrics: action.metrics || state.metrics,
        exercises: action.exercises || state.exercises,
        exerciseCategories: action.exerciseCategories || state.exerciseCategories
      };
    
    default:
      return state;
  }
} 