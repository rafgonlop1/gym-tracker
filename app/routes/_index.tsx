import type { MetaFunction } from "@remix-run/node";
import { useReducer, useEffect } from "react";
import { appReducer } from "~/state/reducer";
import { defaultMetrics, defaultExercises, defaultExerciseCategories } from "~/data/defaults";
import { useRestTimer } from "~/hooks/useRestTimer";
import { DailySheetForm } from "~/components/DailySheetForm";
import { AddMetricForm } from "~/components/AddMetricForm";
import { ExercisesView } from "~/components/ExercisesView";
import { CalendarView } from "~/components/CalendarView";
import { ProgressView } from "~/components/ProgressView";
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
  });

  const {
    restTime,
    isRestTimerActive,
    restDuration,
    setRestDuration,
    startRestTimer,
    stopRestTimer,
    pauseRestTimer,
    resumeRestTimer,
    formatTime,
    audioRef
  } = useRestTimer();

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
          exerciseCategories: parsed.exerciseCategories
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
      exerciseCategories: state.exerciseCategories
    };
    localStorage.setItem("gym-tracker-data", JSON.stringify(dataToSave));
  }, [state.metrics, state.exercises, state.exerciseCategories]);

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

        {/* Rest Timer */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <span>⏱️</span>
                <span>Timer de Descanso</span>
              </h2>
              
              <div className="flex items-center space-x-3">
                <select
                  value={restDuration}
                  onChange={(e) => setRestDuration(Number(e.target.value))}
                  className="px-3 py-1 bg-white/20 text-white border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                  disabled={isRestTimerActive}
                >
                  <option value={30}>30s</option>
                  <option value={60}>1min</option>
                  <option value={90}>1:30min</option>
                  <option value={120}>2min</option>
                  <option value={180}>3min</option>
                  <option value={300}>5min</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold">
                    {formatTime(restTime)}
                  </div>
                  <div className="text-sm opacity-80">
                    {restTime === 0 ? 'Listo para entrenar' : 
                     isRestTimerActive ? 'Descansando...' : 'Pausado'}
                  </div>
                </div>
                
                {restTime > 0 && (
                  <div className="flex-1 max-w-xs">
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${100 - (restTime / restDuration) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {!isRestTimerActive && restTime === 0 && (
                  <button
                    onClick={startRestTimer}
                    className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <span>▶️</span>
                    <span>Iniciar</span>
                  </button>
                )}
                
                {isRestTimerActive && (
                  <button
                    onClick={pauseRestTimer}
                    className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <span>⏸️</span>
                    <span>Pausar</span>
                  </button>
                )}
                
                {!isRestTimerActive && restTime > 0 && (
                  <button
                    onClick={resumeRestTimer}
                    className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <span>▶️</span>
                    <span>Reanudar</span>
                  </button>
                )}
                
                {restTime > 0 && (
                  <button
                    onClick={stopRestTimer}
                    className="flex items-center space-x-2 bg-red-500/80 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <span>⏹️</span>
                    <span>Parar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
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
            <span>Ver Progreso</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: "Total mediciones", 
              value: state.metrics.reduce((acc, m) => acc + m.measurements.length, 0).toString(), 
              icon: "📊" 
            },
            { label: "Métricas activas", value: state.metrics.length.toString(), icon: "🎯" },
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

      {/* Audio element for timer notifications */}
      <audio 
        ref={audioRef}
        preload="auto"
      >
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAYBzuU2vi2dyMGK3vI7NiQQAoU" type="audio/wav" />
      </audio>
    </div>
  );
}
