import { useState, useEffect, useCallback, useRef } from 'react'

interface TimerState {
  seconds: number
  isRunning: boolean
  isPaused: boolean
}

interface UseTimerOptions {
  initialTime?: number
  onComplete?: () => void
  autoStart?: boolean
}

export function useTimer({
  initialTime = 60,
  onComplete,
  autoStart = false,
}: UseTimerOptions = {}) {
  const [state, setState] = useState<TimerState>({
    seconds: initialTime,
    isRunning: autoStart,
    isPaused: false,
  })
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const pausedTimeRef = useRef<number>(0)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (state.isPaused) {
      // Resume from pause
      startTimeRef.current = Date.now() - pausedTimeRef.current
      setState(prev => ({ ...prev, isRunning: true, isPaused: false }))
    } else {
      // Start fresh
      startTimeRef.current = Date.now()
      setState(prev => ({ ...prev, seconds: initialTime, isRunning: true, isPaused: false }))
    }
  }, [initialTime, state.isPaused])

  const pause = useCallback(() => {
    if (state.isRunning && !state.isPaused) {
      pausedTimeRef.current = Date.now() - startTimeRef.current
      clearTimer()
      setState(prev => ({ ...prev, isRunning: false, isPaused: true }))
    }
  }, [state.isRunning, state.isPaused, clearTimer])

  const stop = useCallback(() => {
    clearTimer()
    pausedTimeRef.current = 0
    setState({
      seconds: initialTime,
      isRunning: false,
      isPaused: false,
    })
  }, [initialTime, clearTimer])

  const setTime = useCallback((newTime: number) => {
    const wasRunning = state.isRunning
    stop()
    setState(prev => ({ ...prev, seconds: newTime }))
    if (wasRunning) {
      setTimeout(() => start(), 0)
    }
  }, [state.isRunning, stop, start])

  // Timer logic
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const remaining = Math.max(0, initialTime - elapsed)
        
        setState(prev => ({ ...prev, seconds: remaining }))
        
        if (remaining === 0) {
          clearTimer()
          setState(prev => ({ ...prev, isRunning: false }))
          onComplete?.()
        }
      }, 100) // Update every 100ms for smooth display
    } else {
      clearTimer()
    }

    return clearTimer
  }, [state.isRunning, state.isPaused, initialTime, onComplete, clearTimer])

  const toggle = useCallback(() => {
    if (state.isRunning) {
      pause()
    } else {
      start()
    }
  }, [state.isRunning, pause, start])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    seconds: state.seconds,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    start,
    pause,
    stop,
    toggle,
    setTime,
    formatTime,
    formattedTime: formatTime(state.seconds),
  }
}