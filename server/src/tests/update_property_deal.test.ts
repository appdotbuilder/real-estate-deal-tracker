import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable } from '../db/schema';
import { type UpdatePropertyDealInput, type CreatePropertyDealInput } from '../schema';
import { updatePropertyDeal } from '../handlers/update_property_deal';
import { eq } from 'drizzle-orm';

// Test data for creating initial property deals
const testPropertyDeal: CreatePropertyDealInput = {
  name: 'Test Property Deal',
  address: '123 Test Street',
  status: 'active',
  description: 'A test property deal for updates'
};

// Helper function to create a property deal for testing
const createTestPropertyDeal = async () => {
  const result = await db.insert(propertyDealsTable)
    .values(testPropertyDeal)
    .returning()
    .execute();
  return result[0];
};

describe('updatePropertyDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a property deal with all fields', async () => {
    // Create initial property deal
    const created = await createTestPropertyDeal();
    
    const updateInput: UpdatePropertyDealInput = {
      id: created.id,
      name: 'Updated Property Deal',
      address: '456 Updated Avenue',
      status: 'inactive',
      description: 'Updated description for testing'
    };

    const result = await updatePropertyDeal(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(created.id);
    expect(result!.name).toEqual('Updated Property Deal');
    expect(result!.address).toEqual('456 Updated Avenue');
    expect(result!.status).toEqual('inactive');
    expect(result!.description).toEqual('Updated description for testing');
    expect(result!.created_at).toEqual(created.created_at);
    expect(result!.updated_at).not.toEqual(created.updated_at);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update a property deal with partial fields', async () => {
    // Create initial property deal
    const created = await createTestPropertyDeal();
    
    const updateInput: UpdatePropertyDealInput = {
      id: created.id,
      name: 'Partially Updated Deal',
      status: 'pending'
    };

    const result = await updatePropertyDeal(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(created.id);
    expect(result!.name).toEqual('Partially Updated Deal');
    expect(result!.address).toEqual(created.address); // Should remain unchanged
    expect(result!.status).toEqual('pending');
    expect(result!.description).toEqual(created.description); // Should remain unchanged
    expect(result!.updated_at).not.toEqual(created.updated_at);
  });

  it('should update only the name field', async () => {
    // Create initial property deal
    const created = await createTestPropertyDeal();
    
    const updateInput: UpdatePropertyDealInput = {
      id: created.id,
      name: 'Name Only Update'
    };

    const result = await updatePropertyDeal(updateInput);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('Name Only Update');
    expect(result!.address).toEqual(created.address);
    expect(result!.status).toEqual(created.status);
    expect(result!.description).toEqual(created.description);
  });

  it('should save updated property deal to database', async () => {
    // Create initial property deal
    const created = await createTestPropertyDeal();
    
    const updateInput: UpdatePropertyDealInput = {
      id: created.id,
      name: 'Database Test Update',
      status: 'completed'
    };

    await updatePropertyDeal(updateInput);

    // Verify the update was saved to database
    const saved = await db.select()
      .from(propertyDealsTable)
      .where(eq(propertyDealsTable.id, created.id))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].name).toEqual('Database Test Update');
    expect(saved[0].status).toEqual('completed');
    expect(saved[0].address).toEqual(created.address); // Unchanged
    expect(saved[0].updated_at).not.toEqual(created.updated_at);
  });

  it('should return null for non-existent property deal', async () => {
    const updateInput: UpdatePropertyDealInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Update'
    };

    const result = await updatePropertyDeal(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided for update', async () => {
    // Create initial property deal
    const created = await createTestPropertyDeal();
    
    const updateInput: UpdatePropertyDealInput = {
      id: created.id
      // No update fields provided
    };

    const result = await updatePropertyDeal(updateInput);

    expect(result).toBeNull();
  });

  it('should handle empty string updates correctly', async () => {
    // Create initial property deal
    const created = await createTestPropertyDeal();
    
    const updateInput: UpdatePropertyDealInput = {
      id: created.id,
      name: '',
      description: ''
    };

    const result = await updatePropertyDeal(updateInput);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('');
    expect(result!.description).toEqual('');
    expect(result!.address).toEqual(created.address); // Should remain unchanged
    expect(result!.status).toEqual(created.status); // Should remain unchanged
  });

  it('should update the updated_at timestamp', async () => {
    // Create initial property deal
    const created = await createTestPropertyDeal();
    const originalUpdatedAt = created.updated_at;
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdatePropertyDealInput = {
      id: created.id,
      name: 'Timestamp Test'
    };

    const result = await updatePropertyDeal(updateInput);

    expect(result).toBeDefined();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result!.created_at).toEqual(created.created_at); // Should remain unchanged
  });
});