// app/components/WorkoutTypeSelection.tsx
import type { AppDispatch, WorkoutType, WorkoutTypeConfig, WorkoutTemplate } from "~/types";
import { workoutTypes } from "~/data/defaults";
import { workoutTemplates } from "~/data/templates";
import { useState } from "react";

interface WorkoutTypeSelectionProps {
  dispatch: AppDispatch;
  templates: WorkoutTemplate[];
}

export function WorkoutTypeSelection({ dispatch, templates }: WorkoutTypeSelectionProps) {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutTypeConfig | null>(null);

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
    setSelectedWorkoutType(workoutType);
    setShowTemplateModal(true);
  };

  const handleStartWithTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && selectedWorkoutType) {
      dispatch({
        type: "START_WORKOUT_FROM_TEMPLATE",
        payload: {
          workoutType: selectedWorkoutType.id,
          exercises: template.exercises,
        },
      });
    }
    setShowTemplateModal(false);
  };

  const handleStartEmpty = () => {
    if (selectedWorkoutType) {
      dispatch({
        type: "SELECT_WORKOUT_TYPE",
        workoutType: selectedWorkoutType.id
      });
    }
    setShowTemplateModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header (hidden on mobile; global header handles title) */}
      <header className="hidden lg:block bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
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

      {/* Template Selection Modal */}
      {showTemplateModal && selectedWorkoutType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-3xl">{selectedWorkoutType.icon}</span>
                {selectedWorkoutType.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">¿Cómo quieres empezar tu entrenamiento?</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Start Empty Option */}
                <button
                  onClick={handleStartEmpty}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Empezar vacío</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Crea tu rutina desde cero</p>
                    </div>
                  </div>
                </button>

                {/* Template Options */}
                {templates
                  .filter(template => template.workoutType === selectedWorkoutType.id)
                  .length > 0 && (
                  <>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">O usa una plantilla</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    
                    {templates
                      .filter(template => template.workoutType === selectedWorkoutType.id)
                      .map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleStartWithTemplate(template.id)}
                          className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 text-left border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {template.exercises.length} ejercicio{template.exercises.length !== 1 ? 's' : ''}
                              </p>
                              {template.exercises.length > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {template.exercises.slice(0, 3).map(ex => ex.exerciseName).join(', ')}
                                  {template.exercises.length > 3 && '...'}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                  </>
                )}
                
                {/* Default Templates (if any) */}
                {Object.keys(workoutTemplates).includes(selectedWorkoutType.id) && (
                  <>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Plantillas predeterminadas</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    
                    <button
                      onClick={() => {
                        const template = workoutTemplates[selectedWorkoutType.id as keyof typeof workoutTemplates];
                        if (template) {
                          dispatch({
                            type: "START_WORKOUT_FROM_TEMPLATE",
                            payload: {
                              workoutType: selectedWorkoutType.id,
                              exercises: template,
                            },
                          });
                          setShowTemplateModal(false);
                        }
                      }}
                      className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200 text-left border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Plantilla {selectedWorkoutType.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Rutina recomendada por expertos</p>
                        </div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="w-full px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
