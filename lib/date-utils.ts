import { format } from 'date-fns'

/**
 * Formats a date from the database (stored in UTC) to display in local time
 */
export function formatWorkoutDate(date: Date | string): string {
  const d = new Date(date)
  // Get UTC components
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth()
  const day = d.getUTCDate()
  
  // Create a local date from UTC components
  const localDate = new Date(year, month, day)
  
  return format(localDate, 'EEEE, MMMM d, yyyy')
}

/**
 * Formats a date for display in short format
 */
export function formatWorkoutDateShort(date: Date | string): string {
  const d = new Date(date)
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth()
  const day = d.getUTCDate()
  
  const localDate = new Date(year, month, day)
  
  return format(localDate, 'MMM d, yyyy')
}

/**
 * Check if two dates are the same day (considering UTC storage)
 */
export function isSameWorkoutDay(date1: Date | string, date2: Date): boolean {
  const d1 = new Date(date1)
  return d1.getUTCFullYear() === date2.getFullYear() &&
         d1.getUTCMonth() === date2.getMonth() &&
         d1.getUTCDate() === date2.getDate()
}