import { useState } from "react";

interface AddMetricFormProps {
  dispatch: React.Dispatch<any>;
}

export const AddMetricForm = ({ dispatch }: AddMetricFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    icon: "📊",
    color: "blue",
    target: "",
    targetType: "lower" as "lower" | "higher" | "maintain"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) return;

    dispatch({
      type: "ADD_METRIC",
      metric: {
        ...formData,
        target: formData.target ? parseFloat(formData.target) : undefined,
      }
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Agregar Nueva Métrica
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de la métrica
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="ej. Grasa corporal"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unidad de medida
          </label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="ej. %, kg, cm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Icono
            </label>
            <select
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="📊">📊 Gráfico</option>
              <option value="💪">💪 Fuerza</option>
              <option value="🏃">🏃 Resistencia</option>
              <option value="⚖️">⚖️ Peso</option>
              <option value="📏">📏 Medida</option>
              <option value="❤️">❤️ Salud</option>
              <option value="🎯">🎯 Objetivo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <select
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="blue">Azul</option>
              <option value="green">Verde</option>
              <option value="orange">Naranja</option>
              <option value="purple">Morado</option>
              <option value="red">Rojo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Objetivo (opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={formData.target}
              onChange={(e) => setFormData({...formData, target: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Valor objetivo"
            />
            <select
              value={formData.targetType}
              onChange={(e) => setFormData({...formData, targetType: e.target.value as any})}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="lower">Reducir</option>
              <option value="higher">Aumentar</option>
              <option value="maintain">Mantener</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_VIEW", view: "dashboard" })}
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
  );
}; 