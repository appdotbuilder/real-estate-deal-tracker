import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, propertyDealsTable } from '../db/schema';
import { type CreateDocumentInput } from '../schema';
import { createDocument } from '../handlers/create_document';
import { eq } from 'drizzle-orm';

describe('createDocument', () => {
  let testPropertyDealId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a property deal first since documents require a valid property_deal_id
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property Deal',
        address: '123 Test St',
        status: 'active',
        description: 'Test property deal for document testing'
      })
      .returning()
      .execute();
    
    testPropertyDealId = propertyDealResult[0].id;
  });

  afterEach(resetDB);

  it('should create a document with file path', async () => {
    const testInput: CreateDocumentInput = {
      property_deal_id: testPropertyDealId,
      name: 'Contract Agreement',
      type: 'contract',
      file_path: '/documents/contract-001.pdf'
    };

    const result = await createDocument(testInput);

    // Basic field validation
    expect(result.property_deal_id).toEqual(testPropertyDealId);
    expect(result.name).toEqual('Contract Agreement');
    expect(result.type).toEqual('contract');
    expect(result.file_path).toEqual('/documents/contract-001.pdf');
    expect(result.id).toBeDefined();
    expect(result.upload_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a document without file path (null)', async () => {
    const testInput: CreateDocumentInput = {
      property_deal_id: testPropertyDealId,
      name: 'Notes Document',
      type: 'notes',
      file_path: null
    };

    const result = await createDocument(testInput);

    expect(result.property_deal_id).toEqual(testPropertyDealId);
    expect(result.name).toEqual('Notes Document');
    expect(result.type).toEqual('notes');
    expect(result.file_path).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save document to database', async () => {
    const testInput: CreateDocumentInput = {
      property_deal_id: testPropertyDealId,
      name: 'Legal Document',
      type: 'legal',
      file_path: '/uploads/legal-doc.pdf'
    };

    const result = await createDocument(testInput);

    // Query database to verify document was saved
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].property_deal_id).toEqual(testPropertyDealId);
    expect(documents[0].name).toEqual('Legal Document');
    expect(documents[0].type).toEqual('legal');
    expect(documents[0].file_path).toEqual('/uploads/legal-doc.pdf');
    expect(documents[0].upload_date).toBeDefined();
    expect(documents[0].created_at).toBeInstanceOf(Date);
    expect(documents[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set upload_date to current date', async () => {
    const testInput: CreateDocumentInput = {
      property_deal_id: testPropertyDealId,
      name: 'Photo Document',
      type: 'photo',
      file_path: '/images/property-photo.jpg'
    };

    const beforeCreate = new Date();
    const result = await createDocument(testInput);
    const afterCreate = new Date();

    // Verify upload_date is set to today
    expect(result.upload_date).toBeInstanceOf(Date);
    expect(result.upload_date.getTime()).toBeGreaterThanOrEqual(beforeCreate.setHours(0, 0, 0, 0));
    expect(result.upload_date.getTime()).toBeLessThanOrEqual(afterCreate.setHours(23, 59, 59, 999));
  });

  it('should handle different document types', async () => {
    const documentTypes = ['contract', 'invoice', 'receipt', 'photo', 'legal', 'inspection'];
    
    for (const type of documentTypes) {
      const testInput: CreateDocumentInput = {
        property_deal_id: testPropertyDealId,
        name: `Test ${type} Document`,
        type: type,
        file_path: `/documents/${type}-test.pdf`
      };

      const result = await createDocument(testInput);
      
      expect(result.type).toEqual(type);
      expect(result.name).toEqual(`Test ${type} Document`);
      expect(result.property_deal_id).toEqual(testPropertyDealId);
    }
  });

  it('should throw error for invalid property_deal_id', async () => {
    const testInput: CreateDocumentInput = {
      property_deal_id: 99999, // Non-existent property deal ID
      name: 'Invalid Document',
      type: 'contract',
      file_path: '/documents/invalid.pdf'
    };

    expect(createDocument(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});