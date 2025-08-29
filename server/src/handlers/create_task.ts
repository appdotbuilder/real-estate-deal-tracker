import { db } from '../db';
import { tasksTable, propertyDealsTable, contactsTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Verify that the property deal exists to prevent foreign key constraint violations
    const propertyDeal = await db.select()
      .from(propertyDealsTable)
      .where(eq(propertyDealsTable.id, input.property_deal_id))
      .execute();

    if (propertyDeal.length === 0) {
      throw new Error(`Property deal with id ${input.property_deal_id} not found`);
    }

    // Verify that the contact exists if contact_id is provided
    if (input.contact_id !== undefined && input.contact_id !== null) {
      const contact = await db.select()
        .from(contactsTable)
        .where(eq(contactsTable.id, input.contact_id))
        .execute();

      if (contact.length === 0) {
        throw new Error(`Contact with id ${input.contact_id} not found`);
      }
    }

    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        property_deal_id: input.property_deal_id,
        contact_id: input.contact_id || null,
        name: input.name,
        description: input.description,
        due_date: input.due_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        status: input.status
      })
      .returning()
      .execute();

    // Convert date fields back to Date objects before returning
    const task = result[0];
    return {
      ...task,
      due_date: new Date(task.due_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};