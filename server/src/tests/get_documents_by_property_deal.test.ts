import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable, documentsTable } from '../db/schema';
import { type GetByPropertyDealIdInput } from '../schema';
import { getDocumentsByPropertyDeal } from '../handlers/get_documents_by_property_deal';

describe('getDocumentsByPropertyDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return documents for a specific property deal', async () => {
    // Create a property deal first
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '123 Test St',
        status: 'active',
        description: 'A test property deal'
      })
      .returning()
      .execute();

    const propertyDealId = propertyDealResult[0].id;

    // Create documents for this property deal
    await db.insert(documentsTable)
      .values([
        {
          property_deal_id: propertyDealId,
          name: 'Purchase Agreement',
          type: 'contract',
          file_path: '/uploads/purchase-agreement.pdf'
        },
        {
          property_deal_id: propertyDealId,
          name: 'Inspection Report',
          type: 'report',
          file_path: '/uploads/inspection-report.pdf'
        }
      ])
      .execute();

    const input: GetByPropertyDealIdInput = {
      property_deal_id: propertyDealId
    };

    const result = await getDocumentsByPropertyDeal(input);

    expect(result).toHaveLength(2);
    expect(result[0].property_deal_id).toBe(propertyDealId);
    expect(result[0].name).toBe('Purchase Agreement');
    expect(result[0].type).toBe('contract');
    expect(result[0].file_path).toBe('/uploads/purchase-agreement.pdf');
    expect(result[0].upload_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].property_deal_id).toBe(propertyDealId);
    expect(result[1].name).toBe('Inspection Report');
    expect(result[1].type).toBe('report');
    expect(result[1].file_path).toBe('/uploads/inspection-report.pdf');
    expect(result[1].upload_date).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when property deal has no documents', async () => {
    // Create a property deal first
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Empty Property',
        address: '456 Empty St',
        status: 'active',
        description: 'A property deal with no documents'
      })
      .returning()
      .execute();

    const propertyDealId = propertyDealResult[0].id;

    const input: GetByPropertyDealIdInput = {
      property_deal_id: propertyDealId
    };

    const result = await getDocumentsByPropertyDeal(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return documents for the specified property deal', async () => {
    // Create two property deals
    const propertyDeal1Result = await db.insert(propertyDealsTable)
      .values({
        name: 'Property One',
        address: '123 First St',
        status: 'active',
        description: 'First property deal'
      })
      .returning()
      .execute();

    const propertyDeal2Result = await db.insert(propertyDealsTable)
      .values({
        name: 'Property Two',
        address: '456 Second St',
        status: 'active',
        description: 'Second property deal'
      })
      .returning()
      .execute();

    const propertyDeal1Id = propertyDeal1Result[0].id;
    const propertyDeal2Id = propertyDeal2Result[0].id;

    // Create documents for both property deals
    await db.insert(documentsTable)
      .values([
        {
          property_deal_id: propertyDeal1Id,
          name: 'Contract 1',
          type: 'contract',
          file_path: '/uploads/contract1.pdf'
        },
        {
          property_deal_id: propertyDeal2Id,
          name: 'Contract 2',
          type: 'contract',
          file_path: '/uploads/contract2.pdf'
        },
        {
          property_deal_id: propertyDeal1Id,
          name: 'Report 1',
          type: 'report',
          file_path: '/uploads/report1.pdf'
        }
      ])
      .execute();

    const input: GetByPropertyDealIdInput = {
      property_deal_id: propertyDeal1Id
    };

    const result = await getDocumentsByPropertyDeal(input);

    expect(result).toHaveLength(2);
    expect(result.every(doc => doc.property_deal_id === propertyDeal1Id)).toBe(true);
    
    const documentNames = result.map(doc => doc.name).sort();
    expect(documentNames).toEqual(['Contract 1', 'Report 1']);
  });

  it('should handle documents with null file_path', async () => {
    // Create a property deal first
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '789 Test Ave',
        status: 'active',
        description: 'A test property deal'
      })
      .returning()
      .execute();

    const propertyDealId = propertyDealResult[0].id;

    // Create a document with null file_path
    await db.insert(documentsTable)
      .values({
        property_deal_id: propertyDealId,
        name: 'Pending Document',
        type: 'contract',
        file_path: null
      })
      .execute();

    const input: GetByPropertyDealIdInput = {
      property_deal_id: propertyDealId
    };

    const result = await getDocumentsByPropertyDeal(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pending Document');
    expect(result[0].type).toBe('contract');
    expect(result[0].file_path).toBeNull();
    expect(result[0].property_deal_id).toBe(propertyDealId);
  });

  it('should return empty array for non-existent property deal', async () => {
    const input: GetByPropertyDealIdInput = {
      property_deal_id: 99999 // Non-existent ID
    };

    const result = await getDocumentsByPropertyDeal(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});