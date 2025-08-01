import { useState } from "react";
import { createSupabaseClient } from "~/lib/supabase.client";
import { DatabaseService } from "~/services/database";
import { useAuth } from "~/hooks/useAuth";

interface AddMetricFormProps {
  dispatch: React.Dispatch<any>;
}

export const AddMetricForm = ({ dispatch }: AddMetricFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    icon: "📊",
    color: "blue",
    target: "",
    targetType: "decrease" as "decrease" | "increase"
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    
    if (!formData.unit.trim()) {
      newErrors.unit = "La unidad es requerida";
    }
    
    if (formData.target && isNaN(parseFloat(formData.target))) {
      newErrors.target = "El objetivo debe ser un número válido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) {
      setErrors({ submit: "Debes estar logueado para crear métricas" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = createSupabaseClient();
      const db = new DatabaseService(supabase);
      
      // Save to database first
      const savedMetric = await db.createMetric(user.id, {
        name: formData.name,
        unit: formData.unit,
        icon: formData.icon,
        color: formData.color,
        target: formData.target ? parseFloat(formData.target) : undefined,
        targetType: formData.targetType
      });
      
      // Then update local state
      dispatch({
        type: "ADD_METRIC",
        metric: {
          id: savedMetric.id,
          name: savedMetric.name,
          unit: savedMetric.unit,
          icon: savedMetric.icon,
          color: savedMetric.color,
          target: formData.target ? parseFloat(formData.target) : undefined,
          targetType: formData.targetType,
          measurements: []
        }
      });
      
    } catch (error) {
      console.error('Error creating metric:', error);
      setErrors({ submit: "Error al crear la métrica. Inténtalo de nuevo." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Icon and color preview
  const iconOptions = [
    { value: "📊", label: "Gráfico" },
    { value: "💪", label: "Fuerza" },
    { value: "🏃", label: "Resistencia" },
    { value: "⚖️", label: "Peso" },
    { value: "📏", label: "Medida" },
    { value: "❤️", label: "Salud" },
    { value: "🎯", label: "Objetivo" },
    { value: "🔥", label: "Calorías" },
    { value: "💧", label: "Hidratación" },
    { value: "🏆", label: "Logro" }
  ];

  const colorOptions = [
    { value: "blue", label: "Azul", class: "bg-blue-500" },
    { value: "green", label: "Verde", class: "bg-green-500" },
    { value: "orange", label: "Naranja", class: "bg-orange-500" },
    { value: "purple", label: "Morado", class: "bg-purple-500" },
    { value: "red", label: "Rojo", class: "bg-red-500" },
    { value: "yellow", label: "Amarillo", class: "bg-yellow-500" },
    { value: "pink", label: "Rosa", class: "bg-pink-500" },
    { value: "indigo", label: "Índigo", class: "bg-indigo-500" }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header with preview */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">
              Nueva Métrica
            </h3>
          </div>
          
          {/* Live preview */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{formData.icon}</span>
              <div>
                <p className="font-semibold text-lg">
                  {formData.name || "Nombre de la métrica"}
                </p>
                <p className="text-sm opacity-80">
                  {formData.target ? `Objetivo: ${formData.target} ${formData.unit}` : "Sin objetivo definido"}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la métrica
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value});
                  if (errors.name) setErrors({...errors, name: ""});
                }}
                className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="ej. Grasa corporal"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unidad de medida
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => {
                  setFormData({...formData, unit: e.target.value});
                  if (errors.unit) setErrors({...errors, unit: ""});
                }}
                className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.unit ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="ej. %, kg, cm"
              />
              {errors.unit && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unit}</p>
              )}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecciona un icono
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setFormData({...formData, icon: icon.value})}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.icon === icon.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  title={icon.label}
                >
                  <span className="text-2xl">{icon.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color del tema
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({...formData, color: color.value})}
                  className={`relative h-12 rounded-lg transition-all hover:scale-110 ${color.class} ${
                    formData.color === color.value ? 'ring-4 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : ''
                  }`}
                  title={color.label}
                >
                  {formData.color === color.value && (
                    <svg className="absolute inset-0 m-auto w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Target Configuration */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Configuración de objetivo (opcional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor objetivo
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.target}
                  onChange={(e) => {
                    setFormData({...formData, target: e.target.value});
                    if (errors.target) setErrors({...errors, target: ""});
                  }}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white ${
                    errors.target ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="ej. 15"
                />
                {errors.target && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.target}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de objetivo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, targetType: "decrease"})}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      formData.targetType === "decrease"
                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    ↓ Reducir
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, targetType: "increase"})}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      formData.targetType === "increase"
                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    ↑ Aumentar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creando...</span>
                </span>
              ) : (
                "Crear Métrica"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 