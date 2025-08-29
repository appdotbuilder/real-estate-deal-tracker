import { db } from '../db';
import { propertyDealsTable } from '../db/schema';
import { type UpdatePropertyDealInput, type PropertyDeal } from '../schema';
import { eq } from 'drizzle-orm';

export async function updatePropertyDeal(input: UpdatePropertyDealInput): Promise<PropertyDeal | null> {
  try {
    const { id, ...updateData } = input;

    // Only update fields that are provided
    const fieldsToUpdate: Record<string, any> = {};
    
    if (updateData.name !== undefined) {
      fieldsToUpdate['name'] = updateData.name;
    }
    if (updateData.address !== undefined) {
      fieldsToUpdate['address'] = updateData.address;
    }
    if (updateData.status !== undefined) {
      fieldsToUpdate['status'] = updateData.status;
    }
    if (updateData.description !== undefined) {
      fieldsToUpdate['description'] = updateData.description;
    }

    // If no fields to update, return null
    if (Object.keys(fieldsToUpdate).length === 0) {
      return null;
    }

    // Add updated_at timestamp
    fieldsToUpdate['updated_at'] = new Date();

    // Update the property deal
    const result = await db.update(propertyDealsTable)
      .set(fieldsToUpdate)
      .where(eq(propertyDealsTable.id, id))
      .returning()
      .execute();

    // Return the updated property deal or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Property deal update failed:', error);
    throw error;
  }
}