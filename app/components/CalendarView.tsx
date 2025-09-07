import { useState } from "react";
import type { AppState, Metric, Measurement, WorkoutSession, DailyPhoto } from "~/types";
import { getLatestValue, getDateString } from "~/utils/helpers";
import { workoutTypes } from "~/data/defaults";
import { PhotoUpload } from "./PhotoUpload";
import { createSupabaseClient } from "~/lib/supabase.client";
import { DatabaseService } from "~/services/database";
import { useAuth } from "~/hooks/useAuth";

interface CalendarViewProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

export const CalendarView = ({ state, dispatch }: CalendarViewProps) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Create a map of dates to all measurements, workouts and photos for that date
  const createDailyDataMap = () => {
    const dailyData = new Map<string, {
      metrics: Array<{metric: Metric, measurement: Measurement}>,
      workouts: WorkoutSession[],
      photos: DailyPhoto[]
    }>();
    
    // Add metrics data
    state.metrics.forEach(metric => {
      metric.measurements.forEach(measurement => {
        const dateStr = measurement.date;
        if (!dailyData.has(dateStr)) {
          dailyData.set(dateStr, { metrics: [], workouts: [], photos: [] });
        }
        dailyData.get(dateStr)!.metrics.push({ metric, measurement });
      });
    });
    
    // Add workout data
    state.workoutSessions.forEach(workout => {
      if (workout.completed) {
        const dateStr = workout.date;
        if (!dailyData.has(dateStr)) {
          dailyData.set(dateStr, { metrics: [], workouts: [], photos: [] });
        }
        dailyData.get(dateStr)!.workouts.push(workout);
      }
    });
    
    // Add photo data
    state.dailyPhotos.forEach(dayPhotos => {
      const dateStr = dayPhotos.date;
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { metrics: [], workouts: [], photos: [] });
      }
      dailyData.get(dateStr)!.photos = dayPhotos.photos;
    });
    
    return dailyData;
  };

  const dailyDataMap = createDailyDataMap();

  const calendar = [];
  let week = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    week.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = getDateString(currentYear, currentMonth, day);
    const dayData = dailyDataMap.get(dateStr) || { metrics: [], workouts: [], photos: [] };
    
    week.push({ date: dateStr, day, dayData });
    
    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }

  // Add remaining week if not complete
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    calendar.push(week);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDay(dateStr);
    setShowEditModal(true);
  };

  const today = getDateString();

  // Helper functions for workouts
  const getWorkoutIcon = (workoutType: string) => {
    const config = workoutTypes.find(wt => wt.id === workoutType);
    return config?.icon || "🏋️";
  };

  const getWorkoutName = (workoutType: string) => {
    const config = workoutTypes.find(wt => wt.id === workoutType);
    return config?.name || workoutType;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Edit Day Modal Component
  const EditDayModal = () => {
    if (!selectedDay) return null;

    const [formData, setFormData] = useState<Record<string, {value: string, notes: string}>>(() => {
      const initialData: Record<string, {value: string, notes: string}> = {};
      
      state.metrics.forEach(metric => {
        const existingMeasurement = metric.measurements.find(m => m.date === selectedDay);
        initialData[metric.id] = {
          value: existingMeasurement?.value.toString() || '',
          notes: existingMeasurement?.notes || ''
        };
      });
      
      return initialData;
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!user) {
        setError("Debes estar logueado para guardar mediciones");
        return;
      }
      
      // Filter out empty values and prepare for dispatch
      const measurementsToSave: Record<string, {value: string, notes: string}> = {};
      Object.entries(formData).forEach(([metricId, data]) => {
        if (data.value.trim()) {
          measurementsToSave[metricId] = data;
        }
      });

      if (Object.keys(measurementsToSave).length === 0) {
        setShowEditModal(false);
        setSelectedDay(null);
        return;
      }

      setIsSubmitting(true);
      setError("");
      
      try {
        const supabase = createSupabaseClient();
        const db = new DatabaseService(supabase);
        
        // Save each measurement to database first
        const promises = Object.entries(measurementsToSave).map(([metricId, data]) => {
          return db.addMeasurement(metricId, selectedDay!, parseFloat(data.value), data.notes || undefined);
        });
        
        await Promise.all(promises);
        
        // Then update local state
        dispatch({
          type: "ADD_DAILY_MEASUREMENTS",
          date: selectedDay,
          measurements: measurementsToSave
        });

        setShowEditModal(false);
        setSelectedDay(null);
        
      } catch (error) {
        console.error('Error saving measurements:', error);
        setError("Error al guardar las mediciones. Inténtalo de nuevo.");
      } finally {
        setIsSubmitting(false);
      }
    };

    const selectedDate = new Date(selectedDay);
    const dayData = dailyDataMap.get(selectedDay) || { metrics: [], workouts: [], photos: [] };
    const dayWorkouts = dayData.workouts;
    const dayPhotos = dayData.photos;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                📅 Editar día - {selectedDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
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
                      Tiempo total: {formatDuration(dayWorkouts.reduce((total, w) => total + (w.totalDuration || 0), 0))}
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
                    onClick={() => {
                      setShowEditModal(false);
                      dispatch({ type: "SET_VIEW", view: "workout-selection", selectedDate: selectedDay });
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    Iniciar Entrenamiento
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayWorkouts.map((workout, index) => (
                    <div key={workout.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
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
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                          <div className="w-full text-left sm:text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDuration(workout.totalDuration)}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              ✓ Completado
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setShowEditModal(false);
                                dispatch({ type: "EDIT_WORKOUT_SESSION", workoutId: workout.id });
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors shrink-0"
                              title="Editar entrenamiento"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('¿Estás seguro de que quieres eliminar este entrenamiento?')) {
                                  dispatch({ type: "DELETE_WORKOUT_SESSION", workoutId: workout.id });
                                }
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors shrink-0"
                              title="Eliminar entrenamiento"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Workout Details - Simplified for modal */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {/* Strength workouts */}
                        {workout.exercises && workout.exercises.length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Ejercicios: {workout.exercises.length}
                            </p>
                            <div className="space-y-1">
                              {workout.exercises.slice(0, 2).map((exercise, idx) => (
                                <p key={idx} className="text-gray-600 dark:text-gray-400 text-xs">
                                  • {exercise.exerciseName} ({exercise.sets.length} sets)
                                </p>
                              ))}
                              {workout.exercises.length > 2 && (
                                <p className="text-gray-500 dark:text-gray-500 text-xs">
                                  + {workout.exercises.length - 2} más...
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

                        {/* Total volume */}
                        {workout.exercises && workout.exercises.length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Volumen Total
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">
                              {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)} sets
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">
                              {workout.exercises.reduce((total, ex) => 
                                total + ex.sets.reduce((setTotal, set) => 
                                  setTotal + (set.weight || 0) * (set.reps || 0), 0
                                ), 0
                              ).toFixed(0)} kg total
                            </p>
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
              {state.metrics.map(metric => {
                const currentValue = formData[metric.id]?.value || '';
                const currentNotes = formData[metric.id]?.notes || '';
                const latestValue = getLatestValue(metric);

                return (
                  <div key={metric.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{metric.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {metric.name}
                        </h4>
                        {latestValue && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Último valor: {latestValue}{metric.unit}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Valor ({metric.unit})
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={currentValue}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              [metric.id]: {
                                ...prev[metric.id],
                                value: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            placeholder={`ej. ${latestValue || '0'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notas (opcional)
                          </label>
                          <input
                            type="text"
                            value={currentNotes}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              [metric.id]: {
                                ...prev[metric.id],
                                notes: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            placeholder="Notas adicionales..."
                          />
                        </div>
                      </div>
                      
                      {/* Show delete button if there's an existing measurement */}
                      {metric.measurements.find(m => m.date === selectedDay) && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm('¿Estás seguro de que quieres eliminar esta medición?')) {
                                try {
                                  const supabase = createSupabaseClient();
                                  const db = new DatabaseService(supabase);
                                  await db.deleteMeasurement(metric.id, selectedDay);
                                  dispatch({ type: "DELETE_MEASUREMENT", metricId: metric.id, date: selectedDay });
                                  setFormData(prev => ({
                                    ...prev,
                                    [metric.id]: { value: '', notes: '' }
                                  }));
                                } catch (error) {
                                  console.error('Error deleting measurement:', error);
                                  setError('Error al eliminar la medición');
                                }
                              }
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <span>🗑️</span>
                            <span>Eliminar medición</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Photos Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <PhotoUpload 
                  date={selectedDay}
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                    "Guardar Cambios"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="hidden lg:block text-2xl font-bold text-gray-900 dark:text-white">
          📅 Calendario - Ficha Diaria
        </h3>
        <div className="hidden lg:block text-sm text-gray-600 dark:text-gray-400">
          Haz click en cualquier día para editarlo
        </div>
      </div>

      {/* Monthly Stats - Moved to top */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 mb-6 shadow-md">
        <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📊 Estadísticas del Mes
        </h5>
        {(() => {
          const monthDates = Array.from({ length: daysInMonth }, (_, i) => getDateString(currentYear, currentMonth, i + 1));
          const daysWithData = monthDates.filter(date => {
            const dayData = dailyDataMap.get(date);
            return dayData && (dayData.metrics.length > 0 || dayData.workouts.length > 0 || dayData.photos.length > 0);
          }).length;
          const totalMeasurements = monthDates.reduce((total, date) => total + (dailyDataMap.get(date)?.metrics.length || 0), 0);
          const totalWorkouts = monthDates.reduce((total, date) => total + (dailyDataMap.get(date)?.workouts.length || 0), 0);
          const totalPhotos = monthDates.reduce((total, date) => total + (dailyDataMap.get(date)?.photos.length || 0), 0);
          const avgPerDay = daysWithData > 0 ? ((totalMeasurements + totalWorkouts + totalPhotos) / daysWithData).toFixed(1) : '0';

          const stats = [
            { label: 'Días con datos', value: `${daysWithData}/${daysInMonth}`, color: 'text-blue-600 dark:text-blue-400', icon: '📅' },
            { label: 'Mediciones', value: totalMeasurements, color: 'text-green-600 dark:text-green-400', icon: '📊' },
            { label: 'Entrenamientos', value: totalWorkouts, color: 'text-orange-600 dark:text-orange-400', icon: '🏋️' },
            { label: 'Fotografías', value: totalPhotos, color: 'text-pink-600 dark:text-pink-400', icon: '📸' },
            { label: 'Prom. actividades/día', value: avgPerDay, color: 'text-purple-600 dark:text-purple-400', icon: '➕' },
          ];

          return (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 bg-gray-50 dark:bg-gray-900/20 p-3 text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1 mb-1">
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value as any}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Month Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 mb-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-2xl">←</span>
          </button>
          
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            {firstDay.toLocaleDateString('es-ES', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-2xl">→</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-3">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendar.map((week, weekIndex) => (
            week.map((day, dayIndex) => {
              if (!day) {
                return <div key={`${weekIndex}-${dayIndex}`} className="aspect-square" />;
              }
              
              const hasData = day.dayData.metrics.length > 0 || day.dayData.workouts.length > 0 || day.dayData.photos.length > 0;
              const isToday = day.date === today;
              const metricsCount = day.dayData.metrics.length;
              const workoutsCount = day.dayData.workouts.length;
              const photosCount = day.dayData.photos.length;
              const totalItems = metricsCount + workoutsCount + photosCount;
              const totalMetrics = state.metrics.length;
              const completionPercentage = totalMetrics > 0 ? (metricsCount / totalMetrics) * 100 : 0;
              
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  onClick={() => handleDayClick(day.date)}
                  className={`
                    aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-start overflow-hidden relative cursor-pointer pt-1
                    ${hasData 
                      ? completionPercentage >= 80
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' 
                        : completionPercentage >= 50
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'}
                    ${isToday ? 'ring-[3px] ring-orange-500 ring-opacity-60' : ''}
                    hover:shadow-lg transition-all transform hover:scale-105
                  `}
                  title={`${day.day} - ${hasData ? `${metricsCount}/${totalMetrics} métricas, ${workoutsCount} entrenamientos, ${photosCount} fotos` : 'Click para agregar datos'}`}
                >
                  <span className={`text-lg font-bold ${hasData ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                    {day.day}
                  </span>
                  
                  {hasData && (
                    <div className="flex flex-wrap gap-1 mt-1 justify-center max-w-full overflow-hidden leading-none text-[11px]">
                      {/* Show workout icons first */}
                      {day.dayData.workouts.slice(0, 2).map((workout, idx) => (
                        <span key={`workout-${idx}`}>
                          {getWorkoutIcon(workout.workoutType)}
                        </span>
                      ))}
                      {/* Show single metric icon if there are metrics */}
                      {metricsCount > 0 && (
                        <span key="metrics">📊</span>
                      )}
                      {/* Show photo icon if there are photos */}
                      {photosCount > 0 && (
                        <span key="photos">📸</span>
                      )}
                      {totalItems > 5 && (
                        <span className="text-gray-600 dark:text-gray-400">+{totalItems - 5}</span>
                      )}
                    </div>
                  )}
                  
                  {!hasData && (
                    <span className="text-xs text-gray-400 mt-1">+</span>
                  )}
                  
                  {isToday && (
                    <span className="absolute bottom-0 left-1 text-orange-500 text-[10px] font-bold">
                      HOY
                    </span>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>



      {/* Edit Day Modal */}
      {showEditModal && <EditDayModal />}
    </div>
  );
}; 