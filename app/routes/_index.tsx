import type { MetaFunction } from "@remix-run/node";
import { useReducer, useEffect, useState } from "react";
import { appReducer } from "~/state/reducer";
import { defaultMetrics, defaultExercises, defaultExerciseCategories, workoutTypes } from "~/data/defaults";
import { DailySheetForm } from "~/components/DailySheetForm";
import { AddMetricForm } from "~/components/AddMetricForm";
import { ExercisesView } from "~/components/ExercisesView";
import { CalendarView } from "~/components/CalendarView";
import { ProgressView } from "~/components/ProgressView";
import { TimerView } from "~/components/TimerView";
import { WorkoutTypeSelection } from "~/components/WorkoutTypeSelection";
import { WorkoutActive } from "~/components/WorkoutActive";
import { Navigation } from "~/components/Navigation";
import { ViewTransition } from "~/components/ViewTransition";
import { getLatestValue, getPreviousValue, getTrend, getTrendIcon, getTrendColor, getColorClasses } from "~/utils/helpers";

export const meta: MetaFunction = () => {
  return [
    { title: "Gym Tracker - Dashboard" },
    { name: "description", content: "Track your fitness progress with ease" },
  ];
};

export default function Dashboard() {
  const [state, dispatch] = useReducer(appReducer, {
    metrics: defaultMetrics,
    exercises: defaultExercises,
    exerciseCategories: defaultExerciseCategories,
    view: "dashboard",
    workoutSessions: [],
    dailyPhotos: [],
  });
  
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  // Calculate current streak
  const calculateCurrentStreak = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all activity dates (measurements, workouts, photos)
    const activityDates = new Set();

    // Add measurement dates
    state.metrics.forEach(metric => {
      metric.measurements.forEach(measurement => {
        const date = new Date(measurement.date);
        date.setHours(0, 0, 0, 0);
        activityDates.add(date.getTime());
      });
    });

    // Add workout dates
    state.workoutSessions.forEach(session => {
      const date = new Date(session.date);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.getTime());
    });

    // Add photo dates
    state.dailyPhotos.forEach(photo => {
      const date = new Date(photo.date);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.getTime());
    });

    // Calculate streak starting from today going backwards
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const currentDateMs = currentDate.getTime();
      
      if (activityDates.has(currentDateMs)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If today has no activity, don't count it as breaking the streak
        // Only break if we've started counting and find a gap
        if (streak > 0 || currentDate.getTime() === today.getTime()) {
          if (currentDate.getTime() !== today.getTime()) {
            break;
          }
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return streak;
  };

  const currentStreak = calculateCurrentStreak();

  // localStorage persistence
  useEffect(() => {
    const savedData = localStorage.getItem("gym-tracker-data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        dispatch({
          type: "LOAD_DATA",
          metrics: parsed.metrics,
          exercises: parsed.exercises,
          exerciseCategories: parsed.exerciseCategories,
          workoutSessions: parsed.workoutSessions || [],
          dailyPhotos: parsed.dailyPhotos || []
        });
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      metrics: state.metrics,
      exercises: state.exercises,
      exerciseCategories: state.exerciseCategories,
      workoutSessions: state.workoutSessions,
      dailyPhotos: state.dailyPhotos
    };
    localStorage.setItem("gym-tracker-data", JSON.stringify(dataToSave));
  }, [state.metrics, state.exercises, state.exerciseCategories, state.workoutSessions, state.dailyPhotos]);

  // Layout with navigation
  const isFullScreenView = false; // Todas las vistas ahora tienen navegación

  const renderContent = () => {
    switch (state.view) {
      case "daily-sheet":
        return (
          <ViewTransition>
            <DailySheetForm state={state} dispatch={dispatch} />
          </ViewTransition>
        );
      case "add-metric":
        return (
          <ViewTransition>
            <AddMetricForm dispatch={dispatch} />
          </ViewTransition>
        );
      case "exercises":
        return (
          <ViewTransition>
            <ExercisesView state={state} dispatch={dispatch} />
          </ViewTransition>
        );
      case "calendar":
        return (
          <ViewTransition>
            <CalendarView state={state} dispatch={dispatch} />
          </ViewTransition>
        );
      case "progress":
        return (
          <ViewTransition>
            <ProgressView state={state} dispatch={dispatch} />
          </ViewTransition>
        );
      case "timer":
        return (
          <ViewTransition>
            <TimerView dispatch={dispatch} />
          </ViewTransition>
        );
      case "workout-selection":
        return (
          <ViewTransition>
            <WorkoutTypeSelection dispatch={dispatch} />
          </ViewTransition>
        );
      case "workout-active":
        return (
          <ViewTransition>
            <WorkoutActive state={state} dispatch={dispatch} />
          </ViewTransition>
        );
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-3xl animate-pulse">💪</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Gym Tracker
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tu progreso diario</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {state.metrics.length}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">métricas</span>
              </div>
              <button className="relative group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-lg transform transition-transform group-hover:scale-110">
                  U
                </div>
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
            ¡Bienvenido de vuelta!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Racha actual</span>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {currentStreak > 0 ? `${currentStreak} día${currentStreak !== 1 ? 's' : ''} 🔥` : 'Sin racha 😴'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Última actividad</span>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Hace 2h</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {state.metrics.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay métricas aún
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comienza agregando tu primera métrica para trackear tu progreso
              </p>
              <button
                onClick={() => dispatch({ type: "SET_VIEW", view: "add-metric" })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Agregar Métrica
              </button>
            </div>
          ) : (
            state.metrics.map((metric) => {
              const latestValue = getLatestValue(metric);
              const previousValue = getPreviousValue(metric);
              const trend = getTrend(metric);
              const progress = metric.target ? ((latestValue || 0) / metric.target) * 100 : null;
              
              return (
                <div
                  key={metric.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
                  onClick={() => dispatch({ type: "SET_VIEW", view: "progress", metricId: metric.id })}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${
                    metric.color === 'blue' ? 'from-blue-500 to-blue-600' :
                    metric.color === 'green' ? 'from-green-500 to-green-600' :
                    metric.color === 'orange' ? 'from-orange-500 to-orange-600' :
                    metric.color === 'purple' ? 'from-purple-500 to-purple-600' :
                    metric.color === 'red' ? 'from-red-500 to-red-600' :
                    'from-gray-500 to-gray-600'
                  }`}></div>
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl transform group-hover:scale-110 transition-transform">
                          {metric.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {metric.name}
                          </h3>
                          {metric.measurements.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {metric.measurements[metric.measurements.length - 1]?.date}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${
                        trend === 'up' && metric.targetType === 'increase' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        trend === 'down' && metric.targetType === 'decrease' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        trend === 'up' && metric.targetType === 'decrease' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        trend === 'down' && metric.targetType === 'increase' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        <span>{getTrendIcon(trend)}</span>
                        {latestValue && previousValue && (
                          <span>{Math.abs(latestValue - previousValue).toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {latestValue || "—"}
                        </span>
                        <span className="text-lg text-gray-500 dark:text-gray-400">
                          {metric.unit}
                        </span>
                      </div>
                      
                      {previousValue && (
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>Anterior: {previousValue}{metric.unit}</span>
                          <span className={`font-medium ${getTrendColor(trend, metric.targetType)}`}>
                            {trend === "down" ? "↓" : trend === "up" ? "↑" : "→"}
                            {((Math.abs(latestValue - previousValue) / previousValue) * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                      
                      {metric.target && progress !== null && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>Objetivo: {metric.target}{metric.unit}</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 rounded-full bg-gradient-to-r ${
                                metric.color === 'blue' ? 'from-blue-400 to-blue-600' :
                                metric.color === 'green' ? 'from-green-400 to-green-600' :
                                metric.color === 'orange' ? 'from-orange-400 to-orange-600' :
                                metric.color === 'purple' ? 'from-purple-400 to-purple-600' :
                                metric.color === 'red' ? 'from-red-400 to-red-600' :
                                'from-gray-400 to-gray-600'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Primary Action - Start Workout */}
        <div className="mb-10 flex justify-center">
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "workout-selection" })}
            className="group relative inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-5 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity"></div>
            <span className="text-2xl animate-bounce">🏋️</span>
            <span className="text-xl">Iniciar Entrenamiento</span>
            <svg className="w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
            Resumen de Actividad
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { 
                label: "Total mediciones", 
                value: state.metrics.reduce((acc, m) => acc + m.measurements.length, 0).toString(), 
                icon: "📊",
                color: "blue"
              },
              { label: "Métricas activas", value: state.metrics.length.toString(), icon: "🎯", color: "green" },
              { 
                label: "Entrenamientos", 
                value: state.workoutSessions.length.toString(), 
                icon: "🏋️",
                color: "orange"
              },
              { 
                label: "Última medición", 
                value: state.metrics
                  .flatMap(m => m.measurements)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                  ? new Date(state.metrics.flatMap(m => m.measurements).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                  : "N/A", 
                icon: "📅",
                color: "purple"
              },
              { 
                label: "Con objetivos", 
                value: state.metrics.filter(m => m.target).length.toString(), 
                icon: "🏆",
                color: "yellow"
              },
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center transform hover:scale-105 transition-transform">
                <div className={`text-3xl mb-2 ${
                  stat.color === 'blue' ? 'text-blue-500' :
                  stat.color === 'green' ? 'text-green-500' :
                  stat.color === 'orange' ? 'text-orange-500' :
                  stat.color === 'purple' ? 'text-purple-500' :
                  stat.color === 'yellow' ? 'text-yellow-500' :
                  'text-gray-500'
                }`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {state.workoutSessions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actividad Reciente
            </h3>
            <div className="space-y-3">
              {state.workoutSessions.slice(-3).reverse().map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {workoutTypes.find(wt => wt.id === session.workoutType)?.icon || '🏋️'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {workoutTypes.find(wt => wt.id === session.workoutType)?.name || session.workoutType}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {session.totalDuration || 0} min
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {session.exercises?.length || 0} ejercicios
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );

  // Full screen views (without navigation)
  if (isFullScreenView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        {renderContent()}
      </div>
    );
  }

  // Views with navigation
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navigation 
        currentView={state.view} 
        dispatch={dispatch} 
        metricsCount={state.metrics.length}
        workoutsCount={state.exercises.length}
        onCollapsedChange={setIsNavCollapsed}
      />
      
      {/* Main container with sidebar offset */}
      <div className={`transition-all duration-300 ${isNavCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Mobile header */}
        <header className="lg:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
          <div className="px-4 sm:px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">💪</div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gym Tracker
                </h1>
              </div>
              <button className="relative group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-lg">
                  U
                </div>
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-screen pb-20 lg:pb-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
