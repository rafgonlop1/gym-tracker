import { useState, useRef, useEffect, useCallback } from 'react';

export function useRestTimer() {
  const [restTime, setRestTime] = useState(0); // time in seconds
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restDuration, setRestDuration] = useState(90); // default 90 seconds
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, []);

  const startRestTimer = useCallback(() => {
    setRestTime(restDuration);
    setIsRestTimerActive(true);
    
    restIntervalRef.current = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 1) {
          if (restIntervalRef.current) {
            clearInterval(restIntervalRef.current);
          }
          setIsRestTimerActive(false);
          // Play notification sound
          if (audioRef.current) {
            audioRef.current.play().catch(console.error);
          }
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('¡Descanso terminado!', {
              body: 'Es hora de continuar con tu entrenamiento',
              icon: '/favicon.ico'
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [restDuration]);

  const stopRestTimer = useCallback(() => {
    setIsRestTimerActive(false);
    setRestTime(0);
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const pauseRestTimer = useCallback(() => {
    setIsRestTimerActive(false);
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
  }, []);

  const resumeRestTimer = useCallback(() => {
    if (restTime > 0) {
      setIsRestTimerActive(true);
      restIntervalRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            if (restIntervalRef.current) {
              clearInterval(restIntervalRef.current);
            }
            setIsRestTimerActive(false);
            if (audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
            if (Notification.permission === 'granted') {
              new Notification('¡Descanso terminado!', {
                body: 'Es hora de continuar con tu entrenamiento',
                icon: '/favicon.ico'
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [restTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    restTime,
    isRestTimerActive,
    restDuration,
    setRestDuration,
    startRestTimer,
    stopRestTimer,
    pauseRestTimer,
    resumeRestTimer,
    formatTime,
    audioRef
  };
} 