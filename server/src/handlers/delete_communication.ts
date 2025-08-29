import { db } from '../db';
import { communicationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput } from '../schema';

export const deleteCommunication = async (input: GetByIdInput): Promise<boolean> => {
  try {
    // Delete the communication record
    const result = await db.delete(communicationsTable)
      .where(eq(communicationsTable.id, input.id))
      .execute();

    // Return true if at least one row was affected (deleted)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Communication deletion failed:', error);
    throw error;
  }
};