import { db } from '../db';
import { tasksTable, contactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByPropertyDealIdInput, type TaskWithContact } from '../schema';

export async function getTasksByPropertyDeal(input: GetByPropertyDealIdInput): Promise<TaskWithContact[]> {
  try {
    // Query all tasks for the specified property deal with contact information
    const results = await db.select({
        id: tasksTable.id,
        property_deal_id: tasksTable.property_deal_id,
        contact_id: tasksTable.contact_id,
        name: tasksTable.name,
        description: tasksTable.description,
        due_date: tasksTable.due_date,
        status: tasksTable.status,
        created_at: tasksTable.created_at,
        updated_at: tasksTable.updated_at,
        contact: {
          id: contactsTable.id,
          property_deal_id: contactsTable.property_deal_id,
          name: contactsTable.name,
          role: contactsTable.role,
          organization: contactsTable.organization,
          email: contactsTable.email,
          phone: contactsTable.phone,
          notes: contactsTable.notes,
          created_at: contactsTable.created_at,
          updated_at: contactsTable.updated_at,
        }
      })
      .from(tasksTable)
      .leftJoin(contactsTable, eq(tasksTable.contact_id, contactsTable.id))
      .where(eq(tasksTable.property_deal_id, input.property_deal_id))
      .execute();

    // Convert date strings to Date objects and handle contact data
    return results.map(taskData => ({
      id: taskData.id,
      property_deal_id: taskData.property_deal_id,
      contact_id: taskData.contact_id,
      name: taskData.name,
      description: taskData.description,
      due_date: new Date(taskData.due_date),
      status: taskData.status,
      created_at: taskData.created_at,
      updated_at: taskData.updated_at,
      contact: taskData.contact?.id ? taskData.contact : null,
    }));
  } catch (error) {
    console.error('Failed to fetch tasks by property deal:', error);
    throw error;
  }
}