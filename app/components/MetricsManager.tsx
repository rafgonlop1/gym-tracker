import { useState } from "react";
import type { AppState } from "~/types";
import { createSupabaseClient } from "~/lib/supabase.client";
import { DatabaseService } from "~/services/database";
import { useAuth } from "~/hooks/useAuth";
import { getColorClasses } from "~/utils/helpers";

interface MetricsManagerProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

export const MetricsManager = ({ state, dispatch }: MetricsManagerProps) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const handleDeleteMetric = async (metricId: string, metricName: string) => {
    if (!user) {
      setError("Debes estar logueado para eliminar métricas");
      return;
    }

    const measurementCount = state.metrics.find(m => m.id === metricId)?.measurements.length || 0;
    const confirmMessage = measurementCount > 0
      ? `¿Estás seguro de que quieres eliminar la métrica "${metricName}"? Se eliminarán también las ${measurementCount} mediciones asociadas. Esta acción no se puede deshacer.`
      : `¿Estás seguro de que quieres eliminar la métrica "${metricName}"? Esta acción no se puede deshacer.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(metricId);
    setError("");

    try {
      const supabase = createSupabaseClient();
      const db = new DatabaseService(supabase);
      
      // Delete from database
      await db.deleteMetric(metricId);
      
      // Update local state
      dispatch({ type: "DELETE_METRIC", metricId });
      
    } catch (error) {
      console.error('Error deleting metric:', error);
      setError("Error al eliminar la métrica. Inténtalo de nuevo.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <h3 className="text-2xl font-bold flex items-center space-x-3">
            <span>⚙️</span>
            <span>Gestionar Métricas</span>
          </h3>
          <p className="mt-2 text-purple-100">
            Administra tus métricas personalizadas
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {state.metrics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No tienes métricas configuradas
              </p>
              <button
                onClick={() => dispatch({ type: "SET_VIEW", view: "add-metric" })}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Crear Primera Métrica
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.metrics.map((metric) => (
                <div
                  key={metric.id}
                  className={`p-4 rounded-lg border-2 ${getColorClasses(metric.color)} relative`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{metric.icon}</span>
                      <div>
                        <h4 className="font-semibold text-lg">{metric.name}</h4>
                        <p className="text-sm opacity-75">
                          Unidad: {metric.unit}
                          {metric.target && ` • Objetivo: ${metric.target}${metric.unit}`}
                        </p>
                        <p className="text-sm opacity-75 mt-1">
                          {metric.measurements.length} mediciones registradas
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => dispatch({ 
                          type: "SET_VIEW", 
                          view: "progress", 
                          metricId: metric.id 
                        })}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        📊 Ver Progreso
                      </button>
                      
                      <button
                        onClick={() => handleDeleteMetric(metric.id, metric.name)}
                        disabled={isDeleting === metric.id}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {isDeleting === metric.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Eliminando...</span>
                          </>
                        ) : (
                          <>
                            <span>🗑️</span>
                            <span>Eliminar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Recent measurements preview */}
                  {metric.measurements.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-opacity-20">
                      <p className="text-sm font-medium mb-2">Últimas mediciones:</p>
                      <div className="flex flex-wrap gap-2">
                        {metric.measurements.slice(-5).map((measurement) => (
                          <div
                            key={measurement.date}
                            className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs"
                          >
                            {new Date(measurement.date).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}: {measurement.value}{metric.unit}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => dispatch({ type: "SET_VIEW", view: "add-metric" })}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Añadir Nueva Métrica</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};