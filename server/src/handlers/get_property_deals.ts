import { db } from '../db';
import { propertyDealsTable } from '../db/schema';
import { type PropertyDeal } from '../schema';

export const getPropertyDeals = async (): Promise<PropertyDeal[]> => {
  try {
    const results = await db.select()
      .from(propertyDealsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Property deals retrieval failed:', error);
    throw error;
  }
};