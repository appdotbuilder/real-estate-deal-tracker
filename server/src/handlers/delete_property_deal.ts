import { db } from '../db';
import { propertyDealsTable, tasksTable, documentsTable, communicationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput } from '../schema';

export async function deletePropertyDeal(input: GetByIdInput): Promise<boolean> {
  try {
    // First, check if the property deal exists
    const existingDeal = await db.select()
      .from(propertyDealsTable)
      .where(eq(propertyDealsTable.id, input.id))
      .execute();

    if (existingDeal.length === 0) {
      return false; // Property deal doesn't exist
    }

    // Delete related records first to avoid foreign key constraint violations
    // Delete tasks
    await db.delete(tasksTable)
      .where(eq(tasksTable.property_deal_id, input.id))
      .execute();

    // Delete documents
    await db.delete(documentsTable)
      .where(eq(documentsTable.property_deal_id, input.id))
      .execute();

    // Delete communications
    await db.delete(communicationsTable)
      .where(eq(communicationsTable.property_deal_id, input.id))
      .execute();

    // Finally, delete the property deal
    const result = await db.delete(propertyDealsTable)
      .where(eq(propertyDealsTable.id, input.id))
      .execute();

    // Check if any rows were affected (deleted)
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Property deal deletion failed:', error);
    throw error;
  }
}