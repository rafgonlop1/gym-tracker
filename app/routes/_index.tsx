// app/routes/_index.tsx
import type { MetaFunction } from "@remix-run/node";
import { useReducer, useEffect, useState } from "react";
import { appReducer } from "~/state/reducer";
import { workoutTypes } from "~/data/defaults";
import { DailySheetForm } from "~/components/DailySheetForm";
import { AddMetricForm } from "~/components/AddMetricForm";
import { MetricsManager } from "~/components/MetricsManager";
import { ExercisesView } from "~/components/ExercisesView";
import { CalendarView } from "~/components/CalendarView";
import { ProgressView } from "~/components/ProgressView";
import { TimerView } from "~/components/TimerView";
import { WorkoutTypeSelection } from "~/components/WorkoutTypeSelection";
import { WorkoutActive } from "~/components/WorkoutActive";
import { Navigation } from "~/components/Navigation";
import { ViewTransition } from "~/components/ViewTransition";
import { TemplateManager } from "~/components/TemplateManager";
import { Auth } from "~/components/Auth";
import { useAuth } from "~/hooks/useAuth";
import { createSupabaseClient } from "~/lib/supabase.client";
import { DatabaseService } from "~/services/database";
// Removed dashboard metrics grid helpers
import { v4 as uuidv4 } from 'uuid';

export const meta: MetaFunction = () => {
  return [
    { title: "Gym Tracker - Dashboard" },
    { name: "description", content: "Track your fitness progress with ease" },
  ];
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [state, dispatch] = useReducer(appReducer, {
    metrics: [],
    exercises: [],
    exerciseCategories: [],
    view: "dashboard",
    workoutSessions: [],
    dailyPhotos: [],
    templates: [],
  });
  
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [persistedWorkoutIds, setPersistedWorkoutIds] = useState(new Set<string>());
  const [deletedWorkoutIds, setDeletedWorkoutIds] = useState(new Set<string>());
  const [workoutUpdateTrigger, setWorkoutUpdateTrigger] = useState(0);

  // Load user data from Supabase
  useEffect(() => {
    if (user) {
      loadUserData();
    } else if (!loading) {
      // If there's no user and we are not in a loading state,
      // load public data like exercises.
      loadPublicData();
    }
  }, [user, loading]);

  // Persist workout sessions to database when they are added/modified/deleted
  useEffect(() => {
    const persistWorkoutSessions = async () => {
      if (!user || isLoadingData) return;
      
      const supabase = createSupabaseClient();
      const db = new DatabaseService(supabase);
      
      // Current session IDs in state
      const currentSessionIds = new Set(state.workoutSessions.map(s => s.id));
      
      // Find sessions that have been deleted (were persisted but no longer in state)
      const deletedSessionIds = Array.from(persistedWorkoutIds).filter(id => 
        !currentSessionIds.has(id)
      );
      
      // Debug logging removed for production cleanliness
      
      // Delete sessions from database
      for (const sessionId of deletedSessionIds) {
        try {
          // Delete from database
          await db.deleteWorkoutSession(sessionId);
          
          // Mark as deleted to avoid processing again
          setDeletedWorkoutIds(prev => new Set(prev).add(sessionId));
          setPersistedWorkoutIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(sessionId);
            return newSet;
          });
        } catch (error) {
          console.error('Error deleting workout session from database:', error);
        }
      }
      
      // Find all completed sessions that need to be persisted or updated
      const completedSessions = state.workoutSessions.filter(session => session.completed);
      
      for (const session of completedSessions) {
        try {
          // Check if this session is already persisted
          const alreadyPersisted = persistedWorkoutIds.has(session.id);
          // If it's already persisted, it means we're updating an existing session
          const isEditing = alreadyPersisted;
          
          if (isEditing && alreadyPersisted) {
            // Update existing session - this handles the edit case
            await db.updateWorkoutSession(session.id, {
              endTime: session.endTime,
              totalDuration: session.totalDuration,
              completed: session.completed,
              // Important: only send exercises/cardio if present to avoid wiping
              exercises: session.exercises !== undefined ? session.exercises : undefined,
              cardioActivities: session.cardioActivities !== undefined ? session.cardioActivities : undefined
            });
          } else if (!alreadyPersisted) {
            // Create new session in database
            const { date, workoutType, startTime, endTime, totalDuration, completed, exercises, cardioActivities } = session;
            const newSession = await db.createWorkoutSession(user.id, {
              date,
              workoutType,
              startTime,
              endTime,
              totalDuration,
              completed,
              exercises: exercises || [],
              cardioActivities: cardioActivities || []
            });

            // Replace local temporary ID with DB ID to enable future updates
            if (newSession?.id) {
              dispatch({ type: "REPLACE_WORKOUT_SESSION_ID", localId: session.id, dbId: newSession.id });
              setPersistedWorkoutIds(prev => new Set(prev).add(newSession.id));
            } else {
              // Fallback to mark the local one as persisted if no id returned
              setPersistedWorkoutIds(prev => new Set(prev).add(session.id));
            }
          }
        } catch (error) {
          console.error('Error saving workout session to database:', error);
          console.log('Session that failed to save:', {
            id: session.id,
            date: session.date,
            workoutType: session.workoutType,
            hasExercises: !!session.exercises?.length,
            hasCardio: !!session.cardioActivities?.length,
            totalDuration: session.totalDuration,
            endTime: session.endTime
          });
          // You might want to show a toast notification here
        }
      }
    };

    persistWorkoutSessions();
  }, [state.workoutSessions, state.lastWorkoutUpdate, user, isLoadingData, persistedWorkoutIds, deletedWorkoutIds]);

  const loadPublicData = async () => {
    const supabase = createSupabaseClient();
    const db = new DatabaseService(supabase);
    try {
      setIsLoadingData(true);
      const [exercises, exerciseCategories] = await Promise.all([
        db.getExercises(), // This will now only fetch global exercises
        db.getExerciseCategories(),
      ]);
      dispatch({ type: 'LOAD_PUBLIC_DATA', exercises: exercises || [], exerciseCategories: exerciseCategories || [] });
    } catch (error) {
      console.error('Error loading public data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };
  
  // Transform photos from database format to local state format
  const transformPhotosFromDB = async (dbPhotos: any[]) => {
    const supabase = createSupabaseClient();
    const db = new DatabaseService(supabase);
    
    // Fetch all signed URLs in parallel for speed
    const signedUrls = await Promise.all(
      dbPhotos.map(async (photo) => {
        try {
          const url = await db.getSignedPhotoUrl(photo.photo_url);
          return { ok: true as const, photo, url };
        } catch (error) {
          console.error('Error getting signed URL for photo:', error);
          return { ok: false as const, photo };
        }
      })
    );

    const groupedByDate: Record<string, { date: string; photos: any[] }> = {};

    for (const result of signedUrls) {
      const p = result.photo;
      const date = p.date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date, photos: [] };
      }
      if (result.ok) {
        groupedByDate[date].photos.push({
          id: p.id,
          type: p.photo_type,
          dataUrl: result.url,
          fileName: p.photo_url,
          timestamp: p.created_at,
        });
      }
    }

    return Object.values(groupedByDate);
  };

  const loadUserData = async () => {
    if (!user) return;
    
    const supabase = createSupabaseClient();
    const db = new DatabaseService(supabase);
    
    try {
      setIsLoadingData(true);
      
      let [metrics, templates, workoutSessions, exercises, exerciseCategories, dailyPhotos] = await Promise.all([
        db.getMetrics(user.id),
        db.getWorkoutTemplates(user.id),
        db.getWorkoutSessions(user.id),
        db.getExercises(user.id),
        db.getExerciseCategories(),
        db.getDailyPhotos(user.id),
      ]);

      // Initialize default metrics if user has none
      if (!metrics || metrics.length === 0) {
        await db.initializeDefaultMetrics(user.id);
        metrics = await db.getMetrics(user.id);
      }

      // Transform photos from DB format to local format
      const transformedDailyPhotos = await transformPhotosFromDB(dailyPhotos || []);

      dispatch({
        type: 'LOAD_DATA',
        metrics: metrics || [],
        templates: templates || [],
        workoutSessions: workoutSessions || [],
        exercises: exercises || [],
        exerciseCategories: exerciseCategories || [],
        dailyPhotos: transformedDailyPhotos,
      });
      
      // Mark all loaded workout sessions as already persisted
      const existingIds = new Set((workoutSessions || []).map(session => session.id));
      setPersistedWorkoutIds(existingIds);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Show auth screen if not logged in
  if (!user && !loading) {
    return <Auth />;
  }

  // Show loading screen while checking auth or loading data
  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">💪</div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Calculate current streak
  const calculateCurrentStreak = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activityDates = new Set();

    state.metrics.forEach(metric => {
      metric.measurements.forEach(measurement => {
        const date = new Date(measurement.date);
        date.setHours(0, 0, 0, 0);
        activityDates.add(date.getTime());
      });
    });

    state.workoutSessions.forEach(session => {
      const date = new Date(session.date);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.getTime());
    });

    state.dailyPhotos.forEach(photo => {
      const date = new Date(photo.date);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.getTime());
    });

    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const currentDateMs = currentDate.getTime();
      
      if (activityDates.has(currentDateMs)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        if (streak > 0 || currentDate.getTime() === today.getTime()) {
          if (currentDate.getTime() !== today.getTime()) {
            break;
          }
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return streak;
  };

  const currentStreak = calculateCurrentStreak();

  // Mobile header metadata per view
  const viewHeaderMap: Record<string, { icon: string; title: string }> = {
    dashboard: { icon: '💪', title: 'Gym Tracker' },
    'add-metric': { icon: '➕', title: 'Nueva Métrica' },
    exercises: { icon: '💪', title: 'Ejercicios' },
    calendar: { icon: '📅', title: 'Calendario' },
    progress: { icon: '📈', title: 'Progreso' },
    timer: { icon: '⏱️', title: 'Timer' },
    'workout-selection': { icon: '🏋️', title: 'Iniciar Entrenamiento' },
    'workout-active': { icon: '🏃', title: 'Entrenamiento Activo' },
    templates: { icon: '📄', title: 'Plantillas' },
  };
  const activeHeader = viewHeaderMap[state.view] || viewHeaderMap.dashboard;

  const renderContent = () => {
    switch (state.view) {
      case "add-metric":
        return <ViewTransition><AddMetricForm dispatch={dispatch} /></ViewTransition>;
      case "manage-metrics":
        return <ViewTransition><MetricsManager state={state} dispatch={dispatch} /></ViewTransition>;
      case "exercises":
        return <ViewTransition><ExercisesView state={state} dispatch={dispatch} /></ViewTransition>;
      case "calendar":
        return <ViewTransition><CalendarView state={state} dispatch={dispatch} /></ViewTransition>;
      case "progress":
        return <ViewTransition><ProgressView state={state} dispatch={dispatch} /></ViewTransition>;
      case "timer":
        return <ViewTransition><TimerView dispatch={dispatch} /></ViewTransition>;
      case "workout-selection":
        return <ViewTransition><WorkoutTypeSelection dispatch={dispatch} templates={state.templates} /></ViewTransition>;
      case "workout-active":
        return <ViewTransition><WorkoutActive state={state} dispatch={dispatch} /></ViewTransition>;
      case "templates":
        return <ViewTransition><TemplateManager templates={state.templates} dispatch={dispatch} exercises={state.exercises} exerciseCategories={state.exerciseCategories} userId={user!.id} /></ViewTransition>;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <header className="hidden lg:block bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-3xl animate-pulse">💪</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gym Tracker</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tu progreso diario</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{state.metrics.length}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">métricas</span>
              </div>
              <button className="relative group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-lg transform transition-transform group-hover:scale-110">U</div>
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
            ¡Bienvenido de vuelta!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Racha actual</span>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {currentStreak > 0 ? `${currentStreak} día${currentStreak !== 1 ? 's' : ''} 🔥` : 'Sin racha 😴'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Última actividad</span>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Hace 2h</p>
            </div>
          </div>
        </div>

        {/* Daily Sheet */}
        <div className="mb-10">
          <DailySheetForm state={state} dispatch={dispatch} />
        </div>

        

        
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navigation 
        currentView={state.view} 
        dispatch={dispatch} 
        metricsCount={state.metrics.length}
        onCollapsedChange={setIsNavCollapsed}
        user={user}
      />
      
      <div className={`transition-all duration-300 ${isNavCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`} style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        {state.view !== 'workout-active' && (
          <header className="lg:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
            <div className="px-4 sm:px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{activeHeader.icon}</div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{activeHeader.title}</h1>
                </div>
                {state.view !== 'workout-selection' && (
                  <button
                    onClick={() => dispatch({ type: "SET_VIEW", view: "workout-selection" })}
                    className="flex items-center justify-center h-10 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    aria-label="Iniciar entrenamiento"
                  >
                    <span className="mr-1">🏋️</span>
                    <span className="text-sm font-medium">Entrenar</span>
                  </button>
                )}
              </div>
            </div>
          </header>
        )}

        <div className="min-h-screen pb-20 lg:pb-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
