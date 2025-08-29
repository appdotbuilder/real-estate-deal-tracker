import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetByIdInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTaskById(input: GetByIdInput): Promise<Task | null> {
  try {
    const result = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const task = result[0];
    return {
      ...task,
      // Convert date strings to Date objects for due_date
      due_date: new Date(task.due_date),
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
}