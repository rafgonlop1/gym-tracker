import { useState, useMemo, useEffect } from "react";
import type { AppState, Metric, WorkoutSession, WorkoutExercise, DailyPhotos, PhotoType } from "~/types";
import { getLatestValue, getTrend, getTrendIcon, getTrendColor, getColorClasses, getDateString } from "~/utils/helpers";
import { LineChart } from "./LineChart";

// Exercise Progress Chart Component
const ExerciseChart = ({ exerciseData, metricType = 'maxWeight' }: { 
  exerciseData: { id: string, name: string, sessions: Array<{ date: string, sets: Array<{ weight: number, reps: number, rpe?: number }> }> },
  metricType?: 'maxWeight' | 'volume' | 'avgRpe'
}) => {
  if (!exerciseData || exerciseData.sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-4xl mb-4">💪</div>
          <p className="text-lg font-medium">No hay datos para mostrar</p>
          <p className="text-sm mt-2">Realiza más entrenamientos para ver el progreso</p>
        </div>
      </div>
    );
  }

  const width = 800;
  const height = 400;
  const paddingTop = 20;
  const paddingBottom = 50;
  const paddingLeft = 60;
  const paddingRight = 20;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Prepare data points based on metric type
  const dataPoints = exerciseData.sessions.map(session => {
    let value = 0;
    if (metricType === 'maxWeight') {
      value = session.sets.length > 0 ? Math.max(...session.sets.map(set => set.weight || 0)) : 0;
    } else if (metricType === 'volume') {
      value = session.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
    } else if (metricType === 'avgRpe') {
      const rpeValues = session.sets.filter(set => set.rpe);
      value = rpeValues.length > 0 ? rpeValues.reduce((sum, set) => sum + (set.rpe || 0), 0) / rpeValues.length : 0;
    }
    return {
      date: session.date,
      value,
      dateObj: new Date(session.date)
    };
  }).filter(point => point.value > 0);

  if (dataPoints.length === 0) return null;

  const values = dataPoints.map(p => p.value);
  const dates = dataPoints.map(p => p.dateObj);

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const paddedMin = minValue - (valueRange * 0.1);
  const paddedMax = maxValue + (valueRange * 0.1);
  const paddedRange = paddedMax - paddedMin;

  const minDate = Math.min(...dates.map(d => d.getTime()));
  const maxDate = Math.max(...dates.map(d => d.getTime()));
  const dateRange = maxDate - minDate || 1;

  // Create points
  const points = dataPoints.map((point) => {
    const x = paddingLeft + ((point.dateObj.getTime() - minDate) / dateRange) * chartWidth;
    const y = paddingTop + ((paddedMax - point.value) / paddedRange) * chartHeight;
    return { x, y, value: point.value, date: point.date };
  });

  // Create smooth curve path
  const createSmoothPath = (points: Array<{ x: number, y: number, value: number, date: string }>) => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const x0 = i > 0 ? points[i - 1].x : points[i].x;
      const y0 = i > 0 ? points[i - 1].y : points[i].y;
      const x1 = points[i].x;
      const y1 = points[i].y;
      const cp1x = x0 + (x1 - x0) * 0.5;
      const cp1y = y0;
      const cp2x = x0 + (x1 - x0) * 0.5;
      const cp2y = y1;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
    }
    return path;
  };

  const pathData = createSmoothPath(points);
  const areaPath = pathData + ` L ${points[points.length - 1].x} ${height - paddingBottom}` + ` L ${points[0].x} ${height - paddingBottom} Z`;

  // Generate Y-axis labels
  const yAxisLabels = [];
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4;
    const value = paddedMin + (paddedRange * (1 - ratio));
    const y = paddingTop + (ratio * chartHeight);
    yAxisLabels.push({ value, y });
  }

  const getUnit = () => {
    if (metricType === 'maxWeight') return 'kg';
    if (metricType === 'volume') return 'kg';
    if (metricType === 'avgRpe') return '';
    return '';
  };

  const getColor = () => {
    if (metricType === 'maxWeight') return { primary: '#ef4444', secondary: '#dc2626' }; // Red
    if (metricType === 'volume') return { primary: '#10b981', secondary: '#059669' }; // Green
    if (metricType === 'avgRpe') return { primary: '#f59e0b', secondary: '#d97706' }; // Orange
    return { primary: '#3b82f6', secondary: '#2563eb' }; // Blue
  };

  const colors = getColor();

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id={`lineGradient-${metricType}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`areaGradient-${metricType}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
          </linearGradient>
          <filter id={`glow-${metricType}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {yAxisLabels.map((label, index) => (
          <line
            key={`grid-${index}`}
            x1={paddingLeft}
            y1={label.y}
            x2={width - paddingRight}
            y2={label.y}
            stroke={index === yAxisLabels.length - 1 ? "#374151" : "#e5e7eb"}
            strokeWidth={index === yAxisLabels.length - 1 ? "2" : "1"}
            opacity={index === yAxisLabels.length - 1 ? "1" : "0.5"}
            strokeDasharray={index === yAxisLabels.length - 1 ? "0" : "2,2"}
          />
        ))}

        {/* Area under curve */}
        <path d={areaPath} fill={`url(#areaGradient-${metricType})`} stroke="none" />

        {/* Main line */}
        <path
          d={pathData}
          fill="none"
          stroke={`url(#lineGradient-${metricType})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${metricType})`}
        />

        {/* Data points */}
        {points.map((point, index) => {
          const isLatest = index === points.length - 1;
          return (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isLatest ? "5" : "4"}
                fill={colors.primary}
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill="transparent"
                className="cursor-pointer"
              >
                <title>{`${new Date(point.date).toLocaleDateString('es-ES')}: ${point.value.toFixed(1)}${getUnit()}`}</title>
              </circle>
              {isLatest && (
                <g>
                  <rect
                    x={point.x - 35}
                    y={point.y - 35}
                    width="70"
                    height="24"
                    rx="4"
                    fill={colors.secondary}
                    opacity="0.9"
                  />
                  <text
                    x={point.x}
                    y={point.y - 18}
                    fill="white"
                    fontSize="12"
                    textAnchor="middle"
                    className="font-semibold"
                  >
                    {point.value.toFixed(1)}{getUnit()}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Y-axis labels */}
        {yAxisLabels.map((label, index) => (
          <text
            key={`y-label-${index}`}
            x={paddingLeft - 10}
            y={label.y + 4}
            fill="#6b7280"
            fontSize="11"
            textAnchor="end"
            className="font-medium"
          >
            {label.value.toFixed(metricType === 'avgRpe' ? 1 : 0)}
          </text>
        ))}

        {/* X-axis labels */}
        {points.filter((_, index) => {
          if (points.length <= 7) return true;
          if (index === 0 || index === points.length - 1) return true;
          return index % Math.max(1, Math.floor(points.length / 5)) === 0;
        }).map((point, index, filteredPoints) => (
          <g key={`x-label-${index}`}>
            <text
              x={point.x}
              y={height - paddingBottom + 20}
              fill="#6b7280"
              fontSize="11"
              textAnchor={index === 0 ? "start" : index === filteredPoints.length - 1 ? "end" : "middle"}
              className="font-medium"
            >
              {new Date(point.date).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric'
              })}
            </text>
          </g>
        ))}

        {/* Left axis line */}
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke="#374151"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

// Cardio Progress Chart Component
const CardioChart = ({ cardioData, metricType = 'distance' }: { 
  cardioData: { name: string, sessions: Array<{ date: string, duration?: number, distance?: number, calories?: number, intensity?: number }> },
  metricType?: 'distance' | 'duration' | 'pace' | 'calories'
}) => {
  if (!cardioData || cardioData.sessions.length === 0) {
      return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-4xl mb-4">❤️</div>
          <p className="text-lg font-medium">No hay datos para mostrar</p>
          <p className="text-sm mt-2">Registra más actividades de cardio para ver el progreso</p>
        </div>
        </div>
      );
    }

  const width = 800;
  const height = 400;
  const paddingTop = 20;
  const paddingBottom = 50;
  const paddingLeft = 60;
  const paddingRight = 20;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Prepare data points based on metric type
  const dataPoints = cardioData.sessions.map(session => {
    let value = 0;
    if (metricType === 'distance' && session.distance) {
      value = session.distance;
    } else if (metricType === 'duration' && session.duration) {
      value = session.duration;
    } else if (metricType === 'pace' && session.distance && session.duration) {
      value = session.duration / session.distance; // min/km
    } else if (metricType === 'calories' && session.calories) {
      value = session.calories;
    }
    return {
      date: session.date,
      value,
      dateObj: new Date(session.date)
    };
  }).filter(point => point.value > 0);

  if (dataPoints.length === 0) return null;

  const values = dataPoints.map(p => p.value);
  const dates = dataPoints.map(p => p.dateObj);

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const paddedMin = minValue - (valueRange * 0.1);
  const paddedMax = maxValue + (valueRange * 0.1);
  const paddedRange = paddedMax - paddedMin;

  const minDate = Math.min(...dates.map(d => d.getTime()));
  const maxDate = Math.max(...dates.map(d => d.getTime()));
  const dateRange = maxDate - minDate || 1;

  // Create points
  const points = dataPoints.map((point) => {
    const x = paddingLeft + ((point.dateObj.getTime() - minDate) / dateRange) * chartWidth;
    const y = paddingTop + ((paddedMax - point.value) / paddedRange) * chartHeight;
    return { x, y, value: point.value, date: point.date };
  });

  // Create smooth curve path
  const createSmoothPath = (points: Array<{ x: number, y: number, value: number, date: string }>) => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const x0 = i > 0 ? points[i - 1].x : points[i].x;
      const y0 = i > 0 ? points[i - 1].y : points[i].y;
      const x1 = points[i].x;
      const y1 = points[i].y;
      const cp1x = x0 + (x1 - x0) * 0.5;
      const cp1y = y0;
      const cp2x = x0 + (x1 - x0) * 0.5;
      const cp2y = y1;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
    }
    return path;
  };

  const pathData = createSmoothPath(points);
  const areaPath = pathData + ` L ${points[points.length - 1].x} ${height - paddingBottom}` + ` L ${points[0].x} ${height - paddingBottom} Z`;

  // Generate Y-axis labels
  const yAxisLabels = [];
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4;
    const value = paddedMin + (paddedRange * (1 - ratio));
    const y = paddingTop + (ratio * chartHeight);
    yAxisLabels.push({ value, y });
  }

  const getUnit = () => {
    if (metricType === 'distance') return 'km';
    if (metricType === 'duration') return 'min';
    if (metricType === 'pace') return 'min/km';
    if (metricType === 'calories') return 'cal';
    return '';
  };

  const getColor = () => {
    if (metricType === 'distance') return { primary: '#3b82f6', secondary: '#2563eb' }; // Blue
    if (metricType === 'duration') return { primary: '#10b981', secondary: '#059669' }; // Green
    if (metricType === 'pace') return { primary: '#f59e0b', secondary: '#d97706' }; // Orange
    if (metricType === 'calories') return { primary: '#ef4444', secondary: '#dc2626' }; // Red
    return { primary: '#3b82f6', secondary: '#2563eb' }; // Blue
  };

  const colors = getColor();

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <defs>
          <linearGradient id={`cardioLineGradient-${metricType}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="1" />
              </linearGradient>
          <linearGradient id={`cardioAreaGradient-${metricType}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
              </linearGradient>
          <filter id={`cardioGlow-${metricType}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
            </defs>

        {/* Grid lines */}
        {yAxisLabels.map((label, index) => (
          <line
            key={`grid-${index}`}
            x1={paddingLeft}
            y1={label.y}
            x2={width - paddingRight}
            y2={label.y}
            stroke={index === yAxisLabels.length - 1 ? "#374151" : "#e5e7eb"}
            strokeWidth={index === yAxisLabels.length - 1 ? "2" : "1"}
            opacity={index === yAxisLabels.length - 1 ? "1" : "0.5"}
            strokeDasharray={index === yAxisLabels.length - 1 ? "0" : "2,2"}
          />
        ))}

        {/* Area under curve */}
        <path d={areaPath} fill={`url(#cardioAreaGradient-${metricType})`} stroke="none" />

        {/* Main line */}
                  <path
                    d={pathData}
                    fill="none"
          stroke={`url(#cardioLineGradient-${metricType})`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
          filter={`url(#cardioGlow-${metricType})`}
        />

        {/* Data points */}
        {points.map((point, index) => {
          const isLatest = index === points.length - 1;
          return (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isLatest ? "5" : "4"}
                fill={colors.primary}
                stroke="white"
                strokeWidth="2"
              />
                    <circle
                      cx={point.x}
                      cy={point.y}
                r="10"
                fill="transparent"
                className="cursor-pointer"
              >
                <title>{`${new Date(point.date).toLocaleDateString('es-ES')}: ${point.value.toFixed(1)}${getUnit()}`}</title>
              </circle>
              {isLatest && (
                <g>
                  <rect
                    x={point.x - 35}
                    y={point.y - 35}
                    width="70"
                    height="24"
                    rx="4"
                    fill={colors.secondary}
                    opacity="0.9"
                  />
                  <text
                    x={point.x}
                    y={point.y - 18}
                    fill="white"
                    fontSize="12"
                    textAnchor="middle"
                    className="font-semibold"
                  >
                    {point.value.toFixed(1)}{getUnit()}
                  </text>
                </g>
              )}
                </g>
              );
            })}

        {/* Y-axis labels */}
        {yAxisLabels.map((label, index) => (
          <text
            key={`y-label-${index}`}
            x={paddingLeft - 10}
            y={label.y + 4}
            fill="#6b7280"
            fontSize="11"
            textAnchor="end"
            className="font-medium"
          >
            {label.value.toFixed(1)}
          </text>
        ))}

        {/* X-axis labels */}
        {points.filter((_, index) => {
          if (points.length <= 7) return true;
          if (index === 0 || index === points.length - 1) return true;
          return index % Math.max(1, Math.floor(points.length / 5)) === 0;
        }).map((point, index, filteredPoints) => (
          <g key={`x-label-${index}`}>
            <text
              x={point.x}
              y={height - paddingBottom + 20}
              fill="#6b7280"
              fontSize="11"
              textAnchor={index === 0 ? "start" : index === filteredPoints.length - 1 ? "end" : "middle"}
              className="font-medium"
            >
              {new Date(point.date).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric'
              })}
            </text>
          </g>
        ))}

        {/* Left axis line */}
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke="#374151"
          strokeWidth="2"
        />
          </svg>
      </div>
    );
  };

interface ProgressViewProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

export const ProgressView = ({ state, dispatch }: ProgressViewProps) => {
  const [activeTab, setActiveTab] = useState<'exercises' | 'cardio' | 'metrics' | 'photos'>('exercises');
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [selectedCardioActivity, setSelectedCardioActivity] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [selectedPhotoDate, setSelectedPhotoDate] = useState<string>('');
  const [photoComparison, setPhotoComparison] = useState<{ startDate: string, endDate: string } | null>(null);

  // Sync selectedMetric with state changes
  useEffect(() => {
    const initialMetric = state.selectedMetricId || state.metrics[0]?.id || '';
    setSelectedMetric(initialMetric);
  }, [state.selectedMetricId, state.metrics]);

  // If a metric is pre-selected (e.g., from DailySheet), open Metrics tab directly
  useEffect(() => {
    if (state.selectedMetricId) {
      setActiveTab('metrics');
    }
  }, [state.selectedMetricId]);

  // Get all unique exercises from workout sessions
  const exerciseData = useMemo(() => {
    const exerciseMap = new Map<string, {
      name: string;
      sessions: Array<{
        date: string;
        sets: Array<{
          weight: number;
          reps: number;
          rpe?: number;
          completed: boolean;
        }>;
      }>;
    }>();
    
    // Track unique (sessionId, exerciseId) pairs to avoid duplicates from DB
    const seenPairs = new Set<string>();

    state.workoutSessions.forEach(session => {
      if (session.exercises) {
        session.exercises.forEach(exercise => {
          const exerciseKey = exercise.exerciseId || exercise.exerciseName;
          if (!exerciseKey || !exercise.exerciseName) return;

          if (!exerciseMap.has(exerciseKey)) {
            exerciseMap.set(exerciseKey, {
              name: exercise.exerciseName,
              sessions: []
            });
          }
          
          const pairKey = `${session.id}:${exerciseKey}`;
          if (seenPairs.has(pairKey)) return; // prevent counting same exercise multiple times per session
          seenPairs.add(pairKey);

          exerciseMap.get(exerciseKey)!.sessions.push({
            date: session.date,
            sets: exercise.sets.map(set => ({
              weight: set.weight || 0,
              reps: set.reps || 0,
              rpe: set.rpe,
              completed: set.completed
            }))
          });
        });
      }
    });

    return Array.from(exerciseMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        sessions: data.sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }))
      // Show only exercises that have at least one set recorded (entries)
      .filter(ex => ex.sessions.some(session =>
        session.sets.some(set => (set.reps || 0) > 0 || (set.weight || 0) > 0 || set.completed)
      ));
  }, [state.workoutSessions]);

  // Get all unique cardio activities
  const cardioData = useMemo(() => {
    const cardioMap = new Map<string, {
      sessions: Array<{
        date: string;
        duration?: number;
        distance?: number;
        calories?: number;
        intensity?: number;
        heartRate?: { avg?: number; max?: number; };
      }>;
    }>();

    state.workoutSessions.forEach(session => {
      if (session.cardioActivities) {
        session.cardioActivities.forEach(activity => {
          if (!cardioMap.has(activity.name)) {
            cardioMap.set(activity.name, { sessions: [] });
          }
          
          cardioMap.get(activity.name)!.sessions.push({
            date: session.date,
            duration: activity.duration,
            distance: activity.distance,
            calories: activity.calories,
            intensity: activity.intensity,
            heartRate: activity.heartRate
          });
        });
      }
    });

    return Array.from(cardioMap.entries()).map(([name, data]) => ({
      name,
      sessions: data.sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }));
  }, [state.workoutSessions]);

  // Set initial selections with useEffect to avoid infinite loops
  useEffect(() => {
    if (!selectedExercise && exerciseData.length > 0) {
      setSelectedExercise(exerciseData[0].id);
    }
  }, [selectedExercise, exerciseData]);

  useEffect(() => {
    if (!selectedCardioActivity && cardioData.length > 0) {
      setSelectedCardioActivity(cardioData[0].name);
    }
  }, [selectedCardioActivity, cardioData]);

  // Chart metric state for exercises and cardio
  const [exerciseChartMetric, setExerciseChartMetric] = useState<'maxWeight' | 'volume' | 'avgRpe'>('maxWeight');
  const [cardioChartMetric, setCardioChartMetric] = useState<'distance' | 'duration' | 'pace' | 'calories'>('distance');

  // Render exercise progress view
  const renderExerciseProgress = () => {
    if (exerciseData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-6xl mb-4">🏋️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay ejercicios registrados
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Inicia un entrenamiento para comenzar a ver tu progreso
          </p>
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "workout-selection" })}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Iniciar Entrenamiento
          </button>
        </div>
      );
    }

    const selectedExerciseData = exerciseData.find(ex => ex.id === selectedExercise);
    
    if (!selectedExerciseData) return null;

    // Calculate exercise stats
    const allSets = selectedExerciseData.sessions.flatMap(session => 
      session.sets.map(set => ({ ...set, date: session.date }))
    );
    
    const maxWeight = allSets.length > 0 ? Math.max(...allSets.map(set => set.weight || 0)) : 0;
    const totalVolume = allSets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
    const rpeValues = allSets.filter(set => set.rpe);
    const avgRpe = rpeValues.length > 0 ? rpeValues.reduce((sum, set) => sum + (set.rpe || 0), 0) / rpeValues.length : 0;

  return (
      <div className="space-y-4">
        {/* Exercise Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-300 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              💪 Progreso de Ejercicios
        </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecciona ejercicio</label>
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {exerciseData.map(exercise => (
                    <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                  ))}
                </select>
              </div>
              <div className="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
                {[
                  { key: 'maxWeight', label: 'Peso', icon: '🏋️' },
                  { key: 'volume', label: 'Volumen', icon: '💯' },
                  { key: 'avgRpe', label: 'RPE', icon: '⚡' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setExerciseChartMetric(opt.key as any)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      exerciseChartMetric === opt.key
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    aria-pressed={exerciseChartMetric === (opt.key as any)}
                  >
                    <span className="mr-1">{opt.icon}</span>{opt.label}
                  </button>
                ))}
              </div>
            </div>
        </div>
      </div>

        {/* Exercise Stats - compact inline bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">🏋️</span>
              <span className="font-semibold text-gray-900 dark:text-white">{maxWeight}kg</span>
              <span className="text-gray-500 dark:text-gray-400">Peso máx</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">📊</span>
              <span className="font-semibold text-gray-900 dark:text-white">{selectedExerciseData.sessions.length}</span>
              <span className="text-gray-500 dark:text-gray-400">Sesiones</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">💯</span>
              <span className="font-semibold text-gray-900 dark:text-white">{totalVolume.toFixed(0)}</span>
              <span className="text-gray-500 dark:text-gray-400">Volumen (kg)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="font-semibold text-gray-900 dark:text-white">{avgRpe > 0 ? avgRpe.toFixed(1) : '-'}</span>
              <span className="text-gray-500 dark:text-gray-400">RPE prom</span>
            </div>
          </div>
        </div>

        {/* Exercise Progress Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📈 Progreso de {selectedExerciseData.name} - {exerciseChartMetric === 'maxWeight' ? 'Peso Máximo' : exerciseChartMetric === 'volume' ? 'Volumen' : 'RPE Promedio'}
          </h4>
          <ExerciseChart exerciseData={selectedExerciseData} metricType={exerciseChartMetric} />
        </div>

        {/* Exercise History Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 shadow-md">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📋 Historial de {selectedExerciseData.name}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Fecha</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Sets</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Peso Máx</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Volumen</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">RPE Prom</th>
                </tr>
              </thead>
              <tbody>
                {selectedExerciseData.sessions.slice().reverse().map((session, index) => {
                  const sessionMaxWeight = session.sets.length > 0 ? Math.max(...session.sets.map(set => set.weight || 0)) : 0;
                  const sessionVolume = session.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
                  const sessionRpeValues = session.sets.filter(set => set.rpe);
                  const sessionAvgRpe = sessionRpeValues.length > 0 ? sessionRpeValues.reduce((sum, set) => sum + (set.rpe || 0), 0) / sessionRpeValues.length : 0;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {new Date(session.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {session.sets.length} sets
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                        {sessionMaxWeight}kg
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {sessionVolume.toFixed(0)}kg
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {sessionAvgRpe > 0 ? sessionAvgRpe.toFixed(1) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            </div>
          </div>
    );
  };

  // Get photos data organized by date
  const photosData = useMemo(() => {
    return state.dailyPhotos
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(dayPhotos => dayPhotos.photos.length > 0);
  }, [state.dailyPhotos]);

  // Get unique dates with photos
  const photoDates = useMemo(() => {
    return photosData.map(dp => dp.date);
  }, [photosData]);

  // Render photos progress view
  const renderPhotosProgress = () => {
    if (photosData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay fotos de progreso
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Ve a Ficha Diaria para subir tus primeras fotos de progreso
          </p>
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "dashboard" })}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Ir a Ficha Diaria
          </button>
        </div>
      );
    }

    // If no date selected, pick the most recent
    const displayDate = selectedPhotoDate || photoDates[0];
    const dayPhotos = photosData.find(dp => dp.date === displayDate);

    if (!dayPhotos) return null;

    const photoTypes: { type: PhotoType; label: string; icon: string }[] = [
      { type: "front", label: "Frente", icon: "👤" },
      { type: "back", label: "Espalda", icon: "🔄" },
      { type: "side", label: "Lado", icon: "↩️" },
    ];

    const getPhotoByType = (type: PhotoType) => {
      return dayPhotos.photos.find(photo => photo.type === type);
    };

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📸</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {photosData.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Días con fotos</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🗓️</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {photosData.reduce((total, dp) => total + dp.photos.length, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total fotos</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Date(photoDates[0]).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Última foto</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round((photosData.reduce((total, dp) => total + dp.photos.length, 0) / (photosData.length * 3)) * 100)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completitud</p>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              📅 Seleccionar Fecha
            </h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPhotoComparison(photoComparison ? null : { startDate: photoDates[photoDates.length - 1] || '', endDate: photoDates[0] || '' })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  photoComparison 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {photoComparison ? '✕ Salir Comparación' : '🔍 Comparar'}
              </button>
            </div>
          </div>

          <select
            value={displayDate}
            onChange={(e) => setSelectedPhotoDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={!!photoComparison}
          >
            {photoDates.map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('es-ES', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {' '}({photosData.find(dp => dp.date === date)?.photos.length || 0} fotos)
              </option>
            ))}
          </select>
        </div>

        {/* Comparison Mode */}
        {photoComparison && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 shadow-md">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🔍 Modo Comparación
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Inicial (Antes)
                </label>
                <select
                  value={photoComparison.startDate}
                  onChange={(e) => setPhotoComparison({ ...photoComparison, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {photoDates.slice().reverse().map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('es-ES', { 
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Final (Después)
                </label>
                <select
                  value={photoComparison.endDate}
                  onChange={(e) => setPhotoComparison({ ...photoComparison, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {photoDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('es-ES', { 
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Photos Display */}
        {photoComparison ? (
          // Comparison Mode
          <div className="space-y-6">
            {photoTypes.map(({ type, label, icon }) => {
              const beforePhoto = photosData.find(dp => dp.date === photoComparison.startDate)?.photos.find(p => p.type === type);
              const afterPhoto = photosData.find(dp => dp.date === photoComparison.endDate)?.photos.find(p => p.type === type);

              return (
                <div key={type} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-xl">{icon}</span>
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white">{label}</h5>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Photo */}
                    <div className="space-y-2">
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Antes ({new Date(photoComparison.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})
                      </h6>
                      <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
                        {beforePhoto ? (
                          <img
                            src={beforePhoto.dataUrl}
                            alt={`Foto de ${label} - Antes`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <span className="text-2xl">📷</span>
                              <p className="text-sm mt-2">Sin foto</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* After Photo */}
                    <div className="space-y-2">
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Después ({new Date(photoComparison.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})
                      </h6>
                      <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
                        {afterPhoto ? (
                          <img
                            src={afterPhoto.dataUrl}
                            alt={`Foto de ${label} - Después`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <span className="text-2xl">📷</span>
                              <p className="text-sm mt-2">Sin foto</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Single Date Mode
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                📸 Fotos del {new Date(displayDate).toLocaleDateString('es-ES', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h4>
              <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full">
                {dayPhotos.photos.length}/3 fotos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {photoTypes.map(({ type, label, icon }) => {
                const photo = getPhotoByType(type);
                
                return (
                  <div key={type} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                    </div>
                    
                    <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
                      {photo ? (
                        <img
                          src={photo.dataUrl}
                          alt={`Foto de ${label}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => {
                            // Open in modal or fullscreen
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                            modal.innerHTML = `
                              <div class="relative max-w-3xl max-h-[90vh] overflow-hidden">
                                <img src="${photo.dataUrl}" alt="${label}" class="max-w-full max-h-full object-contain rounded-lg" />
                                <button class="absolute top-4 right-4 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-200" onclick="this.parentElement.parentElement.remove()">×</button>
                              </div>
                            `;
                            document.body.appendChild(modal);
                            modal.addEventListener('click', (e) => {
                              if (e.target === modal) modal.remove();
                            });
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <span className="text-3xl">📷</span>
                            <p className="text-sm mt-2">Sin foto de {label.toLowerCase()}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {photo && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {new Date(photo.timestamp).toLocaleString('es-ES')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📈 Línea de Tiempo
          </h4>
          <div className="overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {photoDates.map((date, index) => {
                const dayPhotos = photosData.find(dp => dp.date === date);
                const isSelected = date === displayDate;
                
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedPhotoDate(date)}
                    className={`
                      flex-shrink-0 p-3 rounded-lg border-2 transition-all min-w-[120px]
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
                      }
                    `}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(date).toLocaleDateString('es-ES', { 
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dayPhotos?.photos.length || 0} fotos
                    </div>
                    {index === 0 && (
                      <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full mt-1">
                        Más reciente
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render cardio progress view
  const renderCardioProgress = () => {
    if (cardioData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay actividades de cardio registradas
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Registra una sesión de cardio para ver tu progreso
          </p>
          <button
            onClick={() => dispatch({ type: "SET_VIEW", view: "workout-selection" })}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Iniciar Entrenamiento
          </button>
        </div>
      );
    }

    const selectedCardioData = cardioData.find(activity => activity.name === selectedCardioActivity);
    
    if (!selectedCardioData) return null;

    // Calculate cardio stats
    const totalSessions = selectedCardioData.sessions.length;
    const totalDistance = selectedCardioData.sessions.reduce((sum, session) => sum + (session.distance || 0), 0);
    const totalDuration = selectedCardioData.sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const avgPace = totalDistance > 0 && totalDuration > 0 ? totalDuration / totalDistance : 0;

    return (
      <div className="space-y-6">
                {/* Cardio Activity Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              ❤️ Progreso de Cardio
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecciona actividad</label>
                <select
                  value={selectedCardioActivity}
                  onChange={(e) => setSelectedCardioActivity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {cardioData.map(activity => (
                    <option key={activity.name} value={activity.name}>{activity.name}</option>
                  ))}
                </select>
              </div>
              <div className="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
                {[
                  { key: 'distance', label: 'Dist', icon: '📏' },
                  { key: 'duration', label: 'Tiempo', icon: '⏱️' },
                  { key: 'pace', label: 'Pace', icon: '🎯' },
                  { key: 'calories', label: 'Cal', icon: '🔥' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setCardioChartMetric(opt.key as any)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      cardioChartMetric === opt.key
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    aria-pressed={cardioChartMetric === (opt.key as any)}
                  >
                    <span className="mr-1">{opt.icon}</span>{opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cardio Stats - compact inline bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">🏃</span>
              <span className="font-semibold text-gray-900 dark:text-white">{totalSessions}</span>
              <span className="text-gray-500 dark:text-gray-400">Sesiones</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">📏</span>
              <span className="font-semibold text-gray-900 dark:text-white">{totalDistance.toFixed(1)}km</span>
              <span className="text-gray-500 dark:text-gray-400">Distancia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">⏱️</span>
              <span className="font-semibold text-gray-900 dark:text-white">{Math.round(totalDuration)}min</span>
              <span className="text-gray-500 dark:text-gray-400">Tiempo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span className="font-semibold text-gray-900 dark:text-white">{avgPace > 0 ? `${avgPace.toFixed(1)}min/km` : '-'}</span>
              <span className="text-gray-500 dark:text-gray-400">Pace prom</span>
            </div>
          </div>
        </div>

        {/* Cardio Progress Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📈 Progreso de {selectedCardioData.name} - {cardioChartMetric === 'distance' ? 'Distancia' : cardioChartMetric === 'duration' ? 'Duración' : cardioChartMetric === 'pace' ? 'Pace' : 'Calorías'}
          </h4>
          <CardioChart cardioData={selectedCardioData} metricType={cardioChartMetric} />
        </div>

        {/* Cardio History Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📋 Historial de {selectedCardioData.name}
          </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Fecha</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Duración</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Distancia</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Pace</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Calorías</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Intensidad</th>
              </tr>
            </thead>
            <tbody>
                {selectedCardioData.sessions.slice().reverse().map((session, index) => {
                  const pace = session.distance && session.duration ? session.duration / session.distance : null;
                
                return (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {new Date(session.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {session.duration ? `${session.duration}min` : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                        {session.distance ? `${session.distance}km` : '-'}
                    </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {pace ? `${pace.toFixed(1)}min/km` : '-'}
                    </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {session.calories || '-'}
                    </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {session.intensity ? `${session.intensity}/10` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    );
  };

  // Render metrics progress (original functionality)
  const renderMetricsProgress = () => {
    const metric = state.metrics.find(m => m.id === selectedMetric);
    if (!metric) return null;

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">📊 Progreso de Métricas</h3>
            <div className="min-w-[180px]">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              >
                {state.metrics.map(metric => (
                  <option key={metric.id} value={metric.id}>
                    {metric.icon} {metric.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <LineChart metric={metric} />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header (hide on mobile to avoid duplication with app header) */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="hidden lg:block text-2xl font-bold text-gray-900 dark:text-white">
          📈 Progreso
        </h3>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('exercises')}
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'exercises'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-pressed={activeTab === 'exercises'}
            >
              <span>💪</span>
              <span>Ejercicios</span>
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === 'exercises' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>{exerciseData.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('cardio')}
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'cardio'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-pressed={activeTab === 'cardio'}
            >
              <span>❤️</span>
              <span>Cardio</span>
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === 'cardio' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>{cardioData.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'metrics'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-pressed={activeTab === 'metrics'}
            >
              <span>📊</span>
              <span>Métricas</span>
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === 'metrics' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>{state.metrics.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'photos'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-pressed={activeTab === 'photos'}
            >
              <span>📸</span>
              <span>Fotos</span>
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === 'photos' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>{photosData.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'exercises' && renderExerciseProgress()}
      {activeTab === 'cardio' && renderCardioProgress()}
      {activeTab === 'metrics' && renderMetricsProgress()}
      {activeTab === 'photos' && renderPhotosProgress()}


    </div>
  );
}; 