import type { Database } from '~/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  Metric, 
  WorkoutSession, 
  WorkoutTemplate, 
  DailyPhoto,
  WorkoutExercise,
  CardioActivity,
  Exercise
} from '~/types'

export class DatabaseService {
  constructor(private supabase: SupabaseClient<Database>) {}

  // ========== AUTH ==========
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) throw error
    return data
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async getUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  // ========== METRICS ==========
  async getMetrics(userId: string) {
    const { data, error } = await this.supabase
      .from('metrics')
      .select(`
        *,
        measurements (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    
    // Transform data to match frontend types
    return data?.map(metric => ({
      id: metric.id,
      name: metric.name,
      unit: metric.unit,
      icon: metric.icon,
      color: metric.color,
      target: metric.target || undefined,
      targetType: metric.target_type || 'lower',
      measurements: (metric.measurements || [])
        .map((m: any) => ({
          date: m.date,
          value: Number(m.value),
          notes: m.notes || undefined
        }))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })) || []
  }

  async createMetric(userId: string, metric: Omit<Metric, 'id' | 'measurements'>) {
    const { data, error } = await this.supabase
      .from('metrics')
      .insert({
        user_id: userId,
        name: metric.name,
        unit: metric.unit,
        color: metric.color,
        icon: metric.icon,
        target: metric.target,
        target_type: metric.targetType
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async addMeasurement(metricId: string, date: string, value: number, notes?: string) {
    const { data, error } = await this.supabase
      .from('measurements')
      .upsert({
        metric_id: metricId,
        date,
        value,
        notes
      }, {
        onConflict: 'metric_id,date'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async initializeDefaultMetrics(userId: string) {
    const { error } = await this.supabase.rpc('initialize_default_metrics_for_user', {
      target_user_id: userId
    })
    if (error) throw error
  }

  // ========== EXERCISES ==========
  async getExercises(userId: string) {
    const { data, error } = await this.supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('name');
  
    if (error) throw error;
    return data;
  }

  async createExercise(userId: string, exercise: Omit<Exercise, 'id' | 'user_id'>) {
    const { data, error } = await this.supabase
      .from('exercises')
      .insert({ ...exercise, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getExerciseCategories() {
    const { data, error } = await this.supabase
      .from('exercise_categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  }

  // ========== WORKOUT TEMPLATES ==========
  async getWorkoutTemplates(userId: string) {
    const { data, error } = await this.supabase
      .from('workout_templates')
      .select(`
        *,
        workoutType:workout_type,
        exercises:template_exercises (
          exerciseId: exercise_id,
          exerciseName: exercise_name,
          sets,
          notes
        ),
        user_id
      `)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async createWorkoutTemplate(userId: string, template: Omit<WorkoutTemplate, 'id'>) {
    // First create the template
    const { data: templateData, error: templateError } = await this.supabase
      .from('workout_templates')
      .insert({
        user_id: userId,
        name: template.name,
        workout_type: template.workoutType
      })
      .select()
      .single()

    if (templateError) throw templateError

    // Then create the exercises
    if (template.exercises.length > 0) {
      const templateExercises = template.exercises.map((exercise, index) => ({
        template_id: templateData.id,
        exercise_id: exercise.exerciseId,
        exercise_name: exercise.exerciseName,
        exercise_order: index,
        sets: exercise.sets,
        notes: exercise.notes
      }))

      const { error: exercisesError } = await this.supabase
        .from('template_exercises')
        .insert(templateExercises)

      if (exercisesError) throw exercisesError
    }

    return templateData
  }

  async updateWorkoutTemplate(templateId: string, updates: Partial<WorkoutTemplate>) {
    const { error } = await this.supabase
      .from('workout_templates')
      .update({
        name: updates.name,
        workout_type: updates.workoutType,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)

    if (error) throw error

    // If exercises are updated, delete old ones and insert new ones
    if (updates.exercises) {
      // Delete existing exercises
      await this.supabase
        .from('template_exercises')
        .delete()
        .eq('template_id', templateId)

      // Insert new exercises
      if (updates.exercises.length > 0) {
        const templateExercises = updates.exercises.map((exercise, index) => ({
          template_id: templateId,
          exercise_id: exercise.exerciseId,
          exercise_name: exercise.exerciseName,
          exercise_order: index,
          sets: exercise.sets,
          notes: exercise.notes
        }))

        const { error: exercisesError } = await this.supabase
          .from('template_exercises')
          .insert(templateExercises)

        if (exercisesError) throw exercisesError
      }
    }
  }

  async deleteWorkoutTemplate(templateId: string) {
    const { error } = await this.supabase
      .from('workout_templates')
      .delete()
      .eq('id', templateId)

    if (error) throw error
  }

  // ========== WORKOUT SESSIONS ==========
  async getWorkoutSessions(userId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_exercises (*),
        cardio_activities (*)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    
    // Transform data to match frontend types
    return data?.map(session => ({
      id: session.id,
      date: session.date,
      workoutType: session.workout_type,
      startTime: session.start_time,
      endTime: session.end_time,
      totalDuration: session.total_duration,
      completed: session.completed,
      exercises: (session.workout_exercises || []).map((ex: any) => ({
        exerciseId: ex.exercise_name, // Use exercise name as ID for consistency
        exerciseName: ex.exercise_name,
        sets: ex.sets || [],
        notes: ex.notes
      })),
      cardioActivities: (session.cardio_activities || []).map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        duration: activity.duration,
        distance: activity.distance,
        intensity: activity.intensity,
        calories: activity.calories,
        heartRate: activity.heart_rate_avg || activity.heart_rate_max ? {
          avg: activity.heart_rate_avg,
          max: activity.heart_rate_max
        } : undefined
      }))
    })) || []
  }

  async createWorkoutSession(userId: string, session: Omit<WorkoutSession, 'id'>) {
    // Create the session
    const { data: sessionData, error: sessionError } = await this.supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        date: session.date,
        workout_type: session.workoutType,
        start_time: session.startTime,
        end_time: session.endTime,
        total_duration: session.totalDuration,
        completed: session.completed
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Create workout exercises
    if (session.exercises && session.exercises.length > 0) {
      const workoutExercises = session.exercises.map((exercise, index) => ({
        session_id: sessionData.id,
        exercise_name: exercise.exerciseName,
        exercise_order: index,
        sets: exercise.sets,
        notes: exercise.notes
      }))

      const { error: exercisesError } = await this.supabase
        .from('workout_exercises')
        .insert(workoutExercises)

      if (exercisesError) throw exercisesError
    }

    // Create cardio activities
    if (session.cardioActivities && session.cardioActivities.length > 0) {
      const cardioActivities = session.cardioActivities.map(activity => ({
        session_id: sessionData.id,
        name: activity.name,
        duration: activity.duration,
        distance: activity.distance,
        intensity: activity.intensity,
        calories: activity.calories,
        heart_rate_avg: activity.heartRate?.avg,
        heart_rate_max: activity.heartRate?.max
      }))

      const { error: cardioError } = await this.supabase
        .from('cardio_activities')
        .insert(cardioActivities)

      if (cardioError) throw cardioError
    }

    return sessionData
  }

  async updateWorkoutSession(sessionId: string, updates: Partial<WorkoutSession>) {
    // Update basic session info
    const { error } = await this.supabase
      .from('workout_sessions')
      .update({
        end_time: updates.endTime,
        total_duration: updates.totalDuration,
        completed: updates.completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error

    // Update exercises if provided
    if (updates.exercises !== undefined) {
      // Delete existing exercises for this session
      await this.supabase
        .from('workout_exercises')
        .delete()
        .eq('session_id', sessionId)

      // Insert updated exercises
      if (updates.exercises.length > 0) {
        const workoutExercises = updates.exercises.map((exercise, index) => ({
          session_id: sessionId,
          exercise_name: exercise.exerciseName,
          exercise_order: index,
          sets: exercise.sets,
          notes: exercise.notes
        }))

        const { error: exercisesError } = await this.supabase
          .from('workout_exercises')
          .insert(workoutExercises)

        if (exercisesError) throw exercisesError
      }
    }

    // Update cardio activities if provided
    if (updates.cardioActivities !== undefined) {
      // Delete existing cardio activities for this session
      await this.supabase
        .from('cardio_activities')
        .delete()
        .eq('session_id', sessionId)

      // Insert updated cardio activities
      if (updates.cardioActivities.length > 0) {
        const cardioActivities = updates.cardioActivities.map(activity => ({
          session_id: sessionId,
          name: activity.name,
          duration: activity.duration,
          distance: activity.distance,
          intensity: activity.intensity,
          calories: activity.calories,
          heart_rate_avg: activity.heartRate?.avg,
          heart_rate_max: activity.heartRate?.max
        }))

        const { error: cardioError } = await this.supabase
          .from('cardio_activities')
          .insert(cardioActivities)

        if (cardioError) throw cardioError
      }
    }
  }

  async deleteWorkoutSession(sessionId: string) {
    // Delete cardio activities first (foreign key constraint)
    const { error: cardioError } = await this.supabase
      .from('cardio_activities')
      .delete()
      .eq('session_id', sessionId)

    if (cardioError) throw cardioError

    // Delete workout exercises (foreign key constraint)
    const { error: exercisesError } = await this.supabase
      .from('workout_exercises')
      .delete()
      .eq('session_id', sessionId)

    if (exercisesError) throw exercisesError

    // Finally delete the workout session
    const { error } = await this.supabase
      .from('workout_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) throw error
  }

  // ========== DAILY PHOTOS ==========
  async getDailyPhotos(userId: string) {
    const { data, error } = await this.supabase
      .from('daily_photos')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data
  }

  async uploadPhoto(userId: string, date: string, file: File, photoType: string, notes?: string) {
    // Upload to Supabase Storage
    const fileName = `${userId}/${date}-${photoType}-${Date.now()}.${file.name.split('.').pop()}`
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('photos')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Save to database with private file path (not public URL)
    const { data, error } = await this.supabase
      .from('daily_photos')
      .upsert({
        user_id: userId,
        date,
        photo_type: photoType,
        photo_url: fileName, // Store file path instead of public URL
        notes
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getSignedPhotoUrl(fileName: string): Promise<string> {
    // Generate a signed URL that expires in 1 hour (3600 seconds)
    const { data, error } = await this.supabase.storage
      .from('photos')
      .createSignedUrl(fileName, 3600) // 1 hour expiry

    if (error) throw error
    return data.signedUrl
  }

  async deletePhoto(photoId: string, fileName: string) {
    // Delete from storage using the stored file path
    const { error: storageError } = await this.supabase.storage
      .from('photos')
      .remove([fileName])
    
    if (storageError) throw storageError
    
    // Delete from database
    const { error } = await this.supabase
      .from('daily_photos')
      .delete()
      .eq('id', photoId)
    
    if (error) throw error
  }

  // ========== SYNC HELPERS ==========
  async syncLocalData(userId: string, localData: any) {
    // This would sync all local data to the database
    // Implementation depends on your specific needs
    console.log('Syncing local data for user:', userId)
  }
}
