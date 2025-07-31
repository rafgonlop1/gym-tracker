-- Esquema de base de datos para Gym Tracker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create metrics table
CREATE TABLE public.metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Create measurements table
CREATE TABLE public.measurements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_id UUID REFERENCES public.metrics(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(metric_id, date)
);

-- Create exercises table (global, shared by all users)
CREATE TABLE public.exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  sets INTEGER,
  reps TEXT,
  rpe TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create exercise categories table
CREATE TABLE public.exercise_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create workout templates table
CREATE TABLE public.workout_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create template exercises table (many-to-many)
CREATE TABLE public.template_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_order INTEGER NOT NULL,
  sets JSONB NOT NULL DEFAULT '[]', -- Array of {setNumber, reps, completed}
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create workout sessions table
CREATE TABLE public.workout_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  workout_type TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER, -- in minutes
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create workout exercises table
CREATE TABLE public.workout_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_order INTEGER NOT NULL,
  sets JSONB NOT NULL DEFAULT '[]', -- Array of {setNumber, reps, weight, rpe, completed}
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cardio activities table
CREATE TABLE public.cardio_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  distance DECIMAL(10,2),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  calories INTEGER,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create daily photos table
CREATE TABLE public.daily_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  photo_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Create RLS (Row Level Security) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_photos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Metrics policies
CREATE POLICY "Users can view own metrics" ON public.metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" ON public.metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics" ON public.metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own metrics" ON public.metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Measurements policies
CREATE POLICY "Users can view own measurements" ON public.measurements
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.metrics WHERE id = measurements.metric_id
    )
  );

CREATE POLICY "Users can insert own measurements" ON public.measurements
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.metrics WHERE id = measurements.metric_id
    )
  );

CREATE POLICY "Users can update own measurements" ON public.measurements
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.metrics WHERE id = measurements.metric_id
    )
  );

CREATE POLICY "Users can delete own measurements" ON public.measurements
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.metrics WHERE id = measurements.metric_id
    )
  );

-- Exercises policies (public read, admin write)
CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT USING (true);

-- Exercise categories policies (public read)
CREATE POLICY "Anyone can view exercise categories" ON public.exercise_categories
  FOR SELECT USING (true);

-- Workout templates policies
CREATE POLICY "Users can view own templates" ON public.workout_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.workout_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.workout_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.workout_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Template exercises policies
CREATE POLICY "Users can view own template exercises" ON public.template_exercises
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_templates WHERE id = template_exercises.template_id
    )
  );

CREATE POLICY "Users can insert own template exercises" ON public.template_exercises
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.workout_templates WHERE id = template_exercises.template_id
    )
  );

CREATE POLICY "Users can update own template exercises" ON public.template_exercises
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_templates WHERE id = template_exercises.template_id
    )
  );

CREATE POLICY "Users can delete own template exercises" ON public.template_exercises
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_templates WHERE id = template_exercises.template_id
    )
  );

-- Workout sessions policies
CREATE POLICY "Users can view own sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Workout exercises policies
CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = workout_exercises.session_id
    )
  );

CREATE POLICY "Users can insert own workout exercises" ON public.workout_exercises
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = workout_exercises.session_id
    )
  );

CREATE POLICY "Users can update own workout exercises" ON public.workout_exercises
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = workout_exercises.session_id
    )
  );

CREATE POLICY "Users can delete own workout exercises" ON public.workout_exercises
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = workout_exercises.session_id
    )
  );

-- Cardio activities policies
CREATE POLICY "Users can view own cardio activities" ON public.cardio_activities
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = cardio_activities.session_id
    )
  );

CREATE POLICY "Users can insert own cardio activities" ON public.cardio_activities
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = cardio_activities.session_id
    )
  );

CREATE POLICY "Users can update own cardio activities" ON public.cardio_activities
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = cardio_activities.session_id
    )
  );

CREATE POLICY "Users can delete own cardio activities" ON public.cardio_activities
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = cardio_activities.session_id
    )
  );

-- Daily photos policies
CREATE POLICY "Users can view own photos" ON public.daily_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON public.daily_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON public.daily_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON public.daily_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_metrics_user_id ON public.metrics(user_id);
CREATE INDEX idx_measurements_metric_id ON public.measurements(metric_id);
CREATE INDEX idx_measurements_date ON public.measurements(date);
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date ON public.workout_sessions(date);
CREATE INDEX idx_workout_templates_user_id ON public.workout_templates(user_id);
CREATE INDEX idx_daily_photos_user_id ON public.daily_photos(user_id);
CREATE INDEX idx_daily_photos_date ON public.daily_photos(date);