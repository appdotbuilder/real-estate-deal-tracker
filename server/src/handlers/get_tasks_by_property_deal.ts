import { db } from '../db';
import { tasksTable, contactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByPropertyDealIdInput, type Task } from '../schema';

export async function getTasksByPropertyDeal(input: GetByPropertyDealIdInput): Promise<Task[]> {
  try {
    // Query all tasks for the specified property deal with their associated contacts
    const results = await db.query.tasksTable.findMany({
      where: eq(tasksTable.property_deal_id, input.property_deal_id),
      with: {
        contact: true,
      },
    });

    // Convert date strings to Date objects to match schema expectations
    return results.map(task => ({
      ...task,
      due_date: new Date(task.due_date),
    }));
  } catch (error) {
    console.error('Failed to fetch tasks by property deal:', error);
    throw error;
  }
}