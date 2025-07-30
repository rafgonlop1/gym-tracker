import type { AppDispatch, WorkoutTypeConfig } from "~/types";
import { workoutTypes } from "~/data/defaults";

interface WorkoutTypeSelectionProps {
  dispatch: AppDispatch;
}

export function WorkoutTypeSelection({ dispatch }: WorkoutTypeSelectionProps) {
  const getGradientClasses = (color: string) => {
    const gradientMap = {
      red: "from-red-500 to-pink-600",
      blue: "from-blue-500 to-cyan-600",
      green: "from-green-500 to-emerald-600",
      pink: "from-pink-500 to-rose-600",
      yellow: "from-yellow-400 to-orange-500",
      purple: "from-purple-500 to-indigo-600",
    };
    return gradientMap[color as keyof typeof gradientMap] || gradientMap.blue;
  };

  const handleWorkoutTypeSelect = (workoutType: WorkoutTypeConfig) => {
    dispatch({ 
      type: "SELECT_WORKOUT_TYPE", 
      workoutType: workoutType.id 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🏋️</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Iniciar Entrenamiento
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center animate-fadeIn">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            ¿Qué vas a entrenar hoy?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Elige tu entrenamiento y comienza a superar tus límites
          </p>
        </div>

        {/* Workout Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {workoutTypes.map((workoutType, index) => (
            <div
              key={workoutType.id}
              onClick={() => handleWorkoutTypeSelect(workoutType)}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 animate-scaleIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClasses(workoutType.color)} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
              
              {/* Content */}
              <div className="relative p-8">
                {/* Icon Container */}
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${getGradientClasses(workoutType.color)} p-1`}>
                  <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
                      {workoutType.icon}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                  {workoutType.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
                  {workoutType.description}
                </p>

                {/* Duration Badge */}
                {workoutType.estimatedDuration && (
                  <div className="flex items-center justify-center">
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r ${getGradientClasses(workoutType.color)} bg-opacity-10`}>
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {workoutType.estimatedDuration}
                      </span>
                    </div>
                  </div>
                )}

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getGradientClasses(workoutType.color)} flex items-center justify-center text-white`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md">
            <div className="text-3xl mb-2">💪</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">6</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tipos de entrenamiento</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">Personalizado</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Para tus objetivos</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">Progreso</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Seguimiento completo</p>
          </div>
        </div>
      </main>
    </div>
  );
}