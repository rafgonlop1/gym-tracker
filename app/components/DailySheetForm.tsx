import { useState, useEffect } from "react";
import type { AppState, Metric } from "~/types";
import { getColorClasses, getLatestValue } from "~/utils/helpers";

interface DailySheetFormProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

export const DailySheetForm = ({ state, dispatch }: DailySheetFormProps) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [measurements, setMeasurements] = useState<{[key: string]: {value: string, notes: string}}>({});

  // Check if already measured today
  const todayMeasurements = state.metrics.reduce((acc, metric) => {
    const todayMeasurement = metric.measurements.find(m => m.date === today);
    if (todayMeasurement) {
      acc[metric.id] = {
        value: todayMeasurement.value.toString(),
        notes: todayMeasurement.notes || ""
      };
    }
    return acc;
  }, {} as {[key: string]: {value: string, notes: string}});

  useEffect(() => {
    setMeasurements(todayMeasurements);
  }, [today]);

  const handleValueChange = (metricId: string, field: 'value' | 'notes', value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMeasurements = Object.fromEntries(
      Object.entries(measurements).filter(([_, data]) => data.value.trim() !== "")
    );
    
    if (Object.keys(validMeasurements).length === 0) return;

    dispatch({
      type: "ADD_DAILY_MEASUREMENTS",
      date,
      measurements: validMeasurements
    });
  };

  const hasAnyValue = Object.values(measurements).some(m => m?.value?.trim());

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            📋 Ficha Diaria
          </h3>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {state.metrics.map((metric) => (
            <div key={metric.id} className={`p-4 rounded-lg border-2 ${getColorClasses(metric.color)}`}>
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{metric.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{metric.name}</h4>
                  <p className="text-sm opacity-75">
                    Unidad: {metric.unit}
                    {metric.target && ` • Objetivo: ${metric.target}${metric.unit}`}
                  </p>
                </div>
                {getLatestValue(metric) && (
                  <div className="text-right">
                    <p className="text-sm opacity-75">Último valor</p>
                    <p className="font-semibold">{getLatestValue(metric)}{metric.unit}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Valor ({metric.unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={measurements[metric.id]?.value || ""}
                    onChange={(e) => handleValueChange(metric.id, 'value', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white bg-white"
                    placeholder={`ej. ${getLatestValue(metric) || "0"}`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Notas (opcional)
                  </label>
                  <input
                    type="text"
                    value={measurements[metric.id]?.notes || ""}
                    onChange={(e) => handleValueChange(metric.id, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white bg-white"
                    placeholder="Estado de ánimo, observaciones..."
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_VIEW", view: "dashboard" })}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hasAnyValue}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
            >
              Guardar Mediciones
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 