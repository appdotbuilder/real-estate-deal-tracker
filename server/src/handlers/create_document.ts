import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type CreateDocumentInput, type Document } from '../schema';

export const createDocument = async (input: CreateDocumentInput): Promise<Document> => {
  try {
    // Insert document record
    const result = await db.insert(documentsTable)
      .values({
        property_deal_id: input.property_deal_id,
        name: input.name,
        type: input.type,
        file_path: input.file_path,
        upload_date: new Date().toISOString().split('T')[0] // Format as YYYY-MM-DD for date column
      })
      .returning()
      .execute();

    const document = result[0];
    return {
      ...document,
      upload_date: new Date(document.upload_date), // Convert date string back to Date
      created_at: document.created_at,
      updated_at: document.updated_at
    };
  } catch (error) {
    console.error('Document creation failed:', error);
    throw error;
  }
};