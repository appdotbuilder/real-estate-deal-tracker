import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable } from '../db/schema';
import { type GetByIdInput, type CreatePropertyDealInput } from '../schema';
import { getPropertyDealById } from '../handlers/get_property_deal_by_id';

// Test data for creating property deals
const testPropertyDeal: CreatePropertyDealInput = {
  name: 'Test Property Deal',
  address: '123 Main St, Test City, TC 12345',
  status: 'active',
  description: 'A test property deal for unit testing',
};

describe('getPropertyDealById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return property deal when valid ID is provided', async () => {
    // Create a test property deal first
    const insertResult = await db.insert(propertyDealsTable)
      .values({
        name: testPropertyDeal.name,
        address: testPropertyDeal.address,
        status: testPropertyDeal.status,
        description: testPropertyDeal.description,
      })
      .returning()
      .execute();

    const createdPropertyDeal = insertResult[0];
    const input: GetByIdInput = { id: createdPropertyDeal.id };

    const result = await getPropertyDealById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPropertyDeal.id);
    expect(result!.name).toEqual('Test Property Deal');
    expect(result!.address).toEqual('123 Main St, Test City, TC 12345');
    expect(result!.status).toEqual('active');
    expect(result!.description).toEqual('A test property deal for unit testing');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when property deal does not exist', async () => {
    const input: GetByIdInput = { id: 99999 };

    const result = await getPropertyDealById(input);

    expect(result).toBeNull();
  });

  it('should return null when ID is zero', async () => {
    const input: GetByIdInput = { id: 0 };

    const result = await getPropertyDealById(input);

    expect(result).toBeNull();
  });

  it('should return null when ID is negative', async () => {
    const input: GetByIdInput = { id: -1 };

    const result = await getPropertyDealById(input);

    expect(result).toBeNull();
  });

  it('should handle multiple property deals and return correct one', async () => {
    // Create multiple property deals
    const firstDeal = await db.insert(propertyDealsTable)
      .values({
        name: 'First Property Deal',
        address: '111 First St',
        status: 'active',
        description: 'First test property deal',
      })
      .returning()
      .execute();

    const secondDeal = await db.insert(propertyDealsTable)
      .values({
        name: 'Second Property Deal',
        address: '222 Second St',
        status: 'pending',
        description: 'Second test property deal',
      })
      .returning()
      .execute();

    // Fetch the second property deal
    const input: GetByIdInput = { id: secondDeal[0].id };
    const result = await getPropertyDealById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(secondDeal[0].id);
    expect(result!.name).toEqual('Second Property Deal');
    expect(result!.address).toEqual('222 Second St');
    expect(result!.status).toEqual('pending');
    expect(result!.description).toEqual('Second test property deal');

    // Verify we didn't get the first property deal
    expect(result!.id).not.toEqual(firstDeal[0].id);
    expect(result!.name).not.toEqual('First Property Deal');
  });

  it('should verify property deal fields have correct types', async () => {
    // Create a test property deal
    const insertResult = await db.insert(propertyDealsTable)
      .values({
        name: testPropertyDeal.name,
        address: testPropertyDeal.address,
        status: testPropertyDeal.status,
        description: testPropertyDeal.description,
      })
      .returning()
      .execute();

    const input: GetByIdInput = { id: insertResult[0].id };
    const result = await getPropertyDealById(input);

    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.name).toBe('string');
    expect(typeof result!.address).toBe('string');
    expect(typeof result!.status).toBe('string');
    expect(typeof result!.description).toBe('string');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});