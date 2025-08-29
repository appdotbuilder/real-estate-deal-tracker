import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteDocument(input: GetByIdInput): Promise<boolean> {
  try {
    // Delete document record
    const result = await db.delete(documentsTable)
      .where(eq(documentsTable.id, input.id))
      .returning()
      .execute();

    // Return true if a record was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Document deletion failed:', error);
    throw error;
  }
}