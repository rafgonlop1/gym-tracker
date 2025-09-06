import { useState, useRef, useEffect, useCallback } from 'react';
import type { TabataConfig, TabataPhase } from '~/types';

export function useTabataTimer() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<TabataPhase>('warmup');
  const [currentRound, setCurrentRound] = useState(1);
  const [config, setConfig] = useState<TabataConfig>({
    warmupTime: 10,
    workTime: 20,
    restTime: 10,
    rounds: 8
  });
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentRoundRef = useRef(currentRound);
  const currentPhaseRef = useRef(currentPhase);

  // Keep refs in sync with state
  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getPhaseTime = useCallback((phase: TabataPhase): number => {
    switch (phase) {
      case 'warmup':
        return config.warmupTime;
      case 'work':
        return config.workTime;
      case 'rest':
        return config.restTime;
      default:
        return 0;
    }
  }, [config]);

  const playNotification = useCallback((phase: TabataPhase, round?: number) => {
    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Browser notification
    if (Notification.permission === 'granted') {
      let title = '';
      let body = '';
      
      switch (phase) {
        case 'warmup':
          title = '¡Calentamiento!';
          body = 'Prepárate para comenzar';
          break;
        case 'work':
          title = '¡Trabajo!';
          body = `Round ${round} - ¡Dale con todo!`;
          break;
        case 'rest':
          title = '¡Descanso!';
          body = `Round ${round} completado - Descansa`;
          break;
        case 'finished':
          title = '¡Tabata completado!';
          body = '¡Excelente trabajo! Has terminado todos los rounds';
          break;
      }
      
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
    }
  }, []);

  const nextPhase = useCallback(() => {
    const currentPhaseValue = currentPhaseRef.current;
    const currentRoundValue = currentRoundRef.current;
    
    switch (currentPhaseValue) {
      case 'warmup':
        setCurrentPhase('work');
        setCurrentTime(getPhaseTime('work'));
        playNotification('work', currentRoundValue);
        break;
        
      case 'work':
        if (currentRoundValue < config.rounds) {
          setCurrentPhase('rest');
          setCurrentTime(getPhaseTime('rest'));
          playNotification('rest', currentRoundValue);
        } else {
          setCurrentPhase('finished');
          setCurrentTime(0);
          playNotification('finished');
          setIsActive(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
        break;
        
      case 'rest':
        setCurrentPhase('work');
        setCurrentRound(currentRoundValue + 1);
        setCurrentTime(getPhaseTime('work'));
        playNotification('work', currentRoundValue + 1);
        break;
        
      default:
        break;
    }
  }, [config.rounds, getPhaseTime, playNotification]);

  const startTimer = useCallback(() => {
    setCurrentPhase('warmup');
    setCurrentRound(1);
    setCurrentTime(config.warmupTime);
    setIsActive(true);
    playNotification('warmup');
    
    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev <= 1) {
          nextPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [config.warmupTime, nextPhase, playNotification]);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (currentTime > 0 && currentPhase !== 'finished') {
      setIsActive(true);
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev <= 1) {
            nextPhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [currentTime, currentPhase, nextPhase]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
    setCurrentTime(0);
    setCurrentPhase('warmup');
    setCurrentRound(1);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getPhaseDisplayName = useCallback((phase: TabataPhase) => {
    switch (phase) {
      case 'warmup':
        return 'Calentamiento';
      case 'work':
        return 'Trabajo';
      case 'rest':
        return 'Descanso';
      case 'finished':
        return 'Completado';
      default:
        return '';
    }
  }, []);

  const getTotalTime = useCallback(() => {
    return config.warmupTime + (config.workTime + config.restTime) * config.rounds;
  }, [config]);

  const getElapsedTime = useCallback(() => {
    let elapsed = 0;
    
    if (currentPhase === 'warmup') {
      elapsed = config.warmupTime - currentTime;
    } else {
      elapsed = config.warmupTime;
      const completedRounds = currentRound - 1;
      elapsed += completedRounds * (config.workTime + config.restTime);
      
      if (currentPhase === 'work') {
        elapsed += config.workTime - currentTime;
      } else if (currentPhase === 'rest') {
        elapsed += config.workTime + (config.restTime - currentTime);
      } else if (currentPhase === 'finished') {
        elapsed = getTotalTime();
      }
    }
    
    return elapsed;
  }, [currentPhase, currentTime, currentRound, config, getTotalTime]);

  return {
    currentTime,
    isActive,
    currentPhase,
    currentRound,
    config,
    setConfig,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
    getPhaseDisplayName,
    getTotalTime,
    getElapsedTime,
    audioRef
  };
}