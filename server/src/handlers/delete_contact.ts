import { db } from '../db';
import { contactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput } from '../schema';

export const deleteContact = async (input: GetByIdInput): Promise<void> => {
  try {
    const result = await db.delete(contactsTable)
      .where(eq(contactsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Contact with id ${input.id} not found`);
    }
  } catch (error) {
    console.error('Contact deletion failed:', error);
    throw error;
  }
};