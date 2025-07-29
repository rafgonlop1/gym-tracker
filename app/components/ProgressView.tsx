import { useState } from "react";
import type { AppState, Metric } from "~/types";
import { getLatestValue, getTrend, getTrendIcon, getTrendColor, getColorClasses } from "~/utils/helpers";
import { LineChart } from "./LineChart";

interface ProgressViewProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

export const ProgressView = ({ state, dispatch }: ProgressViewProps) => {
  const [selectedMetric, setSelectedMetric] = useState(state.selectedMetricId || state.metrics[0]?.id);
  const [viewMode, setViewMode] = useState<'chart' | 'compare'>('chart');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const metric = state.metrics.find(m => m.id === selectedMetric);

  if (!metric) return null;

  const maxValue = Math.max(...metric.measurements.map(m => m.value));
  const minValue = Math.min(...metric.measurements.map(m => m.value));
  const avgValue = metric.measurements.reduce((acc, m) => acc + m.value, 0) / metric.measurements.length;
  
  // Calculate progress towards target
  const latestValue = getLatestValue(metric);
  const firstValue = metric.measurements[0]?.value;
  const progressPercentage = metric.target && latestValue && firstValue
    ? metric.targetType === 'lower'
      ? Math.round(((firstValue - latestValue) / (firstValue - metric.target)) * 100)
      : Math.round(((latestValue - firstValue) / (metric.target - firstValue)) * 100)
    : 0;

  // Calculate trend statistics
  const calculateTrendStats = () => {
    if (metric.measurements.length < 2) return { avgChange: 0, totalChange: 0, changePerWeek: 0 };
    
    const totalChange = latestValue! - firstValue;
    const daysDifference = (new Date(metric.measurements[metric.measurements.length - 1].date).getTime() - 
                           new Date(metric.measurements[0].date).getTime()) / (1000 * 60 * 60 * 24);
    const weeksDifference = daysDifference / 7;
    const changePerWeek = weeksDifference > 0 ? totalChange / weeksDifference : 0;
    
    const changes = metric.measurements.slice(1).map((m, i) => m.value - metric.measurements[i].value);
    const avgChange = changes.reduce((acc, c) => acc + c, 0) / changes.length;
    
    return { avgChange, totalChange, changePerWeek };
  };

  const trendStats = calculateTrendStats();

  // Filter measurements by time range
  const getFilteredMeasurements = () => {
    if (timeRange === 'all') return metric.measurements;
    
    const now = new Date();
    const startDate = new Date();
    
    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }
    
    return metric.measurements.filter(m => new Date(m.date) >= startDate);
  };

  const filteredMeasurements = getFilteredMeasurements();

  // Comparison view component
  const ComparisonView = () => {
    const metricsToCompare = state.metrics.filter(m => m.id !== selectedMetric);
    const [compareWith, setCompareWith] = useState<string>(metricsToCompare[0]?.id || '');
    const compareMetric = state.metrics.find(m => m.id === compareWith);
    
    if (!compareMetric || metricsToCompare.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No hay otras métricas para comparar
          </p>
        </div>
      );
    }

    // Normalize values for comparison
    const normalizeValue = (value: number, metric: Metric) => {
      const range = Math.max(...metric.measurements.map(m => m.value)) - Math.min(...metric.measurements.map(m => m.value));
      const min = Math.min(...metric.measurements.map(m => m.value));
      return range > 0 ? ((value - min) / range) * 100 : 50;
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
            📊 Comparación de Métricas
          </h5>
          <select
            value={compareWith}
            onChange={(e) => setCompareWith(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            {metricsToCompare.map(m => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-4 rounded-lg border-2 ${getColorClasses(metric.color)}`}>
            <h6 className="font-semibold text-lg mb-2">{metric.icon} {metric.name}</h6>
            <div className="space-y-2">
              <p>Actual: <span className="font-bold">{getLatestValue(metric)}{metric.unit}</span></p>
              <p>Promedio: <span className="font-bold">{avgValue.toFixed(1)}{metric.unit}</span></p>
              <p>Cambio total: <span className="font-bold">{trendStats.totalChange.toFixed(1)}{metric.unit}</span></p>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${getColorClasses(compareMetric.color)}`}>
            <h6 className="font-semibold text-lg mb-2">{compareMetric.icon} {compareMetric.name}</h6>
            <div className="space-y-2">
              <p>Actual: <span className="font-bold">{getLatestValue(compareMetric)}{compareMetric.unit}</span></p>
              <p>Promedio: <span className="font-bold">
                {(compareMetric.measurements.reduce((acc, m) => acc + m.value, 0) / compareMetric.measurements.length).toFixed(1)}{compareMetric.unit}
              </span></p>
              <p>Cambio total: <span className="font-bold">
                {compareMetric.measurements.length >= 2 
                  ? (getLatestValue(compareMetric)! - compareMetric.measurements[0].value).toFixed(1) 
                  : '0'}{compareMetric.unit}
              </span></p>
            </div>
          </div>
        </div>

        {/* Dual axis chart */}
        <div className="mt-6">
          <svg width={800} height={300} className="w-full h-auto">
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                <stop offset="100%" stopColor="#059669" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Chart for both metrics normalized */}
            {[metric, compareMetric].map((m, idx) => {
              const points = m.measurements.map((measurement, index) => {
                const x = 50 + (index / (m.measurements.length - 1)) * 700;
                const y = 250 - (normalizeValue(measurement.value, m) * 2);
                return { x, y };
              });

              const pathData = points.map((point, index) => 
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
              ).join(' ');

              return (
                <g key={m.id}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={`url(#gradient${idx + 1})`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((point, pointIdx) => (
                    <circle
                      key={pointIdx}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={idx === 0 ? "#3b82f6" : "#10b981"}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with metric selector */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          📈 Análisis Detallado de Progreso
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-medium"
          >
            {state.metrics.map(metric => (
              <option key={metric.id} value={metric.id}>
                {metric.icon} {metric.name}
              </option>
            ))}
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="all">Todo</option>
          </select>

          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "calendar", metricId: selectedMetric })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            📅 Calendario
          </button>
        </div>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('chart')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'chart' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          📊 Gráfico
        </button>
        <button
          onClick={() => setViewMode('compare')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'compare' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          🔄 Comparar
        </button>
      </div>

      {/* Progress Overview Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-2xl font-bold flex items-center gap-3">
              {metric.icon} {metric.name}
            </h4>
            <p className="text-blue-100 mt-1">
              {metric.measurements.length} mediciones registradas
            </p>
          </div>
          {metric.target && (
            <div className="text-right">
              <p className="text-sm text-blue-100">Objetivo</p>
              <p className="text-2xl font-bold">{metric.target}{metric.unit}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {metric.target && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso hacia el objetivo</span>
              <span className="font-bold">{Math.max(0, Math.min(100, progressPercentage))}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📊</span>
            <span className={`text-sm font-medium ${getTrendColor(getTrend(metric), metric.targetType)}`}>
              {getTrendIcon(getTrend(metric))}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {getLatestValue(metric)}{metric.unit}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Valor Actual</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {trendStats.changePerWeek.toFixed(2)}{metric.unit}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cambio/Semana</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📉</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgValue.toFixed(1)}{metric.unit}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Promedio</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {trendStats.totalChange > 0 ? '+' : ''}{trendStats.totalChange.toFixed(1)}{metric.unit}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cambio Total</p>
        </div>
      </div>

      {/* Main content based on view mode */}
      {viewMode === 'chart' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6 shadow-lg">
          <LineChart metric={{...metric, measurements: filteredMeasurements}} />
        </div>
      )}

      {viewMode === 'compare' && <ComparisonView />}

      {/* Detailed measurements table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6 shadow-lg">
        <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📋 Historial Detallado
        </h5>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Fecha</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Valor</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Cambio</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">% Cambio</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Notas</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeasurements.slice().reverse().map((measurement, index) => {
                const actualIndex = metric.measurements.indexOf(measurement);
                const prevMeasurement = actualIndex > 0 ? metric.measurements[actualIndex - 1] : null;
                const change = prevMeasurement ? measurement.value - prevMeasurement.value : 0;
                const percentChange = prevMeasurement && prevMeasurement.value !== 0 
                  ? (change / prevMeasurement.value) * 100 
                  : 0;
                
                const isGoodChange = metric.targetType === 'lower' ? change < 0 : change > 0;
                
                return (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {new Date(measurement.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                      {measurement.value}{metric.unit}
                    </td>
                    <td className="py-3 px-4">
                      {prevMeasurement && (
                        <span className={`font-medium ${isGoodChange ? 'text-green-600' : change !== 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}{metric.unit}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {prevMeasurement && (
                        <span className={`font-medium ${isGoodChange ? 'text-green-600' : change !== 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {measurement.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={() => dispatch({ type: "SET_VIEW", view: "dashboard" })}
        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
      >
        ← Volver al Dashboard
      </button>
    </div>
  );
}; 