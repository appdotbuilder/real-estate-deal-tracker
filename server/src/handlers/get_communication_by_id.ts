import { db } from '../db';
import { communicationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput, type Communication } from '../schema';

export async function getCommunicationById(input: GetByIdInput): Promise<Communication | null> {
  try {
    // Query for the communication by ID
    const result = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.id, input.id))
      .execute();

    // Return null if no communication found
    if (result.length === 0) {
      return null;
    }

    // Return the communication record with proper date conversion
    const communication = result[0];
    return {
      ...communication,
      date: new Date(communication.date) // Convert string date to Date object
    };
  } catch (error) {
    console.error('Get communication by ID failed:', error);
    throw error;
  }
}