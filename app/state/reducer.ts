// app/state/reducer.ts
import type { AppState, Metric, Exercise, ExerciseCategory, WorkoutSession, WorkoutExercise, ExerciseSet, CardioActivity, DailyPhotos, DailyPhoto, WorkoutTemplate, HIITRound } from '~/types';
import { v4 as uuidv4 } from "uuid";

// Reducer for state management
export function appReducer(state: AppState, action: any): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view, selectedMetricId: action.metricId, selectedDate: action.selectedDate };
    
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
            
            // Check if measurement for this date already exists
            const existingIndex = metric.measurements.findIndex(m => m.date === action.date);
            let updatedMeasurements;
            
            if (existingIndex >= 0) {
              // Update existing measurement
              updatedMeasurements = [...metric.measurements];
              updatedMeasurements[existingIndex] = newMeasurement;
            } else {
              // Add new measurement
              updatedMeasurements = [...metric.measurements, newMeasurement];
            }
            
            return {
              ...metric,
              measurements: updatedMeasurements.sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              )
            };
          }
          return metric;
        })
      };
    
    case "DELETE_METRIC":
      return {
        ...state,
        metrics: state.metrics.filter(metric => metric.id !== action.metricId)
      };

    case "UPDATE_METRIC":
      return {
        ...state,
        metrics: state.metrics.map(metric =>
          metric.id === action.metricId ? { ...metric, ...action.updates } : metric
        )
      };
    
    case "DELETE_MEASUREMENT":
      return {
        ...state,
        metrics: state.metrics.map(metric => {
          if (metric.id === action.metricId) {
            return {
              ...metric,
              measurements: metric.measurements.filter(m => m.date !== action.date)
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
        exerciseCategories: action.exerciseCategories || state.exerciseCategories,
        workoutSessions: action.workoutSessions || state.workoutSessions,
        dailyPhotos: action.dailyPhotos || state.dailyPhotos || [],
        templates: action.templates || state.templates || [],
      };

    case 'LOAD_PUBLIC_DATA':
      return {
        ...state,
        exercises: action.exercises,
        exerciseCategories: action.exerciseCategories,
      };
    
    case "SELECT_WORKOUT_TYPE":
      return {
        ...state,
        selectedWorkoutType: action.workoutType,
        view: "workout-active"
      };
      case "START_WORKOUT_FROM_TEMPLATE":
        const { workoutType, exercises } = action.payload;
        const newSession: WorkoutSession = {
          id: uuidv4(),
          date: state.selectedDate || new Date().toISOString().split("T")[0],
          workoutType: workoutType,
          startTime: new Date().toISOString(),
          exercises: exercises,
          completed: false,
        };
        return {
          ...state,
          selectedWorkoutType: workoutType,
          currentWorkoutSession: newSession,
          view: "workout-active",
        };
    
    case "START_WORKOUT_SESSION":
      return {
        ...state,
        currentWorkoutSession: action.session
      };
    
    case "ADD_EXERCISE_TO_SESSION":
      if (!state.currentWorkoutSession) return state;
      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          exercises: [...(state.currentWorkoutSession.exercises || []), action.exercise]
        }
      };
    
    case "ADD_SET_TO_EXERCISE":
      if (!state.currentWorkoutSession?.exercises) return state;
      const updatedExercises = [...state.currentWorkoutSession.exercises];
      if (updatedExercises[action.exerciseIndex]) {
        updatedExercises[action.exerciseIndex] = {
          ...updatedExercises[action.exerciseIndex],
          sets: [...updatedExercises[action.exerciseIndex].sets, action.set]
        };
      }
      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          exercises: updatedExercises
        }
      };
    
    case "UPDATE_SET":
      if (!state.currentWorkoutSession?.exercises) return state;
      const exercisesWithUpdatedSet = [...state.currentWorkoutSession.exercises];
      if (exercisesWithUpdatedSet[action.exerciseIndex]?.sets[action.setIndex]) {
        exercisesWithUpdatedSet[action.exerciseIndex].sets[action.setIndex] = {
          ...exercisesWithUpdatedSet[action.exerciseIndex].sets[action.setIndex],
          ...action.updates
        };
      }
      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          exercises: exercisesWithUpdatedSet
        }
      };
    
    case "ADD_CARDIO_ACTIVITY":
      if (!state.currentWorkoutSession) return state;
      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          cardioActivities: [...(state.currentWorkoutSession.cardioActivities || []), action.activity]
        }
      };
    
    case "UPDATE_CARDIO_ACTIVITY":
      if (!state.currentWorkoutSession?.cardioActivities) return state;
      const updatedActivities = [...state.currentWorkoutSession.cardioActivities];
      if (updatedActivities[action.activityIndex]) {
        updatedActivities[action.activityIndex] = {
          ...updatedActivities[action.activityIndex],
          ...action.updates
        };
      }
      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          cardioActivities: updatedActivities
        }
      };

    case "SET_HIIT_CONFIG": {
      if (!state.currentWorkoutSession) return state;
      const roundsCount: number = Math.max(1, parseInt(action.rounds) || 1);
      const workTime: number = Math.max(1, parseInt(action.workTime) || 1);
      const restTime: number = Math.max(0, parseInt(action.restTime) || 0);

      const hiitRounds: HIITRound[] = Array.from({ length: roundsCount }, (_, idx) => ({
        roundNumber: idx + 1,
        workTime,
        restTime,
        exercises: [],
        completed: false
      }));

      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          hiitRounds
        }
      };
    }

    case "UPDATE_HIIT_ROUND": {
      if (!state.currentWorkoutSession?.hiitRounds) return state;
      const index: number = action.roundIndex;
      if (index < 0 || index >= state.currentWorkoutSession.hiitRounds.length) return state;
      const updatedRounds = [...state.currentWorkoutSession.hiitRounds];
      updatedRounds[index] = {
        ...updatedRounds[index],
        ...action.updates
      } as HIITRound;

      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          hiitRounds: updatedRounds
        }
      };
    }
    
    case "FINISH_WORKOUT_SESSION":
      if (!state.currentWorkoutSession) return state;
      
      // Use manual times if set, otherwise calculate automatically
      let finalEndTime = state.currentWorkoutSession.endTime;
      let finalDuration = state.currentWorkoutSession.totalDuration;
      
      // If no manual end time, set to now
      if (!finalEndTime) {
        finalEndTime = new Date().toISOString();
      }
      
      // If no manual duration, calculate from start/end times
      if (!finalDuration && finalEndTime) {
        finalDuration = Math.round(
          (new Date(finalEndTime).getTime() - new Date(state.currentWorkoutSession.startTime).getTime()) / 1000 / 60
        );
      }
      
      // Ensure minimum duration
      if (!finalDuration || finalDuration <= 0) {
        finalDuration = 1;
      }
      
      const finishedSession: WorkoutSession = {
        ...state.currentWorkoutSession,
        endTime: finalEndTime,
        completed: true,
        totalDuration: finalDuration
      };
      
      // Check if we're editing an existing workout
      const isEditing = state.workoutSessions.some(w => w.id === state.currentWorkoutSession!.id);
      
      return {
        ...state,
        workoutSessions: isEditing 
          ? state.workoutSessions.map(w => w.id === finishedSession.id ? finishedSession : w)
          : [...state.workoutSessions, finishedSession],
        currentWorkoutSession: undefined,
        selectedWorkoutType: undefined,
        selectedDate: undefined,
        view: "dashboard",
        lastWorkoutUpdate: Date.now() // Add timestamp to trigger updates
      };
    
    case "EDIT_WORKOUT_SESSION":
      const workoutToEdit = state.workoutSessions.find(w => w.id === action.workoutId);
      if (!workoutToEdit) return state;
      
      return {
        ...state,
        currentWorkoutSession: { ...workoutToEdit },
        selectedWorkoutType: workoutToEdit.workoutType,
        view: "workout-active"
      };
    
    case "UPDATE_WORKOUT_SESSION":
      if (!state.currentWorkoutSession) return state;
      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          ...action.updates
        }
      };

    case "REPLACE_WORKOUT_SESSION_ID": {
      const { localId, dbId } = action;
      return {
        ...state,
        workoutSessions: state.workoutSessions.map(w =>
          w.id === localId ? { ...w, id: dbId } : w
        )
      };
    }
    
    case "DELETE_WORKOUT_SESSION":
      console.log('DELETE_WORKOUT_SESSION action triggered for ID:', action.workoutId);
      console.log('Current workout sessions:', state.workoutSessions.map(w => w.id));
      const filteredSessions = state.workoutSessions.filter(w => w.id !== action.workoutId);
      console.log('After deletion:', filteredSessions.map(w => w.id));
      return {
        ...state,
        workoutSessions: filteredSessions,
        lastWorkoutUpdate: Date.now() // Add timestamp to trigger database sync
      };
    
    case "REMOVE_EXERCISE_FROM_SESSION":
      if (!state.currentWorkoutSession?.exercises) return state;
      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          exercises: state.currentWorkoutSession.exercises.filter((_, index) => index !== action.exerciseIndex)
        }
      };
    
    case "REMOVE_SET_FROM_EXERCISE":
      if (!state.currentWorkoutSession?.exercises) return state;
      const exercisesWithRemovedSet = [...state.currentWorkoutSession.exercises];
      if (exercisesWithRemovedSet[action.exerciseIndex]) {
        exercisesWithRemovedSet[action.exerciseIndex] = {
          ...exercisesWithRemovedSet[action.exerciseIndex],
          sets: exercisesWithRemovedSet[action.exerciseIndex].sets
            .filter((_, index) => index !== action.setIndex)
            .map((set, index) => ({ ...set, setNumber: index + 1 })) // Renumber sets
        };
      }
      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          exercises: exercisesWithRemovedSet
        }
      };
    
    case "REMOVE_CARDIO_ACTIVITY":
      if (!state.currentWorkoutSession?.cardioActivities) return state;
      return {
        ...state,
        currentWorkoutSession: {
          ...state.currentWorkoutSession,
          cardioActivities: state.currentWorkoutSession.cardioActivities.filter((_, index) => index !== action.activityIndex)
        }
      };
    
    case "CANCEL_WORKOUT_EDIT":
      return {
        ...state,
        currentWorkoutSession: undefined,
        selectedWorkoutType: undefined,
        selectedDate: undefined,
        view: "dashboard"
      };
    
    case "CANCEL_NEW_WORKOUT":
      return {
        ...state,
        currentWorkoutSession: undefined,
        selectedWorkoutType: undefined,
        selectedDate: undefined,
        view: "dashboard"
      };
    
    case "ADD_DAILY_PHOTOS":
      const existingDayPhotos = state.dailyPhotos.find(dp => dp.date === action.date);
      
      if (existingDayPhotos) {
        // Update existing day photos, avoiding duplicates by type
        const updatedPhotos = [
          // Keep existing photos that don't conflict with new ones
          ...existingDayPhotos.photos.filter(existingPhoto => 
            !action.photos.some((newPhoto: DailyPhoto) => newPhoto.type === existingPhoto.type)
          ),
          // Add all new photos
          ...action.photos
        ];
        
        return {
          ...state,
          dailyPhotos: state.dailyPhotos.map(dp => 
            dp.date === action.date 
              ? { ...dp, photos: updatedPhotos }
              : dp
          )
        };
      } else {
        // Create new day photos
        const newDayPhotos: DailyPhotos = {
          date: action.date,
          photos: action.photos
        };
        
        return {
          ...state,
          dailyPhotos: [...state.dailyPhotos, newDayPhotos].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        };
      }
    
    case "UPDATE_DAILY_PHOTO":
      return {
        ...state,
        dailyPhotos: state.dailyPhotos.map(dp => 
          dp.date === action.date 
            ? {
                ...dp,
                photos: dp.photos.map(photo => 
                  photo.id === action.photoId 
                    ? { ...photo, ...action.updates }
                    : photo
                )
              }
            : dp
        )
      };
    
    case "DELETE_DAILY_PHOTO":
      return {
        ...state,
        dailyPhotos: state.dailyPhotos.map(dp => 
          dp.date === action.date 
            ? {
                ...dp,
                photos: dp.photos.filter(photo => photo.id !== action.photoId)
              }
            : dp
        ).filter(dp => dp.photos.length > 0) // Remove empty photo days
      };
    
    case "REPLACE_DAILY_PHOTO":
      return {
        ...state,
        dailyPhotos: state.dailyPhotos.map(dp => 
          dp.date === action.date 
            ? {
                ...dp,
                photos: dp.photos.map(photo => 
                  photo.type === action.photoType 
                    ? action.newPhoto
                    : photo
                )
              }
            : dp
        )
      };
    
      case "LOAD_TEMPLATES":
      return {
        ...state,
        templates: action.payload.templates,
      };
    
    case "CREATE_TEMPLATE":
      const newTemplate: WorkoutTemplate = {
        ...action.payload.template,
        id: uuidv4(),
      };
      return {
        ...state,
        templates: [...state.templates, newTemplate],
      };

    case "UPDATE_TEMPLATE":
      return {
        ...state,
        templates: state.templates.map(t =>
          t.id === action.payload.template.id ? action.payload.template : t
        ),
      };

    case "DELETE_TEMPLATE":
      return {
        ...state,
        templates: state.templates.filter(
          t => t.id !== action.payload.templateId
        ),
      };

    default:
      return state;
  }
}
