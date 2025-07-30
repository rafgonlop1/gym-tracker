import type { MetaFunction } from "@remix-run/node";
import { useReducer, useEffect } from "react";
import { appReducer } from "~/state/reducer";
import { defaultMetrics, defaultExercises, defaultExerciseCategories } from "~/data/defaults";
import { DailySheetForm } from "~/components/DailySheetForm";
import { AddMetricForm } from "~/components/AddMetricForm";
import { ExercisesView } from "~/components/ExercisesView";
import { CalendarView } from "~/components/CalendarView";
import { ProgressView } from "~/components/ProgressView";
import { TimerView } from "~/components/TimerView";
import { WorkoutTypeSelection } from "~/components/WorkoutTypeSelection";
import { WorkoutActive } from "~/components/WorkoutActive";
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

  // Main render based on current view
  if (state.view === "daily-sheet") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <DailySheetForm state={state} dispatch={dispatch} />
      </div>
    );
  }

  if (state.view === "add-metric") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <AddMetricForm dispatch={dispatch} />
      </div>
    );
  }

  if (state.view === "exercises") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <ExercisesView state={state} dispatch={dispatch} />
      </div>
    );
  }

  if (state.view === "calendar") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <CalendarView state={state} dispatch={dispatch} />
      </div>
    );
  }

  if (state.view === "progress") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <ProgressView state={state} dispatch={dispatch} />
      </div>
    );
  }

  if (state.view === "timer") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TimerView dispatch={dispatch} />
      </div>
    );
  }

  if (state.view === "workout-selection") {
    return <WorkoutTypeSelection dispatch={dispatch} />;
  }

  if (state.view === "workout-active") {
    return <WorkoutActive state={state} dispatch={dispatch} />;
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">💪</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Gym Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {state.metrics.length} métricas activas
              </span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard de Métricas
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitorea tu progreso y alcanza tus objetivos de fitness
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {state.metrics.map((metric) => {
            const latestValue = getLatestValue(metric);
            const previousValue = getPreviousValue(metric);
            const trend = getTrend(metric);
            
            return (
              <div
                key={metric.id}
                className={`rounded-lg border-2 p-6 transition-all hover:shadow-lg cursor-pointer ${getColorClasses(metric.color)}`}
                onClick={() => dispatch({ type: "SET_VIEW", view: "progress", metricId: metric.id })}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{metric.icon}</span>
                    <h3 className="font-semibold text-lg">{metric.name}</h3>
                  </div>
                  <span className={`text-lg ${getTrendColor(trend, metric.targetType)}`}>
                    {getTrendIcon(trend)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold">
                      {latestValue || "—"}
                    </span>
                    <span className="text-sm opacity-75">{metric.unit}</span>
                  </div>
                  
                  {previousValue && (
                    <div className="flex items-center justify-between text-sm opacity-75">
                      <span>
                        Anterior: {previousValue}{metric.unit}
                      </span>
                      <span>{metric.measurements[metric.measurements.length - 1]?.date}</span>
                    </div>
                  )}
                  
                  {latestValue && previousValue && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className={getTrendColor(trend, metric.targetType)}>
                        {trend === "down" ? "↓" : trend === "up" ? "↑" : "→"}
                        {Math.abs(latestValue - previousValue).toFixed(1)}{metric.unit}
                      </span>
                      <span className="opacity-75">vs anterior</span>
                    </div>
                  )}

                  {metric.target && (
                    <div className="text-xs opacity-75">
                      Objetivo: {metric.target}{metric.unit}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Primary Action - Start Workout */}
        <div className="mb-8">
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "workout-selection" })}
            className="w-full sm:w-auto mx-auto flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span className="text-2xl">🏋️</span>
            <span className="text-xl">Iniciar Entrenamiento</span>
            <span className="text-lg">→</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "daily-sheet" })}
            className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-4 px-6 rounded-lg transition-colors"
          >
            <span className="text-lg">📋</span>
            <span>Ficha Diaria</span>
          </button>

          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "calendar" })}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors"
          >
            <span className="text-lg">📅</span>
            <span>Calendario</span>
          </button>
          
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "timer" })}
            className="flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-4 px-6 rounded-lg transition-colors"
          >
            <span className="text-lg">⏱️</span>
            <span>Timer</span>
          </button>

          <button 
            onClick={() => dispatch({ type: "SET_VIEW", view: "exercises" })}
            className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-lg transition-colors"
          >
            <span className="text-lg">🏋️</span>
            <span>Ejercicios</span>
          </button>

          <button 
            onClick={() => dispatch({ type: "SET_VIEW", view: "progress" })}
            className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-4 px-6 rounded-lg transition-colors"
          >
            <span className="text-lg">📈</span>
            <span>Progreso</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { 
              label: "Total mediciones", 
              value: state.metrics.reduce((acc, m) => acc + m.measurements.length, 0).toString(), 
              icon: "📊" 
            },
            { label: "Métricas activas", value: state.metrics.length.toString(), icon: "🎯" },
            { 
              label: "Entrenamientos", 
              value: state.workoutSessions.length.toString(), 
              icon: "🏋️" 
            },
            { 
              label: "Última medición", 
              value: state.metrics
                .flatMap(m => m.measurements)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                ? new Date(state.metrics.flatMap(m => m.measurements).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString()
                : "N/A", 
              icon: "📅" 
            },
            { 
              label: "Con objetivos", 
              value: state.metrics.filter(m => m.target).length.toString(), 
              icon: "🏆" 
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
