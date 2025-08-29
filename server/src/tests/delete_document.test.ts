import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, propertyDealsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { deleteDocument } from '../handlers/delete_document';
import { eq } from 'drizzle-orm';

// Test input
const testInput: GetByIdInput = {
  id: 1
};

describe('deleteDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing document and return true', async () => {
    // Create a property deal first (required for foreign key)
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '123 Test St',
        status: 'active',
        description: 'Test property for document deletion'
      })
      .returning()
      .execute();

    const propertyDealId = propertyDealResult[0].id;

    // Create a test document
    const documentResult = await db.insert(documentsTable)
      .values({
        property_deal_id: propertyDealId,
        name: 'Test Document',
        type: 'contract',
        file_path: '/path/to/test/document.pdf'
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    // Delete the document
    const result = await deleteDocument({ id: documentId });

    expect(result).toBe(true);

    // Verify document was deleted from database
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    expect(documents).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent document', async () => {
    const result = await deleteDocument({ id: 999 });

    expect(result).toBe(false);
  });

  it('should handle multiple documents and delete only the specified one', async () => {
    // Create a property deal first
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '123 Test St',
        status: 'active',
        description: 'Test property for document deletion'
      })
      .returning()
      .execute();

    const propertyDealId = propertyDealResult[0].id;

    // Create multiple documents
    const documentsResult = await db.insert(documentsTable)
      .values([
        {
          property_deal_id: propertyDealId,
          name: 'Document 1',
          type: 'contract',
          file_path: '/path/to/document1.pdf'
        },
        {
          property_deal_id: propertyDealId,
          name: 'Document 2',
          type: 'report',
          file_path: '/path/to/document2.pdf'
        },
        {
          property_deal_id: propertyDealId,
          name: 'Document 3',
          type: 'invoice',
          file_path: null
        }
      ])
      .returning()
      .execute();

    const documentToDelete = documentsResult[1]; // Delete the second document
    const result = await deleteDocument({ id: documentToDelete.id });

    expect(result).toBe(true);

    // Verify only one document was deleted
    const remainingDocuments = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.property_deal_id, propertyDealId))
      .execute();

    expect(remainingDocuments).toHaveLength(2);

    // Verify the correct document was deleted
    const deletedDocument = remainingDocuments.find(doc => doc.id === documentToDelete.id);
    expect(deletedDocument).toBeUndefined();

    // Verify other documents still exist
    const remainingIds = remainingDocuments.map(doc => doc.id);
    expect(remainingIds).toContain(documentsResult[0].id);
    expect(remainingIds).toContain(documentsResult[2].id);
  });

  it('should handle documents with null file_path correctly', async () => {
    // Create a property deal first
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '123 Test St',
        status: 'active',
        description: 'Test property for document deletion'
      })
      .returning()
      .execute();

    const propertyDealId = propertyDealResult[0].id;

    // Create a document with null file_path
    const documentResult = await db.insert(documentsTable)
      .values({
        property_deal_id: propertyDealId,
        name: 'Document without file',
        type: 'note',
        file_path: null
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    // Delete the document
    const result = await deleteDocument({ id: documentId });

    expect(result).toBe(true);

    // Verify document was deleted
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    expect(documents).toHaveLength(0);
  });
});