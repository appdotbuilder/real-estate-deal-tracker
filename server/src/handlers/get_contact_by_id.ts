import { db } from '../db';
import { contactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput, type Contact } from '../schema';

export const getContactById = async (input: GetByIdInput): Promise<Contact> => {
  try {
    const result = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      throw new Error(`Contact with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get contact by id:', error);
    throw error;
  }
};