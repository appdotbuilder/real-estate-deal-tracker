import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type GetByIdInput, type Document } from '../schema';
import { eq } from 'drizzle-orm';

export async function getDocumentById(input: GetByIdInput): Promise<Document | null> {
  try {
    const result = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const document = result[0];
    return {
      ...document,
      upload_date: new Date(document.upload_date),
      created_at: new Date(document.created_at),
      updated_at: new Date(document.updated_at)
    };
  } catch (error) {
    console.error('Document fetch failed:', error);
    throw error;
  }
}