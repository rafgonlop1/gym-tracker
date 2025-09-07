import { useState, useEffect } from "react";
import { useRestTimer } from "~/hooks/useRestTimer";
import { useTabataTimer } from "~/hooks/useTabataTimer";
import type { AppDispatch, TimerMode } from "~/types";

interface TimerViewProps {
  dispatch: AppDispatch;
}

export function TimerView({ dispatch }: TimerViewProps) {
  const [timerMode, setTimerMode] = useState<TimerMode>("rest");
  
  const {
    restTime,
    isRestTimerActive,
    restDuration,
    setRestDuration,
    startRestTimer,
    stopRestTimer,
    pauseRestTimer,
    resumeRestTimer,
    formatTime: formatRestTime,
    audioRef: restAudioRef,
  } = useRestTimer();

  const {
    currentTime: tabataTime,
    isActive: isTabataActive,
    currentPhase,
    currentRound,
    config: tabataConfig,
    startTimer: startTabataTimer,
    pauseTimer: pauseTabataTimer,
    resumeTimer: resumeTabataTimer,
    stopTimer: stopTabataTimer,
    formatTime: formatTabataTime,
    getPhaseDisplayName,
    getTotalTime,
    getElapsedTime,
    audioRef: tabataAudioRef
  } = useTabataTimer();

  const [isEditing, setIsEditing] = useState(false);
  const [timeInputValue, setTimeInputValue] = useState("00:00");

  useEffect(() => {
    if (!isEditing && timerMode === "rest") {
      setTimeInputValue(formatRestTime(restDuration));
    }
  }, [restDuration, isEditing, formatRestTime, timerMode]);

  const handleTimeDisplayClick = () => {
    if (!isRestTimerActive && timerMode === "rest") {
      setIsEditing(true);
      setTimeInputValue(formatRestTime(restDuration));
    }
  };

  const handleTimeInputBlur = () => {
    const parts = timeInputValue.split(':').map(part => parseInt(part, 10) || 0);
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      seconds = parts[0];
    }
    setRestDuration(seconds);
    setIsEditing(false);
  };

  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimeInputBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };
  
  const presets = [
    { label: "5s", value: 5 },
    { label: "30s", value: 30 },
    { label: "1m", value: 60 },
    { label: "1m 30s", value: 90 },
    { label: "2m", value: 120 },
    { label: "3m", value: 180 },
    { label: "5m", value: 300 },
  ];

  const isTimerActive = timerMode === "rest" ? isRestTimerActive : isTabataActive;
  const displayedTime = timerMode === "rest" 
    ? (isRestTimerActive ? restTime : restDuration)
    : tabataTime;
  const formatTime = timerMode === "rest" ? formatRestTime : formatTabataTime;
  const audioRef = timerMode === "rest" ? restAudioRef : tabataAudioRef;

  // Dynamic colors based on Tabata phase
  const getTimerGradient = () => {
    if (timerMode === "rest") {
      return "from-blue-600 to-purple-600"; // Original rest timer colors
    }
    
    switch (currentPhase) {
      case 'warmup':
        return "from-orange-500 to-yellow-500"; // Warm-up: orange to yellow
      case 'work':
        return "from-red-600 to-red-800"; // Work: intense red
      case 'rest':
        return "from-green-500 to-blue-500"; // Rest: calming green to blue
      case 'finished':
        return "from-purple-600 to-pink-600"; // Finished: celebration colors
      default:
        return "from-blue-600 to-purple-600"; // Default
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold">{timerMode === "rest" ? "Rest Timer" : "Tabata Timer"}</h1>
            <p className="text-gray-500 dark:text-gray-400">
                {timerMode === "rest" ? "Time your rests between sets" : "High-intensity interval training"}
            </p>
            
            {/* Mode Selector */}
            <div className="mt-4 flex justify-center space-x-2">
              <button
                onClick={() => !isTimerActive && setTimerMode("rest")}
                disabled={isTimerActive}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timerMode === "rest"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                } disabled:opacity-50`}
                aria-pressed={timerMode === 'rest'}
                aria-label="Rest Timer"
              >
                Rest Timer
              </button>
              <button
                onClick={() => !isTimerActive && setTimerMode("tabata")}
                disabled={isTimerActive}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timerMode === "tabata"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                } disabled:opacity-50`}
                aria-pressed={timerMode === 'tabata'}
                aria-label="Tabata"
              >
                Tabata
              </button>
            </div>
        </div>

        <div className={`bg-gradient-to-r ${getTimerGradient()} rounded-xl p-6 text-white shadow-2xl transition-all duration-1000 ${
          timerMode === "tabata" && currentPhase === 'work' && isTabataActive ? 'animate-pulse' : ''
        } ${
          timerMode === "tabata" && tabataTime <= 3 && tabataTime > 0 && isTabataActive ? 'ring-4 ring-white/50 ring-opacity-75' : ''
        }`}>
          <div className="flex flex-col items-center justify-center space-y-6">
            {timerMode === "rest" ? (
              /* REST TIMER INTERFACE */
              <>
                <div className="text-center" onClick={handleTimeDisplayClick}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={timeInputValue}
                      onChange={(e) => setTimeInputValue(e.target.value)}
                      onBlur={handleTimeInputBlur}
                      onKeyDown={handleTimeInputKeyDown}
                      autoFocus
                      className="text-7xl font-mono font-bold bg-transparent text-white text-center w-64 outline-none border-b-2 border-white/50"
                    />
                  ) : (
                    <div className="text-7xl font-mono font-bold cursor-pointer" title="Click to edit" aria-label="Edit rest time">
                      {formatTime(displayedTime)}
                    </div>
                  )}
                  <div className="text-sm opacity-80 h-5 mt-1">
                    {isRestTimerActive ? 'Resting...' : (restTime === 0 && !isRestTimerActive ? 'Ready' : 'Paused')}
                  </div>
                </div>
                
                {restTime > 0 && (
                  <div className="w-full">
                    <div className="w-full bg-white/20 rounded-full h-2.5">
                      <div 
                        className="bg-white h-2.5 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${100 - (restTime / restDuration) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* TABATA TIMER INTERFACE */
              <>
                <div className="text-center">
                  <div className="text-7xl font-mono font-bold">
                    {formatTime(displayedTime)}
                  </div>
                  <div className="text-lg font-semibold mt-2 flex items-center justify-center space-x-2">
                    <span>
                      {currentPhase === 'warmup' && '🏃‍♂️'}
                      {currentPhase === 'work' && '💪'}
                      {currentPhase === 'rest' && '😮‍💨'}
                      {currentPhase === 'finished' && '🎉'}
                    </span>
                    <span>{getPhaseDisplayName(currentPhase)}</span>
                  </div>
                  {currentPhase !== 'warmup' && currentPhase !== 'finished' && (
                    <div className="text-sm opacity-80 mt-1">
                      Round {currentRound} / {tabataConfig.rounds}
                    </div>
                  )}
                </div>
                
                {/* Overall Progress Bar */}
                {currentPhase !== 'finished' && getTotalTime() > 0 && (
                  <div className="w-full">
                    <div className="w-full bg-white/20 rounded-full h-2.5">
                      <div 
                        className="bg-white h-2.5 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${(getElapsedTime() / getTotalTime()) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="text-xs opacity-75 mt-1 text-center">
                      {formatTabataTime(getElapsedTime())} / {formatTabataTime(getTotalTime())}
                    </div>
                  </div>
                )}
                
                {/* Removed Tabata configuration button to keep UI simple */}
              </>
            )}
            
             <div className="flex items-center space-x-4">
              {timerMode === "rest" ? (
                /* REST TIMER CONTROLS */
                <>
                  {!isRestTimerActive && restTime === 0 && (
                    <button
                      onClick={startRestTimer}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
                    >
                      <span>▶️</span>
                      <span>Start</span>
                    </button>
                  )}
                  
                  {isRestTimerActive && (
                    <button
                      onClick={pauseRestTimer}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
                    >
                      <span>⏸️</span>
                      <span>Pause</span>
                    </button>
                  )}
                  
                  {!isRestTimerActive && restTime > 0 && (
                    <button
                      onClick={resumeRestTimer}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
                    >
                      <span>▶️</span>
                      <span>Resume</span>
                    </button>
                  )}
                  
                  {restTime > 0 && (
                    <button
                      onClick={stopRestTimer}
                      className="flex items-center space-x-2 bg-red-500/80 hover:bg-red-500 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
                    >
                      <span>⏹️</span>
                      <span>Stop</span>
                    </button>
                  )}
                </>
              ) : (
                /* TABATA TIMER CONTROLS */
                <>
                  {!isTabataActive && currentPhase !== 'finished' && (
                    <button
                      onClick={startTabataTimer}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
                    >
                      <span>▶️</span>
                      <span>{tabataTime === 0 ? 'Start' : 'Resume'}</span>
                    </button>
                  )}
                  
                  {isTabataActive && (
                    <button
                      onClick={pauseTabataTimer}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
                    >
                      <span>⏸️</span>
                      <span>Pause</span>
                    </button>
                  )}
                  
                  {!isTabataActive && tabataTime > 0 && currentPhase !== 'finished' && (
                    <button
                      onClick={resumeTabataTimer}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
                    >
                      <span>▶️</span>
                      <span>Resume</span>
                    </button>
                  )}
                  
                  {(tabataTime > 0 || currentPhase === 'finished') && (
                    <button
                      onClick={stopTabataTimer}
                      className="flex items-center space-x-2 bg-red-500/80 hover:bg-red-500 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
                    >
                      <span>⏹️</span>
                      <span>Stop</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rest Timer Presets */}
        {timerMode === "rest" && (
          <div className="mt-6">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">Presets</p>
              <div className="flex flex-wrap justify-center gap-2">
                {presets.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setRestDuration(preset.value)}
                    disabled={isRestTimerActive}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
          </div>
        )}
        
        {/* Tabata configuration removed */}

      </div>
      
      <audio 
        ref={restAudioRef}
        preload="auto"
      >
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAYBzuU2vi2dyMGK3vI7NiQQAoU" type="audio/wav" />
      </audio>
      
      <audio 
        ref={tabataAudioRef}
        preload="auto"
      >
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAYBzuU2vi2dyMGK3vI7NiQQAoU" type="audio/wav" />
      </audio>
    </div>
  );
} 