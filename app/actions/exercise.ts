'use server'

import { prisma } from '@/lib/db'

export async function getAllExercises() {
  return await prisma.exercise.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  })
}

export async function searchExercises(query: string) {
  return await prisma.exercise.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { muscleGroups: { hasSome: [query] } },
      ],
    },
    orderBy: { name: 'asc' },
  })
}