import { useState, useEffect } from "react";
import type { AppState, AppDispatch, WorkoutSession, WorkoutExercise, ExerciseSet, CardioActivity, HIITRound, Exercise } from "~/types";
import { workoutTypes } from "~/data/defaults";

interface WorkoutActiveProps {
  state: AppState;
  dispatch: AppDispatch;
}

export function WorkoutActive({ state, dispatch }: WorkoutActiveProps) {
  const currentWorkout = state.currentWorkoutSession;
  const workoutTypeConfig = workoutTypes.find(wt => wt.id === state.selectedWorkoutType);
  
  // Check if we're editing an existing workout
  const isEditing = currentWorkout && state.workoutSessions.some(w => w.id === currentWorkout.id);
  
  // Live duration calculator
  const [currentDuration, setCurrentDuration] = useState(0);
  
  useEffect(() => {
    if (!currentWorkout?.startTime) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(currentWorkout.startTime).getTime();
      const minutes = Math.floor((now - start) / 1000 / 60);
      setCurrentDuration(minutes);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentWorkout?.startTime]);
  
  const formatLiveDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Helper function to get exercises by category
  const getExercisesByCategory = (category: string): Exercise[] => {
    return state.exercises.filter(exercise => exercise.category === category);
  };

  // Map workout types to exercise categories
  const getCategoryForWorkoutType = (workoutType: string): string => {
    const mapping = {
      'push': 'push-upper',
      'pull': 'pull-upper', 
      'legs': 'legs-glutes',
      'plyometrics': 'hiit-plio',
      'hiit': 'hiit-plio',
      'cardio': 'cardio'
    };
    return mapping[workoutType as keyof typeof mapping] || 'push-upper';
  };

  const availableExercises = getExercisesByCategory(
    getCategoryForWorkoutType(state.selectedWorkoutType || 'push')
  );

  // Initialize workout session if not exists
  useEffect(() => {
    if (!currentWorkout && state.selectedWorkoutType) {
      const session: WorkoutSession = {
        id: `workout-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        workoutType: state.selectedWorkoutType,
        startTime: new Date().toISOString(),
        exercises: [],
        cardioActivities: [],
        hiitRounds: [],
        completed: false
      };
      dispatch({ type: "START_WORKOUT_SESSION", session });
    }
  }, [currentWorkout, state.selectedWorkoutType, dispatch]);

  const addExerciseToWorkout = (exercise: Exercise) => {
    // Suggest reasonable starting weights based on exercise type
    const getStartingWeight = (exerciseName: string) => {
      const name = exerciseName.toLowerCase();
      if (name.includes('bench press')) return 60;
      if (name.includes('squat')) return 80;
      if (name.includes('deadlift') || name.includes('rdl')) return 70;
      if (name.includes('row')) return 40;
      if (name.includes('press') && (name.includes('overhead') || name.includes('shoulder'))) return 20;
      if (name.includes('curl')) return 15;
      if (name.includes('extension')) return 15;
      if (name.includes('lateral')) return 10;
      if (name.includes('dips')) return 0; // bodyweight
      if (name.includes('pull')) return 0; // bodyweight
      return 20; // default
    };

    const workoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [
        {
          setNumber: 1,
          reps: parseInt(exercise.reps?.split('-')[0] || '8'),
          weight: getStartingWeight(exercise.name),
          rpe: parseInt(exercise.rpe?.split('-')[0] || '5'),
          completed: false
        }
      ]
    };
    dispatch({ type: "ADD_EXERCISE_TO_SESSION", exercise: workoutExercise });
  };

  const addSetToExercise = (exerciseIndex: number) => {
    const exercise = currentWorkout?.exercises?.[exerciseIndex];
    if (exercise) {
      const newSet: ExerciseSet = {
        setNumber: exercise.sets.length + 1,
        reps: exercise.sets[exercise.sets.length - 1]?.reps || 8,
        weight: exercise.sets[exercise.sets.length - 1]?.weight || 0,
        rpe: exercise.sets[exercise.sets.length - 1]?.rpe || 5,
        completed: false
      };
      dispatch({ type: "ADD_SET_TO_EXERCISE", exerciseIndex, set: newSet });
    }
  };

  const updateSet = (exerciseIndex: number, setIndex: number, updates: Partial<ExerciseSet>) => {
    dispatch({ type: "UPDATE_SET", exerciseIndex, setIndex, updates });
  };

  const addCardioActivity = () => {
    const activity: CardioActivity = {
      id: `cardio-${Date.now()}`,
      name: "Nueva Actividad",
      duration: 30,
      intensity: 5
    };
    dispatch({ type: "ADD_CARDIO_ACTIVITY", activity });
  };

  const updateCardioActivity = (activityIndex: number, updates: Partial<CardioActivity>) => {
    dispatch({ type: "UPDATE_CARDIO_ACTIVITY", activityIndex, updates });
  };

  const removeExerciseFromWorkout = (exerciseIndex: number) => {
    dispatch({ type: "REMOVE_EXERCISE_FROM_SESSION", exerciseIndex });
  };

  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    dispatch({ type: "REMOVE_SET_FROM_EXERCISE", exerciseIndex, setIndex });
  };

  const removeCardioActivity = (activityIndex: number) => {
    dispatch({ type: "REMOVE_CARDIO_ACTIVITY", activityIndex });
  };

  const finishWorkout = () => {
    dispatch({ type: "FINISH_WORKOUT_SESSION" });
  };

  const cancelWorkout = () => {
    if (isEditing) {
      // If editing, reset to original state and go back to daily sheet
      dispatch({ type: "CANCEL_WORKOUT_EDIT" });
    } else {
      // If new workout, discard and go to dashboard
      dispatch({ type: "CANCEL_NEW_WORKOUT" });
    }
  };

  if (!currentWorkout) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🏋️</div>
          <p className="text-gray-600 dark:text-gray-400">Iniciando entrenamiento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{workoutTypeConfig?.icon}</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isEditing ? "Editando" : ""} {workoutTypeConfig?.name} Workout
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(currentWorkout.startTime).toLocaleTimeString()}
                  {isEditing && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">Editando</span>}
                  {!isEditing && currentDuration > 0 && (
                    <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                      ⏱️ {formatLiveDuration(currentDuration)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing && currentDuration > 0 && (
                <div className="text-right text-sm">
                  <p className="text-gray-600 dark:text-gray-400">Tiempo transcurrido</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatLiveDuration(currentDuration)}
                  </p>
                </div>
              )}
              <button
                onClick={finishWorkout}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                {isEditing ? "Guardar Cambios" : "Finalizar"}
              </button>
              <button
                onClick={cancelWorkout}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                {isEditing ? "Volver" : "Cancelar"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Strength Workouts (Push, Pull, Legs, Plyometrics) */}
        {(['push', 'pull', 'legs', 'plyometrics'].includes(state.selectedWorkoutType || '')) && (
          <div className="space-y-8">
            {/* Available Exercises */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Añadir Ejercicios
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExerciseToWorkout(exercise)}
                    className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {exercise.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.rpe && ` @ RPE ${exercise.rpe}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Exercises */}
            <div className="space-y-4">
              {currentWorkout.exercises?.map((exercise, exerciseIndex) => (
                <div key={`${exercise.exerciseId}-${exerciseIndex}`} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {exercise.exerciseName}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addSetToExercise(exerciseIndex)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        + Set
                      </button>
                      <button
                        onClick={() => removeExerciseFromWorkout(exerciseIndex)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                        title="Eliminar ejercicio"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-6 gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Set {set.setNumber}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Peso (kg)</label>
                          <input
                            type="number"
                            value={set.weight || ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, { weight: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reps</label>
                          <input
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, { reps: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">RPE</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={set.rpe || ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, { rpe: parseInt(e.target.value) || 1 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="5"
                          />
                        </div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={set.completed}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, { completed: e.target.checked })}
                            className="w-5 h-5 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
                          />
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => removeSetFromExercise(exerciseIndex, setIndex)}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                            title="Eliminar set"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cardio Workouts */}
        {state.selectedWorkoutType === 'cardio' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Actividades de Cardio
                </h2>
                <button
                  onClick={addCardioActivity}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  + Actividad
                </button>
              </div>

              <div className="space-y-4">
                {currentWorkout.cardioActivities?.map((activity, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg relative">
                    <button
                      onClick={() => removeCardioActivity(index)}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                      title="Eliminar actividad"
                    >
                      🗑️
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Actividad
                        </label>
                        <select
                          value={activity.name}
                          onChange={(e) => updateCardioActivity(index, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          {availableExercises.map(exercise => (
                            <option key={exercise.id} value={exercise.name}>
                              {exercise.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Duración (min)
                        </label>
                        <input
                          type="number"
                          value={activity.duration || ''}
                          onChange={(e) => updateCardioActivity(index, { duration: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Distancia (km)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={activity.distance || ''}
                          onChange={(e) => updateCardioActivity(index, { distance: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="5.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Intensidad (1-10)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={activity.intensity || ''}
                          onChange={(e) => updateCardioActivity(index, { intensity: parseInt(e.target.value) || 5 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="5"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Calorías
                        </label>
                        <input
                          type="number"
                          value={activity.calories || ''}
                          onChange={(e) => updateCardioActivity(index, { calories: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pulsaciones Promedio
                        </label>
                        <input
                          type="number"
                          value={activity.heartRate?.avg || ''}
                          onChange={(e) => updateCardioActivity(index, { 
                            heartRate: { ...activity.heartRate, avg: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="140"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pulsaciones Máximas
                        </label>
                        <input
                          type="number"
                          value={activity.heartRate?.max || ''}
                          onChange={(e) => updateCardioActivity(index, { 
                            heartRate: { ...activity.heartRate, max: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="170"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HIIT Workouts */}
        {state.selectedWorkoutType === 'hiit' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Configuración HIIT
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Los entrenamientos HIIT se configurarán en una futura actualización.
              Por ahora, puedes usar el timer existente para tus intervalos.
            </p>
            <button
              onClick={() => dispatch({ type: "SET_VIEW", view: "timer" })}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
            >
              Ir al Timer
            </button>
          </div>
        )}

        {/* Workout Times Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <span>⏰</span>
            <span>Tiempos del Entrenamiento</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Inicio
              </label>
              <input
                type="time"
                value={new Date(currentWorkout.startTime).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':');
                  const startDate = new Date(currentWorkout.startTime);
                  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  dispatch({ 
                    type: "UPDATE_WORKOUT_SESSION", 
                    updates: { startTime: startDate.toISOString() }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Fin
              </label>
              <div className="flex space-x-2">
                <input
                  type="time"
                  value={currentWorkout.endTime ? 
                    new Date(currentWorkout.endTime).toLocaleTimeString('en-GB', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      const [hours, minutes] = e.target.value.split(':');
                      const endDate = new Date(currentWorkout.startTime);
                      endDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                      
                      // If end time is before start time, assume it's the next day
                      if (endDate < new Date(currentWorkout.startTime)) {
                        endDate.setDate(endDate.getDate() + 1);
                      }
                      
                      const durationMinutes = Math.round((endDate.getTime() - new Date(currentWorkout.startTime).getTime()) / 1000 / 60);
                      
                      dispatch({ 
                        type: "UPDATE_WORKOUT_SESSION", 
                        updates: { 
                          endTime: endDate.toISOString(),
                          totalDuration: durationMinutes
                        }
                      });
                    } else {
                      dispatch({ 
                        type: "UPDATE_WORKOUT_SESSION", 
                        updates: { endTime: undefined, totalDuration: undefined }
                      });
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="No definido"
                />
                <button
                  onClick={() => {
                    const now = new Date();
                    const durationMinutes = Math.round((now.getTime() - new Date(currentWorkout.startTime).getTime()) / 1000 / 60);
                    
                    dispatch({ 
                      type: "UPDATE_WORKOUT_SESSION", 
                      updates: { 
                        endTime: now.toISOString(),
                        totalDuration: durationMinutes
                      }
                    });
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  title="Establecer como ahora"
                >
                  🕐
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración (minutos)
              </label>
              <input
                type="number"
                min="1"
                value={currentWorkout.totalDuration || ''}
                onChange={(e) => {
                  const duration = parseInt(e.target.value) || undefined;
                  let endTime = currentWorkout.endTime;
                  
                  // If we have a start time and duration, calculate end time
                  if (duration && currentWorkout.startTime) {
                    const startDate = new Date(currentWorkout.startTime);
                    const calculatedEndTime = new Date(startDate.getTime() + duration * 60 * 1000);
                    endTime = calculatedEndTime.toISOString();
                  }
                  
                  dispatch({ 
                    type: "UPDATE_WORKOUT_SESSION", 
                    updates: { 
                      totalDuration: duration,
                      endTime: endTime
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Ej: 60"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Tip:</strong> Puedes editar cualquiera de estos campos. Si cambias la duración, se calculará automáticamente la hora de fin.
              </p>
              {!isEditing && !currentWorkout.endTime && (
                <button
                  onClick={() => {
                    const now = new Date();
                    const durationMinutes = Math.round((now.getTime() - new Date(currentWorkout.startTime).getTime()) / 1000 / 60);
                    
                    dispatch({ 
                      type: "UPDATE_WORKOUT_SESSION", 
                      updates: { 
                        endTime: now.toISOString(),
                        totalDuration: durationMinutes > 0 ? durationMinutes : 1
                      }
                    });
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                >
                  <span>✅</span>
                  <span>Terminar ahora</span>
                </button>
              )}
            </div>
          </div>

          {/* Current Status */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">Inicio</p>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(currentWorkout.startTime).toLocaleTimeString('es-ES')}
              </p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">Fin</p>
              <p className="text-gray-600 dark:text-gray-400">
                {currentWorkout.endTime ? 
                  new Date(currentWorkout.endTime).toLocaleTimeString('es-ES') : 
                  'No definido'
                }
              </p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">Duración</p>
              <p className="text-gray-600 dark:text-gray-400">
                {currentWorkout.totalDuration ? 
                  `${currentWorkout.totalDuration} min` : 
                  'No definida'
                }
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}