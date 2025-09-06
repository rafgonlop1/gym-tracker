import type { Metric } from '~/types';

export const getLatestValue = (metric: Metric) => {
  if (metric.measurements.length === 0) return null;
  
  // First, try to get today's value
  const today = getDateString();
  const todayMeasurement = metric.measurements.find(m => m.date === today);
  if (todayMeasurement) {
    return todayMeasurement.value;
  }
  
  // If no measurement for today, get the most recent one
  return metric.measurements[metric.measurements.length - 1].value;
};

export const getPreviousValue = (metric: Metric) => {
  if (metric.measurements.length < 2) return null;
  
  const today = getDateString();
  const todayMeasurement = metric.measurements.find(m => m.date === today);
  
  if (todayMeasurement) {
    // If we have today's measurement, get the most recent one before today
    const previousMeasurements = metric.measurements
      .filter(m => m.date !== today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return previousMeasurements.length > 0 ? previousMeasurements[0].value : null;
  }
  
  // If no measurement for today, get the second most recent
  return metric.measurements[metric.measurements.length - 2].value;
};

export const getTrend = (metric: Metric) => {
  const latest = getLatestValue(metric);
  const previous = getPreviousValue(metric);
  if (latest == null || previous == null) return "stable";
  return latest > previous ? "up" : latest < previous ? "down" : "stable";
};

export const getTrendIcon = (trend: string) => {
  return trend === "up" ? "📈" : trend === "down" ? "📉" : "➡️";
};

export const getTrendColor = (trend: string, targetType?: string) => {
  if (trend === "stable") return "text-gray-600";
  // Support synonyms: lower/decrease and higher/increase
  if (targetType === "lower" || targetType === "decrease") {
    return trend === "down" ? "text-green-600" : "text-red-600";
  }
  if (targetType === "higher" || targetType === "increase") {
    return trend === "up" ? "text-green-600" : "text-red-600";
  }
  return "text-gray-600";
};

export const getColorClasses = (color: string) => {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
    green: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
    orange: "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300",
    purple: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300",
    red: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

// Helper function to create date strings without timezone issues
export const getDateString = (year?: number, month?: number, day?: number) => {
  if (year && month !== undefined && day) {
    // month is 0-indexed in JavaScript Date, but we want 1-indexed for string
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }
  
  // If no parameters, return today's date
  const now = new Date();
  const yearStr = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
  return `${yearStr}-${monthStr}-${dayStr}`;
}; 