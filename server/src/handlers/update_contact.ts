import { db } from '../db';
import { contactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateContactInput, type Contact } from '../schema';

export const updateContact = async (input: UpdateContactInput): Promise<Contact> => {
  try {
    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (input.name !== undefined) {
      updateData['name'] = input.name;
    }
    if (input.role !== undefined) {
      updateData['role'] = input.role;
    }
    if (input.organization !== undefined) {
      updateData['organization'] = input.organization;
    }
    if (input.email !== undefined) {
      updateData['email'] = input.email;
    }
    if (input.phone !== undefined) {
      updateData['phone'] = input.phone;
    }
    if (input.notes !== undefined) {
      updateData['notes'] = input.notes;
    }

    const result = await db.update(contactsTable)
      .set(updateData)
      .where(eq(contactsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Contact with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Contact update failed:', error);
    throw error;
  }
};