import { format } from 'date-fns'

/**
 * Create a UTC date at noon to avoid timezone issues
 */
export function createUTCDateAtNoon(date: Date): Date {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0, 0
  ))
}

/**
 * Get today's date at UTC noon
 */
export function getTodayUTC(): Date {
  return createUTCDateAtNoon(new Date())
}

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

/**
 * Get week range for calendar views
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}