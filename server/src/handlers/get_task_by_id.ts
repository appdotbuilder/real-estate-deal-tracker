import { db } from '../db';
import { tasksTable, contactsTable } from '../db/schema';
import { type GetByIdInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTaskById(input: GetByIdInput): Promise<Task | null> {
  try {
    const result = await db.query.tasksTable.findFirst({
      where: eq(tasksTable.id, input.id),
      with: {
        contact: true,
      },
    });

    if (!result) {
      return null;
    }

    return {
      ...result,
      // Convert date strings to Date objects for due_date
      due_date: new Date(result.due_date),
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
}