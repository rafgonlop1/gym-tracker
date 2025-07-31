// app/components/TemplateManager.tsx
import React, { useState, useEffect } from 'react';
import type { AppDispatch, WorkoutTemplate, WorkoutType, WorkoutExercise, ExerciseSet } from '~/types';
import { ViewTransition } from './ViewTransition';
import { v4 as uuidv4 } from 'uuid';

interface TemplateManagerProps {
  templates: WorkoutTemplate[];
  dispatch: AppDispatch;
}

const TemplateForm: React.FC<{
  template: WorkoutTemplate | Omit<WorkoutTemplate, 'id'>;
  onSave: (template: WorkoutTemplate | Omit<WorkoutTemplate, 'id'>) => void;
  onCancel: () => void;
}> = ({ template, onSave, onCancel }) => {
  const [editedTemplate, setEditedTemplate] = useState(template);
  const [errors, setErrors] = useState<{ name?: string; exercises?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!editedTemplate.name.trim()) {
      newErrors.name = 'El nombre de la plantilla es requerido';
    }
    if (editedTemplate.exercises.length === 0) {
      newErrors.exercises = 'Agrega al menos un ejercicio';
    } else if (editedTemplate.exercises.some(ex => !ex.exerciseName.trim())) {
      newErrors.exercises = 'Todos los ejercicios deben tener nombre';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(editedTemplate);
    }
  };

  const handleExerciseChange = (index: number, field: keyof WorkoutExercise, value: any) => {
    const newExercises = [...editedTemplate.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setEditedTemplate({ ...editedTemplate, exercises: newExercises });
  };
  
  const handleSetChange = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: any) => {
    const newExercises = [...editedTemplate.exercises];
    const newSets = [...newExercises[exerciseIndex].sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    newExercises[exerciseIndex].sets = newSets;
    setEditedTemplate({ ...editedTemplate, exercises: newExercises });
  };
  
  const addExercise = () => {
    const newExercise: WorkoutExercise = {
      exerciseId: uuidv4(),
      exerciseName: '',
      sets: [{ setNumber: 1, reps: 10, completed: false }],
    };
    setEditedTemplate({ ...editedTemplate, exercises: [...editedTemplate.exercises, newExercise] });
  };

  const removeExercise = (index: number) => {
    const newExercises = editedTemplate.exercises.filter((_, i) => i !== index);
    setEditedTemplate({ ...editedTemplate, exercises: newExercises });
  };
  
  const addSet = (exerciseIndex: number) => {
    const newExercises = [...editedTemplate.exercises];
    const newSet: ExerciseSet = {
      setNumber: newExercises[exerciseIndex].sets.length + 1,
      reps: 10,
      completed: false
    };
    newExercises[exerciseIndex].sets.push(newSet);
    setEditedTemplate({ ...editedTemplate, exercises: newExercises });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...editedTemplate.exercises];
    newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    // Renumerar sets
    newExercises[exerciseIndex].sets.forEach((set, i) => {
      set.setNumber = i + 1;
    });
    setEditedTemplate({ ...editedTemplate, exercises: newExercises });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {'id' in editedTemplate ? 'Editar' : 'Crear'} Plantilla
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la plantilla
              </label>
              <input
                type="text"
                value={editedTemplate.name}
                onChange={(e) => {
                  setEditedTemplate({ ...editedTemplate, name: e.target.value });
                  setErrors({ ...errors, name: undefined });
                }}
                placeholder="Ej: Rutina de Empuje"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de entrenamiento
              </label>
              <select
                value={editedTemplate.workoutType}
                onChange={(e) => setEditedTemplate({ ...editedTemplate, workoutType: e.target.value as WorkoutType })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="push">Empuje</option>
                <option value="pull">Tirón</option>
                <option value="legs">Piernas</option>
                <option value="plyometrics">Pliometría</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ejercicios
                </label>
                <button
                  onClick={addExercise}
                  className="text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-md transition-colors duration-200"
                >
                  + Agregar Ejercicio
                </button>
              </div>
              
              {errors.exercises && <p className="mb-2 text-sm text-red-600">{errors.exercises}</p>}
              
              {editedTemplate.exercises.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No hay ejercicios aún</p>
                  <button
                    onClick={addExercise}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    Agrega tu primer ejercicio
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {editedTemplate.exercises.map((exercise, exIndex) => (
                    <div key={exIndex} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="text"
                          value={exercise.exerciseName}
                          onChange={(e) => {
                            handleExerciseChange(exIndex, 'exerciseName', e.target.value);
                            setErrors({ ...errors, exercises: undefined });
                          }}
                          placeholder="Nombre del ejercicio"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={() => removeExercise(exIndex)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                          title="Eliminar ejercicio"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Series</span>
                          <button
                            onClick={() => addSet(exIndex)}
                            className="text-sm text-blue-500 hover:text-blue-600"
                          >
                            + Agregar serie
                          </button>
                        </div>
                        {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-16">Serie {set.setNumber}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={set.reps || ''}
                                onChange={(e) => handleSetChange(exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                placeholder="Reps"
                                min="1"
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-center"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">reps</span>
                            </div>
                            {exercise.sets.length > 1 && (
                              <button
                                onClick={() => removeSet(exIndex, setIndex)}
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                                title="Eliminar serie"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              {'id' in editedTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export function TemplateManager({ templates, dispatch }: TemplateManagerProps) {
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | Omit<WorkoutTemplate, 'id'> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<WorkoutType | 'all'>('all');

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.workoutType === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreateNew = () => {
    setEditingTemplate({
      name: '',
      workoutType: 'push',
      exercises: [],
    });
  };

  const handleEdit = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
  };

  const handleDelete = (templateId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      dispatch({ type: 'DELETE_TEMPLATE', payload: { templateId } });
    }
  };

  const handleSave = (template: WorkoutTemplate | Omit<WorkoutTemplate, 'id'>) => {
    if ('id' in template) {
      dispatch({ type: 'UPDATE_TEMPLATE', payload: { template } });
    } else {
      dispatch({ type: 'CREATE_TEMPLATE', payload: { template } });
    }
    setEditingTemplate(null);
  };

  const workoutTypeLabels: Record<WorkoutType | 'all', string> = {
    push: 'Empuje',
    pull: 'Tirón',
    legs: 'Piernas',
    plyometrics: 'Pliometría',
    all: 'Todos'
  };

  return (
    <ViewTransition>
      <div className="p-4 max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Plantillas de Entrenamiento</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as WorkoutType | 'all')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los tipos</option>
              <option value="push">Empuje</option>
              <option value="pull">Tirón</option>
              <option value="legs">Piernas</option>
              <option value="plyometrics">Pliometría</option>
            </select>
            
            <button
              onClick={handleCreateNew}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Plantilla
            </button>
          </div>
        </header>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay plantillas</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterType !== 'all' ? 'No se encontraron plantillas con los filtros aplicados.' : 'Comienza creando una nueva plantilla de entrenamiento.'}
            </p>
            {(searchTerm || filterType !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                className="mt-4 text-blue-500 hover:text-blue-600 text-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{template.name}</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {workoutTypeLabels[template.workoutType]}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {template.exercises.length} ejercicio{template.exercises.length !== 1 ? 's' : ''}
                  </p>
                  {template.exercises.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {template.exercises.slice(0, 3).map(ex => ex.exerciseName).join(', ')}
                      {template.exercises.length > 3 && '...'}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors duration-200 text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors duration-200 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingTemplate && (
          <TemplateForm 
            template={editingTemplate}
            onSave={handleSave}
            onCancel={() => setEditingTemplate(null)}
          />
        )}
      </div>
    </ViewTransition>
  );
}
