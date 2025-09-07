import { useState } from "react";
import type { AppState } from "~/types";

interface ExercisesViewProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

export const ExercisesView = ({ state, dispatch }: ExercisesViewProps) => {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(
    () => state.exerciseCategories.reduce((acc, category) => {
        acc[category.id] = true; // Collapse by default
        return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => ({
        ...prev,
        [categoryId]: !prev[categoryId]
    }));
  };

  const exercisesByCategory = state.exerciseCategories.map(category => ({
    ...category,
    exercises: state.exercises.filter(exercise => exercise.category === category.id)
  }));

  const AddExerciseForm = () => {
    const [formData, setFormData] = useState({
      name: "",
      category: state.exerciseCategories[0]?.id || "",
      sets: "",
      reps: "",
      rpe: "",
      notes: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.category) return;

      dispatch({
        type: "ADD_EXERCISE",
        exercise: formData
      });

      setFormData({
        name: "",
        category: state.exerciseCategories[0]?.id || "",
        sets: "",
        reps: "",
        rpe: "",
        notes: ""
      });
      setShowAddExercise(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Agregar Nuevo Ejercicio
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del ejercicio
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="ej. Bench Press"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                required
              >
                {state.exerciseCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Series
                </label>
                <input
                  type="text"
                  value={formData.sets}
                  onChange={(e) => setFormData({...formData, sets: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reps
                </label>
                <input
                  type="text"
                  value={formData.reps}
                  onChange={(e) => setFormData({...formData, reps: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="8-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RPE
                </label>
                <input
                  type="text"
                  value={formData.rpe}
                  onChange={(e) => setFormData({...formData, rpe: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="6-7"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddExercise(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Agregar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddCategoryForm = () => {
    const [formData, setFormData] = useState({
      name: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name) return;

      dispatch({
        type: "ADD_EXERCISE_CATEGORY",
        category: formData
      });

      setFormData({ name: "" });
      setShowAddCategory(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Agregar Nueva Categoría
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de la categoría
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="ej. Push Upper"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Agregar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const filteredCategories = selectedCategory === 'all' 
    ? exercisesByCategory 
    : exercisesByCategory.filter(cat => cat.id === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="hidden lg:block text-2xl font-bold text-gray-900 dark:text-white">
          🏋️ Base de Datos de Ejercicios
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todas las categorías</option>
            {state.exerciseCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddCategory(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            + Categoría
          </button>
          <button
            onClick={() => setShowAddExercise(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            + Ejercicio
          </button>
        </div>
      </div>

      {/* Exercise Categories */}
      <div className="space-y-6">
        {filteredCategories.map(category => (
          <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white cursor-pointer"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-xl font-bold">{category.name}</h4>
                    <p className="text-blue-100 mt-1">
                        {category.exercises.length} ejercicios
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform duration-200 ${!collapsedCategories[category.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
              </div>
            </div>

            {!collapsedCategories[category.id] && (
              <div className="p-6">
                {category.exercises.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No hay ejercicios en esta categoría
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {category.exercises.map((exercise, index) => (
                      <div key={exercise.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 dark:text-white">
                              {exercise.name}
                            </h5>
                            {exercise.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {exercise.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          {exercise.sets && (
                            <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                              {exercise.sets} series
                            </span>
                          )}
                          {exercise.reps && (
                            <span className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                              {exercise.reps} reps
                            </span>
                          )}
                          {exercise.rpe && (
                            <span className="bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                              RPE {exercise.rpe}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>



      {/* Modals */}
      {showAddExercise && <AddExerciseForm />}
      {showAddCategory && <AddCategoryForm />}
    </div>
  );
};