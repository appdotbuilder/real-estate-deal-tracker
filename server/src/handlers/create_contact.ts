import { db } from '../db';
import { contactsTable } from '../db/schema';
import { type CreateContactInput, type Contact } from '../schema';

export const createContact = async (input: CreateContactInput): Promise<Contact> => {
  try {
    const result = await db.insert(contactsTable)
      .values({
        property_deal_id: input.property_deal_id,
        name: input.name,
        role: input.role,
        organization: input.organization,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Contact creation failed:', error);
    throw error;
  }
};