export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      metrics: {
        Row: {
          id: string
          user_id: string
          name: string
          unit: string
          color: string
          icon: string
          created_at: string
          // Added to reflect DB
          updated_at: string
          target: number | null
          target_type: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          unit: string
          color: string
          icon: string
          created_at?: string
          // Added to reflect DB
          updated_at?: string
          target?: number | null
          target_type?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          unit?: string
          color?: string
          icon?: string
          created_at?: string
          // Added to reflect DB
          updated_at?: string
          target?: number | null
          target_type?: string | null
        }
      }
      measurements: {
        Row: {
          id: string
          metric_id: string
          date: string
          value: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          metric_id: string
          date: string
          value: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          metric_id?: string
          date?: string
          value?: number
          notes?: string | null
          created_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          category: string
          sets: number | null
          reps: string | null
          rpe: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          sets?: number | null
          reps?: string | null
          rpe?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          sets?: number | null
          reps?: string | null
          rpe?: string | null
          created_at?: string
        }
      }
      exercise_categories: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      workout_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          workout_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          workout_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          workout_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      template_exercises: {
        Row: {
          id: string
          template_id: string
          exercise_name: string
          exercise_order: number
          sets: Json
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          exercise_name: string
          exercise_order: number
          sets?: Json
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          exercise_name?: string
          exercise_order?: number
          sets?: Json
          notes?: string | null
          created_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          workout_type: string
          start_time: string
          end_time: string | null
          total_duration: number | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          workout_type: string
          start_time: string
          end_time?: string | null
          total_duration?: number | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          workout_type?: string
          start_time?: string
          end_time?: string | null
          total_duration?: number | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          session_id: string
          exercise_name: string
          exercise_order: number
          sets: Json
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_name: string
          exercise_order: number
          sets?: Json
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_name?: string
          exercise_order?: number
          sets?: Json
          notes?: string | null
          created_at?: string
        }
      }
      cardio_activities: {
        Row: {
          id: string
          session_id: string
          name: string
          duration: number
          distance: number | null
          intensity: number | null
          calories: number | null
          heart_rate_avg: number | null
          heart_rate_max: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          duration: number
          distance?: number | null
          intensity?: number | null
          calories?: number | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          duration?: number
          distance?: number | null
          intensity?: number | null
          calories?: number | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          created_at?: string
        }
      }
      daily_photos: {
        Row: {
          id: string
          user_id: string
          date: string
          photo_type: string
          photo_url: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          photo_type: string
          photo_url: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          photo_type?: string
          photo_url?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}