import { PrismaClient, WorkoutType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  // Clear existing data
  await prisma.templateExercise.deleteMany()
  await prisma.workoutTemplate.deleteMany()
  await prisma.set.deleteMany()
  await prisma.cMJTest.deleteMany()
  await prisma.cardioSession.deleteMany()
  await prisma.workoutExercise.deleteMany()
  await prisma.workout.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('Cleared existing data')
  
  const defaultUser = await prisma.user.create({
    data: {
      id: 'default-user-id',
      email: 'user@example.com',
      name: 'Default User',
    },
  })
  
  const exercises = await Promise.all([
    // Pull exercises
    prisma.exercise.create({
      data: { name: 'Pull-up (Neutral Grip)', category: 'pull', muscleGroups: ['lats', 'biceps'] },
    }),
    prisma.exercise.create({
      data: { name: 'Pull-up (Wide Grip)', category: 'pull', muscleGroups: ['lats', 'rear delts'] },
    }),
    prisma.exercise.create({
      data: { name: 'Lat Pulldown', category: 'pull', muscleGroups: ['lats'] },
    }),
    prisma.exercise.create({
      data: { name: 'Cable Row', category: 'pull', muscleGroups: ['lats', 'rhomboids'] },
    }),
    prisma.exercise.create({
      data: { name: 'DB Row', category: 'pull', muscleGroups: ['lats', 'rhomboids'] },
    }),
    prisma.exercise.create({
      data: { name: 'Face Pull', category: 'pull', muscleGroups: ['rear delts', 'rhomboids'] },
    }),
    prisma.exercise.create({
      data: { name: 'Shrugs', category: 'pull', muscleGroups: ['traps'] },
    }),
    prisma.exercise.create({
      data: { name: 'Bicep Curl', category: 'pull', muscleGroups: ['biceps'] },
    }),
    prisma.exercise.create({
      data: { name: 'Hammer Curl', category: 'pull', muscleGroups: ['biceps', 'brachialis'] },
    }),
    
    // Push exercises
    prisma.exercise.create({
      data: { name: 'Bench Press', category: 'push', muscleGroups: ['chest', 'triceps', 'front delts'] },
    }),
    prisma.exercise.create({
      data: { name: 'Incline DB Press', category: 'push', muscleGroups: ['upper chest', 'triceps', 'front delts'] },
    }),
    prisma.exercise.create({
      data: { name: 'Cable Fly', category: 'push', muscleGroups: ['chest'] },
    }),
    prisma.exercise.create({
      data: { name: 'Overhead Press (Seated)', category: 'push', muscleGroups: ['shoulders', 'triceps'] },
    }),
    prisma.exercise.create({
      data: { name: 'Lateral Raise', category: 'push', muscleGroups: ['side delts'] },
    }),
    prisma.exercise.create({
      data: { name: 'Tricep Rope Pushdown', category: 'push', muscleGroups: ['triceps'] },
    }),
    prisma.exercise.create({
      data: { name: 'Close-Grip Bench Press', category: 'push', muscleGroups: ['triceps', 'chest'] },
    }),
    
    // Legs exercises
    prisma.exercise.create({
      data: { name: 'Safety Bar Squat', category: 'legs', muscleGroups: ['quads', 'glutes'] },
    }),
    prisma.exercise.create({
      data: { name: 'Back Squat', category: 'legs', muscleGroups: ['quads', 'glutes'] },
    }),
    prisma.exercise.create({
      data: { name: 'Belt Squat', category: 'legs', muscleGroups: ['quads', 'glutes'] },
    }),
    prisma.exercise.create({
      data: { name: 'DB RDL', category: 'legs', muscleGroups: ['hamstrings', 'glutes'] },
    }),
    prisma.exercise.create({
      data: { name: 'Hip Thrust', category: 'legs', muscleGroups: ['glutes', 'hamstrings'] },
    }),
    prisma.exercise.create({
      data: { name: 'Bulgarian Split Squat', category: 'legs', muscleGroups: ['quads', 'glutes'] },
    }),
    prisma.exercise.create({
      data: { name: 'Leg Extension', category: 'legs', muscleGroups: ['quads'] },
    }),
    prisma.exercise.create({
      data: { name: 'Lying Leg Curl', category: 'legs', muscleGroups: ['hamstrings'] },
    }),
    prisma.exercise.create({
      data: { name: 'Calf Raise', category: 'legs', muscleGroups: ['calves'] },
    }),
    
    // Core exercises
    prisma.exercise.create({
      data: { name: 'McGill Crunch', category: 'core', muscleGroups: ['abs'] },
    }),
    prisma.exercise.create({
      data: { name: 'Side Plank', category: 'core', muscleGroups: ['obliques'] },
    }),
    prisma.exercise.create({
      data: { name: 'Bird-Dog', category: 'core', muscleGroups: ['core', 'lower back'] },
    }),
    prisma.exercise.create({
      data: { name: 'Bird-Dog con Banda', category: 'core', muscleGroups: ['core', 'lower back'] },
    }),
    prisma.exercise.create({
      data: { name: 'Side Plank con Abducción', category: 'core', muscleGroups: ['obliques', 'glutes'] },
    }),
    
    // Plyometrics
    prisma.exercise.create({
      data: { name: 'Box Jump', category: 'plyo', muscleGroups: ['quads', 'glutes', 'calves'] },
    }),
    prisma.exercise.create({
      data: { name: 'Counter Movement Jump (CMJ)', category: 'plyo', muscleGroups: ['quads', 'glutes', 'calves'] },
    }),
    prisma.exercise.create({
      data: { name: 'Plyo Push-up', category: 'plyo', muscleGroups: ['chest', 'triceps'] },
    }),
    prisma.exercise.create({
      data: { name: 'Medicine Ball Throw', category: 'plyo', muscleGroups: ['core', 'shoulders'] },
    }),
  ])
  
  const pullExercises = exercises.filter(e => e.category === 'pull')
  const pushExercises = exercises.filter(e => e.category === 'push')
  const legsExercises = exercises.filter(e => e.category === 'legs')
  const coreExercises = exercises.filter(e => e.category === 'core')
  const plyoExercises = exercises.filter(e => e.category === 'plyo')
  
  // Monday - Push Day
  await prisma.workoutTemplate.create({
    data: {
      userId: defaultUser.id,
      name: 'Monday - Push (Revised 1.1)',
      type: WorkoutType.PUSH,
      exercises: {
        create: [
          { exerciseId: pushExercises.find(e => e.name === 'Bench Press')!.id, order: 1 },
          { exerciseId: pushExercises.find(e => e.name === 'Incline DB Press')!.id, order: 2 },
          { exerciseId: pushExercises.find(e => e.name === 'Cable Fly')!.id, order: 3 },
          { exerciseId: pushExercises.find(e => e.name === 'Overhead Press (Seated)')!.id, order: 4 },
          { exerciseId: pushExercises.find(e => e.name === 'Lateral Raise')!.id, order: 5 },
          { exerciseId: pushExercises.find(e => e.name === 'Tricep Rope Pushdown')!.id, order: 6 },
          { exerciseId: coreExercises.find(e => e.name === 'McGill Crunch')!.id, order: 7 },
          { exerciseId: coreExercises.find(e => e.name === 'Side Plank')!.id, order: 8 },
          { exerciseId: coreExercises.find(e => e.name === 'Bird-Dog')!.id, order: 9 },
        ],
      },
    },
  })
  
  // Wednesday - Pull Day
  await prisma.workoutTemplate.create({
    data: {
      userId: defaultUser.id,
      name: 'Wednesday - Pull (Revised 1.1)',
      type: WorkoutType.PULL,
      exercises: {
        create: [
          { exerciseId: pullExercises.find(e => e.name === 'Pull-up (Neutral Grip)')!.id, order: 1 },
          { exerciseId: pullExercises.find(e => e.name === 'Cable Row')!.id, order: 2 },
          { exerciseId: pullExercises.find(e => e.name === 'DB Row')!.id, order: 3 },
          { exerciseId: pullExercises.find(e => e.name === 'Face Pull')!.id, order: 4 },
          { exerciseId: pullExercises.find(e => e.name === 'Shrugs')!.id, order: 5 },
          { exerciseId: pullExercises.find(e => e.name === 'Bicep Curl')!.id, order: 6 },
          { exerciseId: pullExercises.find(e => e.name === 'Hammer Curl')!.id, order: 7 },
          { exerciseId: coreExercises.find(e => e.name === 'McGill Crunch')!.id, order: 8 },
          { exerciseId: coreExercises.find(e => e.name === 'Side Plank')!.id, order: 9 },
          { exerciseId: coreExercises.find(e => e.name === 'Bird-Dog')!.id, order: 10 },
        ],
      },
    },
  })
  
  // Friday - Legs Day
  await prisma.workoutTemplate.create({
    data: {
      userId: defaultUser.id,
      name: 'Friday - Legs (Low Compression)',
      type: WorkoutType.LEGS,
      exercises: {
        create: [
          { exerciseId: legsExercises.find(e => e.name === 'Safety Bar Squat')!.id, order: 1 },
          { exerciseId: legsExercises.find(e => e.name === 'DB RDL')!.id, order: 2 },
          { exerciseId: legsExercises.find(e => e.name === 'Hip Thrust')!.id, order: 3 },
          { exerciseId: legsExercises.find(e => e.name === 'Bulgarian Split Squat')!.id, order: 4 },
          { exerciseId: legsExercises.find(e => e.name === 'Leg Extension')!.id, order: 5 },
          { exerciseId: legsExercises.find(e => e.name === 'Lying Leg Curl')!.id, order: 6 },
          { exerciseId: legsExercises.find(e => e.name === 'Calf Raise')!.id, order: 7 },
        ],
      },
    },
  })
  
  // Saturday - Plyometrics
  await prisma.workoutTemplate.create({
    data: {
      userId: defaultUser.id,
      name: 'Saturday - Plyometrics',
      type: WorkoutType.PLYOMETRICS,
      exercises: {
        create: [
          { exerciseId: plyoExercises.find(e => e.name === 'Counter Movement Jump (CMJ)')!.id, order: 1 },
          { exerciseId: plyoExercises.find(e => e.name === 'Box Jump')!.id, order: 2 },
          { exerciseId: plyoExercises.find(e => e.name === 'Plyo Push-up')!.id, order: 3 },
          { exerciseId: plyoExercises.find(e => e.name === 'Medicine Ball Throw')!.id, order: 4 },
        ],
      },
    },
  })
  
  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })