import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable, documentsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { getDocumentById } from '../handlers/get_document_by_id';

describe('getDocumentById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return document when it exists', async () => {
    // Create a property deal first (required for foreign key)
    const propertyDeal = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property Deal',
        address: '123 Test St',
        status: 'Active',
        description: 'Test property deal for document testing'
      })
      .returning()
      .execute();

    // Create a test document
    const testDate = new Date('2024-01-15');
    const document = await db.insert(documentsTable)
      .values({
        property_deal_id: propertyDeal[0].id,
        name: 'Purchase Agreement',
        type: 'Contract',
        upload_date: testDate.toISOString().split('T')[0], // Format as YYYY-MM-DD for date column
        file_path: '/documents/purchase-agreement.pdf'
      })
      .returning()
      .execute();

    const input: GetByIdInput = { id: document[0].id };
    const result = await getDocumentById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(document[0].id);
    expect(result!.name).toEqual('Purchase Agreement');
    expect(result!.type).toEqual('Contract');
    expect(result!.property_deal_id).toEqual(propertyDeal[0].id);
    expect(result!.file_path).toEqual('/documents/purchase-agreement.pdf');
    expect(result!.upload_date).toBeInstanceOf(Date);
    expect(result!.upload_date.getTime()).toEqual(testDate.getTime());
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when document does not exist', async () => {
    const input: GetByIdInput = { id: 999 };
    const result = await getDocumentById(input);

    expect(result).toBeNull();
  });

  it('should handle document with null file_path', async () => {
    // Create a property deal first
    const propertyDeal = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property Deal',
        address: '456 Test Ave',
        status: 'Pending',
        description: 'Test property deal for null file path'
      })
      .returning()
      .execute();

    // Create a document with null file_path
    const document = await db.insert(documentsTable)
      .values({
        property_deal_id: propertyDeal[0].id,
        name: 'Draft Document',
        type: 'Draft',
        upload_date: new Date().toISOString().split('T')[0],
        file_path: null
      })
      .returning()
      .execute();

    const input: GetByIdInput = { id: document[0].id };
    const result = await getDocumentById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(document[0].id);
    expect(result!.name).toEqual('Draft Document');
    expect(result!.type).toEqual('Draft');
    expect(result!.file_path).toBeNull();
    expect(result!.upload_date).toBeInstanceOf(Date);
  });

  it('should return correct document when multiple documents exist', async () => {
    // Create a property deal first
    const propertyDeal = await db.insert(propertyDealsTable)
      .values({
        name: 'Multi-Document Deal',
        address: '789 Test Blvd',
        status: 'In Progress',
        description: 'Deal with multiple documents'
      })
      .returning()
      .execute();

    // Create multiple documents
    const documents = await db.insert(documentsTable)
      .values([
        {
          property_deal_id: propertyDeal[0].id,
          name: 'Document 1',
          type: 'Type A',
          upload_date: new Date('2024-01-01').toISOString().split('T')[0],
          file_path: '/docs/doc1.pdf'
        },
        {
          property_deal_id: propertyDeal[0].id,
          name: 'Document 2',
          type: 'Type B',
          upload_date: new Date('2024-01-02').toISOString().split('T')[0],
          file_path: '/docs/doc2.pdf'
        },
        {
          property_deal_id: propertyDeal[0].id,
          name: 'Document 3',
          type: 'Type C',
          upload_date: new Date('2024-01-03').toISOString().split('T')[0],
          file_path: '/docs/doc3.pdf'
        }
      ])
      .returning()
      .execute();

    // Get the second document specifically
    const input: GetByIdInput = { id: documents[1].id };
    const result = await getDocumentById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(documents[1].id);
    expect(result!.name).toEqual('Document 2');
    expect(result!.type).toEqual('Type B');
    expect(result!.file_path).toEqual('/docs/doc2.pdf');
    
    // Verify we got the correct document and not another one
    expect(result!.name).not.toEqual('Document 1');
    expect(result!.name).not.toEqual('Document 3');
  });
});