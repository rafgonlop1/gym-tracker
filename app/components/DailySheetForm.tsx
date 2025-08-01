import { useState, useEffect } from "react";
import type { AppState, Metric, WorkoutSession } from "~/types";
import { getColorClasses, getLatestValue, getDateString } from "~/utils/helpers";
import { workoutTypes } from "~/data/defaults";
import { PhotoUpload } from "./PhotoUpload";
import { createSupabaseClient } from "~/lib/supabase.client";
import { DatabaseService } from "~/services/database";
import { useAuth } from "~/hooks/useAuth";

interface DailySheetFormProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

export const DailySheetForm = ({ state, dispatch }: DailySheetFormProps) => {
  const { user } = useAuth();
  const today = getDateString();
  const [date, setDate] = useState(today);
  const [measurements, setMeasurements] = useState<{[key: string]: {value: string, notes: string}}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Load measurements for selected date
  const loadMeasurementsForDate = (selectedDate: string) => {
    return state.metrics.reduce((acc, metric) => {
      const dateMeasurement = metric.measurements.find(m => m.date === selectedDate);
      if (dateMeasurement) {
        acc[metric.id] = {
          value: dateMeasurement.value.toString(),
          notes: dateMeasurement.notes || ""
        };
      }
      return acc;
    }, {} as {[key: string]: {value: string, notes: string}});
  };

  useEffect(() => {
    setMeasurements(loadMeasurementsForDate(date));
  }, [date, state.metrics]);

  const handleValueChange = (metricId: string, field: 'value' | 'notes', value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("Debes estar logueado para guardar mediciones");
      return;
    }

    const validMeasurements = Object.fromEntries(
      Object.entries(measurements).filter(([_, data]) => data.value.trim() !== "")
    );
    
    if (Object.keys(validMeasurements).length === 0) {
      // Always go back to dashboard if no measurements
      dispatch({ type: "SET_VIEW", view: "dashboard" });
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      const supabase = createSupabaseClient();
      const db = new DatabaseService(supabase);
      
      // Save each measurement to database
      const promises = Object.entries(validMeasurements).map(([metricId, data]) => {
        return db.addMeasurement(metricId, date, parseFloat(data.value), data.notes || undefined);
      });
      
      await Promise.all(promises);
      
      // Then update local state
      dispatch({
        type: "ADD_DAILY_MEASUREMENTS",
        date,
        measurements: validMeasurements
      });
      
      // Go back to dashboard
      dispatch({ type: "SET_VIEW", view: "dashboard" });
      
    } catch (error) {
      console.error('Error saving measurements:', error);
      console.log('Measurements data being sent:', validMeasurements);
      console.log('Current metrics:', state.metrics);
      setError("Error al guardar las mediciones. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyValue = Object.values(measurements).some(m => m?.value?.trim());

  // Get workouts for selected date
  const dayWorkouts = state.workoutSessions.filter(session => 
    session.date === date && session.completed
  );

  // Get photos for selected date
  const dayPhotos = state.dailyPhotos.find(dp => dp.date === date)?.photos || [];

  const getWorkoutIcon = (workoutType: string) => {
    const config = workoutTypes.find(wt => wt.id === workoutType);
    return config?.icon || "🏋️";
  };

  const getWorkoutName = (workoutType: string) => {
    const config = workoutTypes.find(wt => wt.id === workoutType);
    return config?.name || workoutType;
  };

  const formatDuration = (minutes?: number, startTime?: string, endTime?: string) => {
    // If we have explicit duration, use it
    if (minutes && minutes > 0) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        return `${hours}h ${mins}min`;
      }
      return `${mins}min`;
    }
    
    // If we have start and end time, calculate duration
    if (startTime && endTime) {
      const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
      const calculatedMinutes = Math.round(durationMs / 1000 / 60);
      const hours = Math.floor(calculatedMinutes / 60);
      const mins = calculatedMinutes % 60;
      if (hours > 0) {
        return `${hours}h ${mins}min`;
      }
      return `${mins}min`;
    }
    
    return "N/A";
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            📋 Ficha Diaria
          </h3>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Workouts Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <span>🏋️</span>
              <span>Entrenamientos del Día</span>
              <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                {dayWorkouts.length}
              </span>
            </h4>
            
            {dayWorkouts.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tiempo total: {formatDuration(
                    dayWorkouts.reduce((total, w) => {
                      if (w.totalDuration) return total + w.totalDuration;
                      if (w.startTime && w.endTime) {
                        const duration = Math.round((new Date(w.endTime).getTime() - new Date(w.startTime).getTime()) / 1000 / 60);
                        return total + duration;
                      }
                      return total;
                    }, 0)
                  )}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {dayWorkouts.length} sesion{dayWorkouts.length !== 1 ? 'es' : ''} completada{dayWorkouts.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {dayWorkouts.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                No hay entrenamientos registrados para este día
              </p>
              <button
                onClick={() => dispatch({ type: "SET_VIEW", view: "workout-selection" })}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Iniciar Entrenamiento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dayWorkouts.map((workout, index) => (
                <div key={workout.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getWorkoutIcon(workout.workoutType)}</span>
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">
                          {getWorkoutName(workout.workoutType)} Workout
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(workout.startTime)} 
                          {workout.endTime && ` - ${formatTime(workout.endTime)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDuration(workout.totalDuration, workout.startTime, workout.endTime)}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Completado
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          dispatch({ type: "EDIT_WORKOUT_SESSION", workoutId: workout.id });
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                        title="Editar entrenamiento"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("¿Estás seguro de que quieres eliminar este entrenamiento?")) {
                            dispatch({ type: "DELETE_WORKOUT_SESSION", workoutId: workout.id });
                          }
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                        title="Eliminar entrenamiento"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Workout Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* Strength workouts */}
                    {workout.exercises && workout.exercises.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ejercicios: {workout.exercises.length}
                        </p>
                        <div className="space-y-1">
                          {workout.exercises.slice(0, 3).map((exercise, idx) => (
                            <p key={idx} className="text-gray-600 dark:text-gray-400 text-xs">
                              • {exercise.exerciseName} ({exercise.sets.length} sets)
                            </p>
                          ))}
                          {workout.exercises.length > 3 && (
                            <p className="text-gray-500 dark:text-gray-500 text-xs">
                              + {workout.exercises.length - 3} más...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cardio workouts */}
                    {workout.cardioActivities && workout.cardioActivities.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Actividades: {workout.cardioActivities.length}
                        </p>
                        <div className="space-y-1">
                          {workout.cardioActivities.slice(0, 2).map((activity, idx) => (
                            <p key={idx} className="text-gray-600 dark:text-gray-400 text-xs">
                              • {activity.name}
                              {activity.duration && ` (${activity.duration}min)`}
                              {activity.distance && ` - ${activity.distance}km`}
                            </p>
                          ))}
                          {workout.cardioActivities.length > 2 && (
                            <p className="text-gray-500 dark:text-gray-500 text-xs">
                              + {workout.cardioActivities.length - 2} más...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Total sets/volume for strength */}
                    {workout.exercises && workout.exercises.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Volumen Total
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)} sets
                        </p>
                        {(() => {
                          const totalVolume = workout.exercises.reduce((total, ex) => 
                            total + ex.sets.reduce((setTotal, set) => 
                              setTotal + (set.weight || 0) * (set.reps || 0), 0
                            ), 0
                          );
                          const completedSets = workout.exercises.reduce((total, ex) => 
                            total + ex.sets.filter(set => set.completed).length, 0
                          );
                          const totalSets = workout.exercises.reduce((total, ex) => total + ex.sets.length, 0);
                          
                          return (
                            <>
                              <p className="text-gray-600 dark:text-gray-400 text-xs">
                                {totalVolume > 0 ? `${totalVolume.toFixed(0)} kg total` : "Sin peso registrado"}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-xs">
                                {completedSets}/{totalSets} sets completados
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Cardio totals */}
                    {workout.cardioActivities && workout.cardioActivities.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Totales Cardio
                        </p>
                        {workout.cardioActivities.some(a => a.distance) && (
                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                            {workout.cardioActivities.reduce((total, a) => total + (a.distance || 0), 0).toFixed(1)} km
                          </p>
                        )}
                        {workout.cardioActivities.some(a => a.calories) && (
                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                            {workout.cardioActivities.reduce((total, a) => total + (a.calories || 0), 0)} cal
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {workout.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📝 {workout.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metrics Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <span>📊</span>
            <span>Métricas del Día</span>
          </h4>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {state.metrics.map((metric) => (
            <div key={metric.id} className={`p-4 rounded-lg border-2 ${getColorClasses(metric.color)}`}>
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{metric.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{metric.name}</h4>
                  <p className="text-sm opacity-75">
                    Unidad: {metric.unit}
                    {metric.target && ` • Objetivo: ${metric.target}${metric.unit}`}
                  </p>
                </div>
                {getLatestValue(metric) && (
                  <div className="text-right">
                    <p className="text-sm opacity-75">Último valor</p>
                    <p className="font-semibold">{getLatestValue(metric)}{metric.unit}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">
                      Valor ({metric.unit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements[metric.id]?.value || ""}
                      onChange={(e) => handleValueChange(metric.id, 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white bg-white"
                      placeholder={`ej. ${getLatestValue(metric) || "0"}`}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Notas (opcional)
                    </label>
                    <input
                      type="text"
                      value={measurements[metric.id]?.notes || ""}
                      onChange={(e) => handleValueChange(metric.id, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white bg-white"
                      placeholder="Estado de ánimo, observaciones..."
                    />
                  </div>
                </div>
                
                {/* Show delete button if there's an existing measurement */}
                {metric.measurements.find(m => m.date === date) && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('¿Estás seguro de que quieres eliminar esta medición?')) {
                          try {
                            const supabase = createSupabaseClient();
                            const db = new DatabaseService(supabase);
                            await db.deleteMeasurement(metric.id, date);
                            dispatch({ type: "DELETE_MEASUREMENT", metricId: metric.id, date });
                            setMeasurements(prev => {
                              const updated = { ...prev };
                              delete updated[metric.id];
                              return updated;
                            });
                          } catch (error) {
                            console.error('Error deleting measurement:', error);
                            setError('Error al eliminar la medición');
                          }
                        }
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <span>🗑️</span>
                      <span>Eliminar medición de este día</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Photos Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <PhotoUpload 
              date={date}
              existingPhotos={dayPhotos}
              dispatch={dispatch}
              user={user!}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                hasAnyValue 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Guardando...</span>
                </span>
              ) : (
                hasAnyValue ? "💾 Guardar y Volver" : "🏠 Volver al Dashboard"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 