import { db } from '../db';
import { communicationsTable } from '../db/schema';
import { type GetByPropertyDealIdInput, type Communication } from '../schema';
import { eq } from 'drizzle-orm';

export const getCommunicationsByPropertyDeal = async (input: GetByPropertyDealIdInput): Promise<Communication[]> => {
  try {
    const results = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.property_deal_id, input.property_deal_id))
      .execute();

    return results.map(result => ({
      ...result,
      date: new Date(result.date) // Convert date string to Date object
    }));
  } catch (error) {
    console.error('Failed to get communications by property deal:', error);
    throw error;
  }
};