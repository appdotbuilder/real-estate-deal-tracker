import { db } from '../db';
import { tasksTable, contactsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type UpdateTaskInput, type Task } from '../schema';

export async function updateTask(input: UpdateTaskInput): Promise<Task | null> {
  try {
    // If contact_id is provided, validate it first
    if (input.contact_id !== undefined && input.contact_id !== null) {
      // Get the current task to check property_deal_id
      const currentTask = await db.select()
        .from(tasksTable)
        .where(eq(tasksTable.id, input.id))
        .execute();

      if (currentTask.length === 0) {
        return null; // Task not found
      }

      // Verify that the contact exists and belongs to the same property deal
      const contact = await db.select()
        .from(contactsTable)
        .where(
          and(
            eq(contactsTable.id, input.contact_id),
            eq(contactsTable.property_deal_id, currentTask[0].property_deal_id)
          )
        )
        .execute();

      if (contact.length === 0) {
        throw new Error(`Contact with id ${input.contact_id} not found or does not belong to the same property deal`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.due_date !== undefined) {
      updateData.due_date = input.due_date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.contact_id !== undefined) {
      updateData.contact_id = input.contact_id;
    }

    // Update the task
    const result = await db.update(tasksTable)
      .set(updateData)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    // Return null if task not found
    if (result.length === 0) {
      return null;
    }

    // Return the updated task
    const task = result[0];
    return {
      ...task,
      due_date: new Date(task.due_date),
      created_at: task.created_at,
      updated_at: task.updated_at
    };
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
}