import { db } from '../db';
import { communicationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateCommunicationInput, type Communication } from '../schema';

export async function updateCommunication(input: UpdateCommunicationInput): Promise<Communication | null> {
  try {
    const { id, ...updateFields } = input;
    
    // Build the update object only with defined fields
    const updateData: Record<string, any> = {};
    
    if (updateFields.date !== undefined) {
      updateData['date'] = updateFields.date;
    }
    if (updateFields.type !== undefined) {
      updateData['type'] = updateFields.type;
    }
    if (updateFields.subject !== undefined) {
      updateData['subject'] = updateFields.subject;
    }
    if (updateFields.notes !== undefined) {
      updateData['notes'] = updateFields.notes;
    }

    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    // If no fields to update, return null
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return null;
    }

    // Perform the update
    const result = await db.update(communicationsTable)
      .set(updateData)
      .where(eq(communicationsTable.id, id))
      .returning()
      .execute();

    // Return the updated communication or null if not found
    if (result.length === 0) {
      return null;
    }

    // Convert date strings back to Date objects for the schema
    const communication = result[0];
    return {
      ...communication,
      date: new Date(communication.date)
    };
  } catch (error) {
    console.error('Communication update failed:', error);
    throw error;
  }
}