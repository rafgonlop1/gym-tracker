'use server'

import { prisma } from '@/lib/db'
import { DatabaseError, ValidationError } from '@/lib/errors'

export async function getAllExercises() {
  try {
    return await prisma.exercise.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })
  } catch (error) {
    throw new DatabaseError('Failed to fetch exercises')
  }
}

export async function searchExercises(query: string) {
  try {
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Search query is required')
    }

    const sanitizedQuery = query.trim()

    return await prisma.exercise.findMany({
      where: {
        OR: [
          { name: { contains: sanitizedQuery, mode: 'insensitive' } },
          { category: { contains: sanitizedQuery, mode: 'insensitive' } },
          { muscleGroups: { hasSome: [sanitizedQuery] } },
        ],
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new DatabaseError('Failed to search exercises')
  }
}