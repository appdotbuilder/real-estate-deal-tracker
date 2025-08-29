import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, propertyDealsTable } from '../db/schema';
import { type UpdateDocumentInput, type CreateDocumentInput } from '../schema';
import { updateDocument } from '../handlers/update_document';
import { eq } from 'drizzle-orm';

describe('updateDocument', () => {
  let propertyDealId: number;
  let documentId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a property deal first (required for foreign key)
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '123 Test St',
        status: 'active',
        description: 'Test property description'
      })
      .returning()
      .execute();
    
    propertyDealId = propertyDealResult[0].id;

    // Create a document to update
    const documentResult = await db.insert(documentsTable)
      .values({
        property_deal_id: propertyDealId,
        name: 'Original Document',
        type: 'contract',
        file_path: '/original/path.pdf'
      })
      .returning()
      .execute();
    
    documentId = documentResult[0].id;
  });

  afterEach(resetDB);

  it('should update document name', async () => {
    const updateInput: UpdateDocumentInput = {
      id: documentId,
      name: 'Updated Document Name'
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(documentId);
    expect(result!.name).toEqual('Updated Document Name');
    expect(result!.type).toEqual('contract'); // Unchanged
    expect(result!.file_path).toEqual('/original/path.pdf'); // Unchanged
    expect(result!.property_deal_id).toEqual(propertyDealId);
  });

  it('should update document type', async () => {
    const updateInput: UpdateDocumentInput = {
      id: documentId,
      type: 'invoice'
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(documentId);
    expect(result!.name).toEqual('Original Document'); // Unchanged
    expect(result!.type).toEqual('invoice');
    expect(result!.file_path).toEqual('/original/path.pdf'); // Unchanged
  });

  it('should update document file_path', async () => {
    const updateInput: UpdateDocumentInput = {
      id: documentId,
      file_path: '/updated/path.pdf'
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.file_path).toEqual('/updated/path.pdf');
    expect(result!.name).toEqual('Original Document'); // Unchanged
    expect(result!.type).toEqual('contract'); // Unchanged
  });

  it('should set file_path to null', async () => {
    const updateInput: UpdateDocumentInput = {
      id: documentId,
      file_path: null
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.file_path).toBeNull();
    expect(result!.name).toEqual('Original Document'); // Unchanged
    expect(result!.type).toEqual('contract'); // Unchanged
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateDocumentInput = {
      id: documentId,
      name: 'Completely Updated Document',
      type: 'receipt',
      file_path: '/new/location.pdf'
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(documentId);
    expect(result!.name).toEqual('Completely Updated Document');
    expect(result!.type).toEqual('receipt');
    expect(result!.file_path).toEqual('/new/location.pdf');
    expect(result!.property_deal_id).toEqual(propertyDealId);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalDoc = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();
    
    const originalTimestamp = originalDoc[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateDocumentInput = {
      id: documentId,
      name: 'Updated Name'
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should persist changes in database', async () => {
    const updateInput: UpdateDocumentInput = {
      id: documentId,
      name: 'Database Test Document',
      type: 'legal'
    };

    await updateDocument(updateInput);

    // Query database directly to verify changes
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].name).toEqual('Database Test Document');
    expect(documents[0].type).toEqual('legal');
    expect(documents[0].file_path).toEqual('/original/path.pdf'); // Unchanged
  });

  it('should return null for non-existent document', async () => {
    const updateInput: UpdateDocumentInput = {
      id: 99999, // Non-existent ID
      name: 'Should not work'
    };

    const result = await updateDocument(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided to update', async () => {
    const updateInput: UpdateDocumentInput = {
      id: documentId
      // No fields to update
    };

    const result = await updateDocument(updateInput);

    expect(result).toBeNull();

    // Verify document was not changed
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    expect(documents[0].name).toEqual('Original Document');
  });

  it('should handle partial updates correctly', async () => {
    // Update only name
    const partialUpdate: UpdateDocumentInput = {
      id: documentId,
      name: 'Partial Update Test'
    };

    const result = await updateDocument(partialUpdate);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Partial Update Test');
    expect(result!.type).toEqual('contract'); // Should remain unchanged
    expect(result!.file_path).toEqual('/original/path.pdf'); // Should remain unchanged

    // Verify all fields are preserved correctly
    const dbDocument = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    expect(dbDocument[0].name).toEqual('Partial Update Test');
    expect(dbDocument[0].type).toEqual('contract');
    expect(dbDocument[0].file_path).toEqual('/original/path.pdf');
    expect(dbDocument[0].property_deal_id).toEqual(propertyDealId);
  });
});