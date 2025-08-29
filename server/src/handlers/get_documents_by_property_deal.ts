import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type GetByPropertyDealIdInput, type Document } from '../schema';
import { eq } from 'drizzle-orm';

export async function getDocumentsByPropertyDeal(input: GetByPropertyDealIdInput): Promise<Document[]> {
  try {
    // Query documents for the specified property deal
    const results = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.property_deal_id, input.property_deal_id))
      .execute();

    // Convert date strings to Date objects to match schema
    return results.map(doc => ({
      ...doc,
      upload_date: new Date(doc.upload_date)
    }));
  } catch (error) {
    console.error('Failed to fetch documents by property deal:', error);
    throw error;
  }
}