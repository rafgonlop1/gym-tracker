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
  return {
    push: [
      {
        exerciseId: uuidv4(),
        exerciseName: "Bench Press",
        sets: createSets(3, "8"),
        notes: "RPE 6-7",
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Incline DB Press",
        sets: createSets(3, "10"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Overhead Press (dumbbell, seated 80°)",
        sets: createSets(3, "8-10"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Weighted Dips",
        sets: createSets(3, "8-12"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Lateral Raise",
        sets: createSets(3, "15"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Rope Triceps Press-down",
        sets: createSets(3, "15"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Overhead DB Triceps Extension",
        sets: createSets(2, "12-15"),
      },
    ],
    pull: [
      {
        exerciseId: uuidv4(),
        exerciseName: "Weighted Pull-Ups",
        sets: createSets(3, "8"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Single-Arm DB Row (supported)",
        sets: createSets(3, "10"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Chest-Supported Row",
        sets: createSets(3, "8-10"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Face Pull",
        sets: createSets(3, "15"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Inverted Row",
        sets: createSets(2, "12"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "EZ-Bar Curl",
        sets: createSets(3, "10-12"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Hammer Curl",
        sets: createSets(3, "12-15"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Incline DB Curl",
        sets: createSets(2, "12-15"),
      },
    ],
    legs: [
      {
        exerciseId: uuidv4(),
        exerciseName: "Back Squat or Safety-Bar Squat",
        sets: createSets(3, "8"),
        notes: "RPE 6-7",
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Dumbbell RDL",
        sets: createSets(3, "8-10"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Hip Thrust",
        sets: createSets(3, "10"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Bulgarian Split Squat",
        sets: createSets(3, "10"),
        notes: "each leg",
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Leg Extension",
        sets: createSets(2, "15"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Lying Leg Curl",
        sets: createSets(2, "15"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Machine Abductor",
        sets: createSets(2, "15"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Hollow Body Hold",
        sets: createSets(3, "20"),
        notes: "seconds",
      },
    ],
    plyometrics: [
      {
        exerciseId: uuidv4(),
        exerciseName: "Med-Ball Chest Pass (standing)",
        sets: createSets(4, "8"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Box Jump",
        sets: createSets(4, "5"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Depth Jump",
        sets: createSets(3, "5"),
      },
      {
        exerciseId: uuidv4(),
        exerciseName: "Explosive Bulgarian Split",
        sets: createSets(3, "6"),
        notes: "each leg",
      },
    ]
  };
};

// Create templates once and export the static instance
export const workoutTemplates = createWorkoutTemplate();


