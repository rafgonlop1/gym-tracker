import { useState, useEffect } from "react";
import type { AppState, AppDispatch, WorkoutSession, WorkoutExercise, ExerciseSet, CardioActivity, HIITRound, Exercise } from "~/types";
import { workoutTypes } from "~/data/defaults";
import { getDateString } from "~/utils/helpers";

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

  const primaryCategory = getCategoryForWorkoutType(state.selectedWorkoutType || 'push');
  const primaryExercises = getExercisesByCategory(primaryCategory);
  const otherExercises = state.exercises.filter(exercise => exercise.category !== primaryCategory);
  const availableExercises = [...primaryExercises, ...otherExercises];

  // Track which exercise history panels are open (by exercise index)
  const [openHistory, setOpenHistory] = useState<Record<string, boolean>>({});

  const toggleHistory = (key: string) => {
    setOpenHistory(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helpers to fetch previous history for an exercise
  const formatSetSummary = (sets: ExerciseSet[]): string => {
    if (!sets || sets.length === 0) return "—";
    return sets
      .map(s => `${(s.weight ?? 0)}×${s.reps ?? 0}${s.rpe ? `@${s.rpe}` : ''}`)
      .join(' • ');
  };

  const getRecentExerciseHistory = (exercise: WorkoutExercise, maxEntries = 5) => {
    // Sort completed sessions by start time desc
    const sessions = (state.workoutSessions || [])
      .filter(s => s.completed)
      .slice()
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const entries: { date: string; sets: ExerciseSet[] }[] = [];

    for (const session of sessions) {
      const match = session.exercises?.find(ex => (
        (exercise.exerciseId && ex.exerciseId === exercise.exerciseId) ||
        ex.exerciseName === exercise.exerciseName
      ));
      if (match) {
        entries.push({ date: session.date, sets: match.sets });
      }
      if (entries.length >= maxEntries) break;
    }

    return entries;
  };

  // State for exercise search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('none');
  const [recommendedLimit, setRecommendedLimit] = useState<number>(8);

  // When workout type changes, reset to idle (no list)
  useEffect(() => {
    setSelectedCategory('none');
    setSearchTerm('');
    setRecommendedLimit(8);
  }, [primaryCategory]);

  // Get unique categories
  const categories = Array.from(new Set(state.exercises.map(ex => ex.category)));

  // Filter exercises based on search and category
  const hasQuery = searchTerm.trim().length > 0;
  const filteredExercises = availableExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' 
      ? true 
      : selectedCategory === 'none' 
        ? false 
        : exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Views
  const isRecommendedView = !hasQuery && selectedCategory === primaryCategory;
  const isIdleView = !hasQuery && selectedCategory === 'none';
  const displayedExercises = isRecommendedView
    ? filteredExercises.slice(0, recommendedLimit)
    : filteredExercises;

  // Initialize workout session if not exists
  useEffect(() => {
    if (!currentWorkout && state.selectedWorkoutType) {
      const session: WorkoutSession = {
        id: `workout-${Date.now()}`,
        date: state.selectedDate || getDateString(),
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
    const defaultName = primaryExercises[0]?.name || "Treadmill Running";
    const activity: CardioActivity = {
      id: `cardio-${Date.now()}`,
      name: defaultName,
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

  // HIIT config local UI state (must be declared before any early return)
  const [hiitRoundsCount, setHiitRoundsCount] = useState<number>(8);
  const [hiitWorkTime, setHiitWorkTime] = useState<number>(20);
  const [hiitRestTime, setHiitRestTime] = useState<number>(10);

  useEffect(() => {
    if (currentWorkout?.hiitRounds && currentWorkout.hiitRounds.length > 0) {
      setHiitRoundsCount(currentWorkout.hiitRounds.length);
      setHiitWorkTime(currentWorkout.hiitRounds[0].workTime);
      setHiitRestTime(currentWorkout.hiitRounds[0].restTime);
    }
  }, [currentWorkout?.hiitRounds]);

  const totalHiitSeconds = hiitRoundsCount * (hiitWorkTime + hiitRestTime);
  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Auto-apply to session whenever values change
  useEffect(() => {
    if (!currentWorkout) return;
    dispatch({ type: "SET_HIIT_CONFIG", rounds: hiitRoundsCount, workTime: hiitWorkTime, restTime: hiitRestTime });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiitRoundsCount, hiitWorkTime, hiitRestTime]);

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2">
            <div className="flex items-start sm:items-center gap-3">
              <span className="text-2xl">{workoutTypeConfig?.icon}</span>
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {workoutTypeConfig?.name} Workout
                  </h1>
                  {isEditing && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">Editando</span>
                  )}
                </div>
                <div className="mt-1 flex items-center flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    {new Date(currentWorkout.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!isEditing && currentDuration > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      ⏱️ {formatLiveDuration(currentDuration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={finishWorkout}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                aria-label={isEditing ? 'Guardar cambios' : 'Finalizar entrenamiento'}
              >
                {isEditing ? "Guardar" : "Finalizar"}
              </button>
              <button
                onClick={cancelWorkout}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                aria-label={isEditing ? 'Volver' : 'Cancelar'}
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
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Añadir Ejercicios
                </h2>
                
                {/* Search and Filters */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar ejercicios..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="none">Selecciona una categoría…</option>
                      <option value={primaryCategory} className="font-semibold">⭐ {primaryCategory.replace('-', ' ').toUpperCase()} (Recomendado)</option>
                      <option value="all">Todas las categorías</option>
                      <option disabled>─────────────────</option>
                      {categories.filter(cat => cat !== primaryCategory).map(category => (
                        <option key={category} value={category}>
                          {category.replace('-', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {isIdleView && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 px-3 py-2 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Elige una categoría o busca para ver ejercicios.</span>
                    </div>
                  )}

                  {isRecommendedView && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        Mostrando {Math.min(recommendedLimit, filteredExercises.length)} de {filteredExercises.length} ejercicios recomendados para {workoutTypeConfig?.name}.
                      </span>
                      {filteredExercises.length > recommendedLimit && (
                        <button
                          onClick={() => setRecommendedLimit(l => l + 8)}
                          className="ml-auto text-blue-700 dark:text-blue-300 underline"
                        >
                          Ver más
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Exercise Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedExercises.map((exercise) => {
                  const isPrimary = exercise.category === primaryCategory;
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => addExerciseToWorkout(exercise)}
                      className={`p-4 text-left rounded-lg transition-all duration-200 relative overflow-hidden group ${
                        isPrimary
                          ? 'border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          : 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {isPrimary && (
                        <div className="absolute top-1 right-1">
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                            Recomendado
                          </span>
                        </div>
                      )}
                      
                      <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                        {exercise.name}
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <div>
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.rpe && ` @ RPE ${exercise.rpe}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                          <span className="capitalize">{exercise.category.replace('-', ' ')}</span>
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-500/10 dark:to-blue-400/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    </button>
                  );
                })}
              </div>
              
              {displayedExercises.length === 0 && (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No se encontraron ejercicios</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Intenta cambiar los filtros o el término de búsqueda.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory(primaryCategory);
                      setRecommendedLimit(8);
                    }}
                    className="mt-4 text-blue-500 hover:text-blue-600 text-sm"
                  >
                    Restablecer filtros
                  </button>
                </div>
              )}
            </div>

            {/* Current Exercises */}
            <div className="space-y-4">
              {currentWorkout.exercises?.map((exercise, exerciseIndex) => (
                <div key={`${exercise.exerciseId}-${exerciseIndex}`} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {exercise.exerciseName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleHistory(`${exercise.exerciseId}-${exerciseIndex}`)}
                        className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                      >
                        Historial
                      </button>
                      <button
                        onClick={() => addSetToExercise(exerciseIndex)}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-blue-600/90 hover:bg-blue-700 text-white text-xs shadow-sm"
                        aria-label="Añadir set"
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20">+</span>
                        <span>Set</span>
                      </button>
                      <button
                        onClick={() => removeExerciseFromWorkout(exerciseIndex)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-600/90 hover:bg-red-700 text-white text-xs shadow-sm"
                        title="Eliminar ejercicio"
                        aria-label="Eliminar ejercicio"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  </div>
                  {/* Inline last session summary */}
                  {(() => {
                    const history = getRecentExerciseHistory(exercise, 1);
                    if (history.length === 0) return null;
                    const last = history[0];
                    return (
                      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        Última vez ({new Date(last.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}): {formatSetSummary(last.sets)}
                      </div>
                    );
                  })()}
                  {/* Collapsible history list */}
                  {openHistory[`${exercise.exerciseId}-${exerciseIndex}`] && (
                    <div className="mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                      {(() => {
                        const history = getRecentExerciseHistory(exercise, 5);
                        if (history.length === 0) {
                          return <p className="text-xs text-gray-500 dark:text-gray-300">Sin historial previo.</p>;
                        }
                        return (
                          <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-200">
                            {history.map((h, idx) => (
                              <li key={idx} className="flex items-center justify-between">
                                <span className="text-gray-500 dark:text-gray-300">
                                  {new Date(h.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                                </span>
                                <span className="font-medium">{formatSetSummary(h.sets)}</span>
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Set {set.setNumber}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateSet(exerciseIndex, setIndex, { completed: !set.completed })}
                              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                                set.completed
                                  ? 'bg-green-600 text-white border-green-600'
                                  : 'bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                              }`}
                              aria-pressed={set.completed}
                              aria-label={`Mark set ${set.setNumber} as completed`}
                            >
                              {set.completed ? 'Done' : 'Marcar'}
                            </button>
                            <button
                              onClick={() => removeSetFromExercise(exerciseIndex, setIndex)}
                              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                              title="Eliminar set"
                              aria-label={`Eliminar set ${set.setNumber}`}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
                          <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Peso (kg)</label>
                            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                              <button
                                onClick={() => updateSet(exerciseIndex, setIndex, { weight: Math.max(0, (set.weight || 0) - 2.5) })}
                                className="w-8 h-8 grid place-items-center text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Decrease weight"
                              >
                                −
                              </button>
                              <input
                                inputMode="decimal"
                                type="number"
                                step="0.5"
                                value={set.weight ?? ''}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, { weight: parseFloat(e.target.value) || 0 })}
                                className="w-full h-8 px-2 text-center text-sm bg-transparent text-gray-900 dark:text-white"
                                placeholder="0"
                              />
                              <button
                                onClick={() => updateSet(exerciseIndex, setIndex, { weight: (set.weight || 0) + 2.5 })}
                                className="w-8 h-8 grid place-items-center text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Increase weight"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reps</label>
                            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                              <button
                                onClick={() => updateSet(exerciseIndex, setIndex, { reps: Math.max(0, (set.reps || 0) - 1) })}
                                className="w-8 h-8 grid place-items-center text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Decrease reps"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={set.reps ?? ''}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, { reps: parseInt(e.target.value) || 0 })}
                                className="w-full h-8 px-2 text-center text-sm bg-transparent text-gray-900 dark:text-white"
                                placeholder="0"
                              />
                              <button
                                onClick={() => updateSet(exerciseIndex, setIndex, { reps: (set.reps || 0) + 1 })}
                                className="w-8 h-8 grid place-items-center text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Increase reps"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">RPE</label>
                            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                              <button
                                onClick={() => updateSet(exerciseIndex, setIndex, { rpe: Math.max(1, (set.rpe || 1) - 1) })}
                                className="w-8 h-8 grid place-items-center text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Decrease RPE"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={set.rpe ?? ''}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, { rpe: parseInt(e.target.value) || 1 })}
                                className="w-full h-8 px-2 text-center text-sm bg-transparent text-gray-900 dark:text-white"
                                placeholder="5"
                              />
                              <button
                                onClick={() => updateSet(exerciseIndex, setIndex, { rpe: Math.min(10, (set.rpe || 1) + 1) })}
                                className="w-8 h-8 grid place-items-center text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Increase RPE"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick actions */}
                        {setIndex === exercise.sets.length - 1 && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => {
                                const last = exercise.sets[exercise.sets.length - 1];
                                const cloned = {
                                  setNumber: exercise.sets.length + 1,
                                  reps: last?.reps || 8,
                                  weight: last?.weight || 0,
                                  rpe: last?.rpe || 5,
                                  completed: false
                                } as ExerciseSet;
                                dispatch({ type: "ADD_SET_TO_EXERCISE", exerciseIndex, set: cloned });
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                            >
                              Duplicar último set
                            </button>
                            <button
                              onClick={() => addSetToExercise(exerciseIndex)}
                              className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs rounded-lg"
                            >
                              + Set
                            </button>
                          </div>
                        )}
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
                          {!primaryExercises.some(ex => ex.name === activity.name) && (
                            <option value={activity.name}>{activity.name}</option>
                          )}
                          {primaryExercises.map(exercise => (
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Configuración HIIT
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Define las series y tiempos. Puedes usar el <button onClick={() => dispatch({ type: "SET_VIEW", view: "timer" })} className="text-yellow-600 hover:underline">Timer Tabata</button> si prefieres.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Series</label>
                <input
                  type="number"
                  min={1}
                  value={hiitRoundsCount}
                  onChange={(e) => setHiitRoundsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trabajo (seg)</label>
                <input
                  type="number"
                  min={1}
                  value={hiitWorkTime}
                  onChange={(e) => setHiitWorkTime(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descanso (seg)</label>
                <input
                  type="number"
                  min={0}
                  value={hiitRestTime}
                  onChange={(e) => setHiitRestTime(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Tiempo estimado: <span className="font-medium">{formatSeconds(totalHiitSeconds)}</span> ({hiitRoundsCount} × {hiitWorkTime + hiitRestTime}s)
            </div>

            {/* Summary grid removed per request */}
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