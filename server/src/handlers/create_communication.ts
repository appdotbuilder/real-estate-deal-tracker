import { db } from '../db';
import { communicationsTable } from '../db/schema';
import { type CreateCommunicationInput, type Communication } from '../schema';

export const createCommunication = async (input: CreateCommunicationInput): Promise<Communication> => {
  try {
    // Insert communication record
    const result = await db.insert(communicationsTable)
      .values({
        property_deal_id: input.property_deal_id,
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD format
        type: input.type,
        subject: input.subject,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert the date string back to Date object for the response
    return {
      ...result[0],
      date: new Date(result[0].date)
    };
  } catch (error) {
    console.error('Communication creation failed:', error);
    throw error;
  }
};