import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable } from '../db/schema';
import { type CreatePropertyDealInput } from '../schema';
import { createPropertyDeal } from '../handlers/create_property_deal';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreatePropertyDealInput = {
  name: 'Luxury Downtown Condo',
  address: '123 Main Street, Downtown, NY 10001',
  status: 'active',
  description: 'A premium luxury condo in the heart of downtown with excellent amenities and city views.'
};

describe('createPropertyDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a property deal with all required fields', async () => {
    const result = await createPropertyDeal(testInput);

    // Validate all fields are properly set
    expect(result.name).toEqual('Luxury Downtown Condo');
    expect(result.address).toEqual('123 Main Street, Downtown, NY 10001');
    expect(result.status).toEqual('active');
    expect(result.description).toEqual('A premium luxury condo in the heart of downtown with excellent amenities and city views.');
    
    // Verify generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist property deal to database', async () => {
    const result = await createPropertyDeal(testInput);

    // Query database to verify persistence
    const savedDeals = await db.select()
      .from(propertyDealsTable)
      .where(eq(propertyDealsTable.id, result.id))
      .execute();

    expect(savedDeals).toHaveLength(1);
    const savedDeal = savedDeals[0];
    
    expect(savedDeal.name).toEqual('Luxury Downtown Condo');
    expect(savedDeal.address).toEqual('123 Main Street, Downtown, NY 10001');
    expect(savedDeal.status).toEqual('active');
    expect(savedDeal.description).toEqual(testInput.description);
    expect(savedDeal.created_at).toBeInstanceOf(Date);
    expect(savedDeal.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple property deals with unique IDs', async () => {
    const firstDeal = await createPropertyDeal(testInput);
    
    const secondInput: CreatePropertyDealInput = {
      name: 'Suburban Family Home',
      address: '456 Oak Avenue, Suburbia, NY 10002',
      status: 'pending',
      description: 'A spacious family home in quiet suburban neighborhood with large yard.'
    };
    
    const secondDeal = await createPropertyDeal(secondInput);

    // Verify unique IDs
    expect(firstDeal.id).not.toEqual(secondDeal.id);
    expect(firstDeal.name).toEqual('Luxury Downtown Condo');
    expect(secondDeal.name).toEqual('Suburban Family Home');

    // Verify both are in database
    const allDeals = await db.select()
      .from(propertyDealsTable)
      .execute();

    expect(allDeals).toHaveLength(2);
  });

  it('should handle different status values', async () => {
    const statuses = ['active', 'pending', 'closed', 'cancelled'];
    
    for (const status of statuses) {
      const input: CreatePropertyDealInput = {
        ...testInput,
        name: `Deal with ${status} status`,
        status
      };
      
      const result = await createPropertyDeal(input);
      expect(result.status).toEqual(status);
      expect(result.name).toEqual(`Deal with ${status} status`);
    }

    // Verify all deals were created
    const allDeals = await db.select()
      .from(propertyDealsTable)
      .execute();

    expect(allDeals).toHaveLength(4);
  });

  it('should handle long descriptions correctly', async () => {
    const longDescription = 'This is a very detailed property description that spans multiple sentences and provides comprehensive information about the property. '.repeat(10);
    
    const input: CreatePropertyDealInput = {
      ...testInput,
      description: longDescription
    };

    const result = await createPropertyDeal(input);
    expect(result.description).toEqual(longDescription);

    // Verify in database
    const savedDeal = await db.select()
      .from(propertyDealsTable)
      .where(eq(propertyDealsTable.id, result.id))
      .execute();

    expect(savedDeal[0].description).toEqual(longDescription);
  });
});