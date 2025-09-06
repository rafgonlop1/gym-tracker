// app/data/templates.ts
import { WorkoutExercise, ExerciseSet } from "../types";
import { v4 as uuidv4 } from "uuid";

const createSets = (count: number, reps: string): ExerciseSet[] => {
  const sets: ExerciseSet[] = [];
  for (let i = 1; i <= count; i++) {
    sets.push({
      setNumber: i,
      reps: Number(reps.split("-")[0]), // Take the lower end of a rep range for now
      completed: false,
    });
  }
  return sets;
};

// Function to create workout templates with static IDs
const createWorkoutTemplate = (): Record<string, WorkoutExercise[]> => {
  // Empty to disable in-code default templates. All templates should come from database.
  return {};
};

// Create templates once and export the static instance
export const workoutTemplates = createWorkoutTemplate();


