import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteTask(input: GetByIdInput): Promise<boolean> {
  try {
    // Delete the task by ID
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Check if any rows were affected (deleted)
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
}