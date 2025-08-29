import { db } from '../db';
import { propertyDealsTable } from '../db/schema';
import { type GetByIdInput, type PropertyDeal } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPropertyDealById(input: GetByIdInput): Promise<PropertyDeal | null> {
  try {
    const results = await db.select()
      .from(propertyDealsTable)
      .where(eq(propertyDealsTable.id, input.id))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const propertyDeal = results[0];
    return {
      id: propertyDeal.id,
      name: propertyDeal.name,
      address: propertyDeal.address,
      status: propertyDeal.status,
      description: propertyDeal.description,
      created_at: propertyDeal.created_at,
      updated_at: propertyDeal.updated_at,
    };
  } catch (error) {
    console.error('Get property deal by ID failed:', error);
    throw error;
  }
}