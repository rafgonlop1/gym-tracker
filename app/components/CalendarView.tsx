import { useState } from "react";
import type { AppState, Metric, Measurement } from "~/types";
import { getLatestValue } from "~/utils/helpers";

interface CalendarViewProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

export const CalendarView = ({ state, dispatch }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Create a map of dates to all measurements for that date
  const createDailyDataMap = () => {
    const dailyData = new Map<string, Array<{metric: Metric, measurement: Measurement}>>();
    
    state.metrics.forEach(metric => {
      metric.measurements.forEach(measurement => {
        const dateStr = measurement.date;
        if (!dailyData.has(dateStr)) {
          dailyData.set(dateStr, []);
        }
        dailyData.get(dateStr)!.push({ metric, measurement });
      });
    });
    
    return dailyData;
  };

  const dailyDataMap = createDailyDataMap();

  const calendar = [];
  let week = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    week.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    const dayData = dailyDataMap.get(dateStr) || [];
    
    week.push({ date: dateStr, day, dayData });
    
    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }

  // Add remaining week if not complete
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    calendar.push(week);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDay(dateStr);
    setShowEditModal(true);
  };

  const today = new Date().toISOString().split('T')[0];

  // Edit Day Modal Component
  const EditDayModal = () => {
    if (!selectedDay) return null;

    const [formData, setFormData] = useState<Record<string, {value: string, notes: string}>>(() => {
      const initialData: Record<string, {value: string, notes: string}> = {};
      
      state.metrics.forEach(metric => {
        const existingMeasurement = metric.measurements.find(m => m.date === selectedDay);
        initialData[metric.id] = {
          value: existingMeasurement?.value.toString() || '',
          notes: existingMeasurement?.notes || ''
        };
      });
      
      return initialData;
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Filter out empty values and prepare for dispatch
      const measurementsToSave: Record<string, {value: string, notes: string}> = {};
      Object.entries(formData).forEach(([metricId, data]) => {
        if (data.value.trim()) {
          measurementsToSave[metricId] = data;
        }
      });

      if (Object.keys(measurementsToSave).length > 0) {
        dispatch({
          type: "ADD_DAILY_MEASUREMENTS",
          date: selectedDay,
          measurements: measurementsToSave
        });
      }

      setShowEditModal(false);
      setSelectedDay(null);
    };

    const selectedDate = new Date(selectedDay);
    const dayData = dailyDataMap.get(selectedDay) || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                📅 Editar día - {selectedDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {state.metrics.map(metric => {
                const currentValue = formData[metric.id]?.value || '';
                const currentNotes = formData[metric.id]?.notes || '';
                const latestValue = getLatestValue(metric);

                return (
                  <div key={metric.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{metric.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {metric.name}
                        </h4>
                        {latestValue && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Último valor: {latestValue}{metric.unit}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Valor ({metric.unit})
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={currentValue}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [metric.id]: {
                              ...prev[metric.id],
                              value: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                          placeholder={`ej. ${latestValue || '0'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notas (opcional)
                        </label>
                        <input
                          type="text"
                          value={currentNotes}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [metric.id]: {
                              ...prev[metric.id],
                              notes: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                          placeholder="Notas adicionales..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          📅 Calendario - Ficha Diaria
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Haz click en cualquier día para editarlo
        </div>
      </div>

      {/* Monthly Stats - Moved to top */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6 shadow-lg">
        <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📊 Estadísticas del Mes
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(() => {
            const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(currentYear, currentMonth, i + 1);
              return date.toISOString().split('T')[0];
            });
            
            const daysWithData = monthDates.filter(date => dailyDataMap.has(date)).length;
            const totalMeasurements = monthDates.reduce((total, date) => {
              return total + (dailyDataMap.get(date)?.length || 0);
            }, 0);
            
            return (
              <>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {daysWithData}/{daysInMonth}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Días con datos
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {totalMeasurements}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total mediciones
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {daysWithData > 0 ? (totalMeasurements / daysWithData).toFixed(1) : '0'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Promedio por día
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-2xl">←</span>
          </button>
          
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            {firstDay.toLocaleDateString('es-ES', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-2xl">→</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-3">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendar.map((week, weekIndex) => (
            week.map((day, dayIndex) => {
              if (!day) {
                return <div key={`${weekIndex}-${dayIndex}`} className="aspect-square" />;
              }
              
              const hasData = day.dayData.length > 0;
              const isToday = day.date === today;
              const metricsCount = day.dayData.length;
              const totalMetrics = state.metrics.length;
              const completionPercentage = totalMetrics > 0 ? (metricsCount / totalMetrics) * 100 : 0;
              
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  onClick={() => handleDayClick(day.date)}
                  className={`
                    aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center relative cursor-pointer
                    ${hasData 
                      ? completionPercentage >= 80
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' 
                        : completionPercentage >= 50
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'}
                    ${isToday ? 'ring-3 ring-orange-500 ring-opacity-60' : ''}
                    hover:shadow-lg transition-all transform hover:scale-105
                  `}
                  title={`${day.day} - ${hasData ? `${metricsCount}/${totalMetrics} métricas registradas` : 'Click para agregar datos'}`}
                >
                  <span className={`text-lg font-bold ${hasData ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                    {day.day}
                  </span>
                  
                  {hasData && (
                    <div className="flex flex-wrap gap-1 mt-1 justify-center">
                      {day.dayData.slice(0, 3).map((data, idx) => (
                        <span key={idx} className="text-xs">
                          {data.metric.icon}
                        </span>
                      ))}
                      {day.dayData.length > 3 && (
                        <span className="text-xs text-gray-600">+{day.dayData.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  {!hasData && (
                    <span className="text-xs text-gray-400 mt-1">+</span>
                  )}
                  
                  {isToday && (
                    <span className="absolute bottom-0 left-1 text-orange-500 text-[10px] font-bold">
                      HOY
                    </span>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => dispatch({ type: "SET_VIEW", view: "dashboard" })}
        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
      >
        ← Volver al Dashboard
      </button>

      {/* Edit Day Modal */}
      {showEditModal && <EditDayModal />}
    </div>
  );
}; 