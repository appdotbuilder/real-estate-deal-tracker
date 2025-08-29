import { db } from '../db';
import { propertyDealsTable } from '../db/schema';
import { type CreatePropertyDealInput, type PropertyDeal } from '../schema';

export const createPropertyDeal = async (input: CreatePropertyDealInput): Promise<PropertyDeal> => {
  try {
    // Insert property deal record
    const result = await db.insert(propertyDealsTable)
      .values({
        name: input.name,
        address: input.address,
        status: input.status,
        description: input.description
      })
      .returning()
      .execute();

    const propertyDeal = result[0];
    return propertyDeal;
  } catch (error) {
    console.error('Property deal creation failed:', error);
    throw error;
  }
};