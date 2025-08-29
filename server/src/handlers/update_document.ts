import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type UpdateDocumentInput, type Document } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateDocument(input: UpdateDocumentInput): Promise<Document | null> {
  try {
    const { id, ...updateData } = input;

    // Only update fields that are provided (not undefined)
    const fieldsToUpdate: any = {};
    
    if (updateData.name !== undefined) {
      fieldsToUpdate.name = updateData.name;
    }
    
    if (updateData.type !== undefined) {
      fieldsToUpdate.type = updateData.type;
    }
    
    if (updateData.file_path !== undefined) {
      fieldsToUpdate.file_path = updateData.file_path;
    }

    // Always update the updated_at timestamp
    fieldsToUpdate.updated_at = new Date();

    // If no fields to update (besides updated_at), return null
    if (Object.keys(fieldsToUpdate).length === 1) {
      return null;
    }

    // Update the document record
    const result = await db.update(documentsTable)
      .set(fieldsToUpdate)
      .where(eq(documentsTable.id, id))
      .returning()
      .execute();

    // Return null if document not found
    if (result.length === 0) {
      return null;
    }

    // Convert date fields from strings to Date objects
    const document = result[0];
    return {
      ...document,
      upload_date: new Date(document.upload_date),
    };
  } catch (error) {
    console.error('Document update failed:', error);
    throw error;
  }
}