import { db } from '../db';
import { contactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByPropertyDealIdInput, type Contact } from '../schema';

export const getContactsByPropertyDeal = async (input: GetByPropertyDealIdInput): Promise<Contact[]> => {
  try {
    const result = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.property_deal_id, input.property_deal_id))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get contacts by property deal:', error);
    throw error;
  }
};