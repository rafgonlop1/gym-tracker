import type { AppDispatch, WorkoutTypeConfig } from "~/types";
import { workoutTypes } from "~/data/defaults";

interface WorkoutTypeSelectionProps {
  dispatch: AppDispatch;
}

export function WorkoutTypeSelection({ dispatch }: WorkoutTypeSelectionProps) {
  const getColorClasses = (color: string) => {
    const colorMap = {
      red: "border-red-300 bg-red-50 hover:bg-red-100 dark:border-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30",
      blue: "border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30",
      green: "border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/30",
      pink: "border-pink-300 bg-pink-50 hover:bg-pink-100 dark:border-pink-600 dark:bg-pink-900/20 dark:hover:bg-pink-900/30",
      yellow: "border-yellow-300 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30",
      purple: "border-purple-300 bg-purple-50 hover:bg-purple-100 dark:border-purple-600 dark:bg-purple-900/20 dark:hover:bg-purple-900/30",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const handleWorkoutTypeSelect = (workoutType: WorkoutTypeConfig) => {
    dispatch({ 
      type: "SELECT_WORKOUT_TYPE", 
      workoutType: workoutType.id 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => dispatch({ type: "SET_VIEW", view: "dashboard" })}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-xl">←</span>
              </button>
              <div className="text-2xl">🏋️</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Seleccionar Entrenamiento
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Qué vas a entrenar hoy?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Elige el tipo de entrenamiento que quieres realizar
          </p>
        </div>

        {/* Workout Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {workoutTypes.map((workoutType) => (
            <div
              key={workoutType.id}
              onClick={() => handleWorkoutTypeSelect(workoutType)}
              className={`
                relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 
                hover:shadow-xl hover:-translate-y-1 group
                ${getColorClasses(workoutType.color)}
              `}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                  {workoutType.icon}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                {workoutType.name}
              </h3>

              {/* Description */}
              <p className="text-gray-700 dark:text-gray-300 text-center mb-4 text-sm leading-relaxed">
                {workoutType.description}
              </p>

              {/* Duration */}
              {workoutType.estimatedDuration && (
                <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                  <span className="text-sm">⏱️</span>
                  <span className="text-sm font-medium">{workoutType.estimatedDuration}</span>
                </div>
              )}

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-white dark:bg-gray-800 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-12 text-center">
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "dashboard" })}
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}