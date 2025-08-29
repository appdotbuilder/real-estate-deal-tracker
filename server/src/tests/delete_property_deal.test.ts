import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable, tasksTable, documentsTable, communicationsTable } from '../db/schema';
import { type GetByIdInput, type CreatePropertyDealInput } from '../schema';
import { deletePropertyDeal } from '../handlers/delete_property_deal';
import { eq } from 'drizzle-orm';

// Helper function to create a test property deal
const createTestPropertyDeal = async (): Promise<number> => {
  const testInput: CreatePropertyDealInput = {
    name: 'Test Property Deal',
    address: '123 Test Street, Test City',
    status: 'active',
    description: 'A test property deal for deletion testing'
  };

  const result = await db.insert(propertyDealsTable)
    .values(testInput)
    .returning()
    .execute();

  return result[0].id;
};

// Helper function to create related data
const createRelatedData = async (propertyDealId: number) => {
  // Create a task
  await db.insert(tasksTable)
    .values({
      property_deal_id: propertyDealId,
      name: 'Test Task',
      description: 'Test task description',
      due_date: '2024-12-31',
      status: 'pending'
    })
    .execute();

  // Create a document
  await db.insert(documentsTable)
    .values({
      property_deal_id: propertyDealId,
      name: 'Test Document',
      type: 'contract',
      file_path: '/path/to/test/document.pdf'
    })
    .execute();

  // Create a communication
  await db.insert(communicationsTable)
    .values({
      property_deal_id: propertyDealId,
      date: '2024-01-15',
      type: 'email',
      subject: 'Test Communication',
      notes: 'Test communication notes'
    })
    .execute();
};

describe('deletePropertyDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing property deal', async () => {
    // Create a test property deal
    const propertyDealId = await createTestPropertyDeal();

    const input: GetByIdInput = { id: propertyDealId };
    const result = await deletePropertyDeal(input);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify the property deal was actually deleted
    const deletedDeal = await db.select()
      .from(propertyDealsTable)
      .where(eq(propertyDealsTable.id, propertyDealId))
      .execute();

    expect(deletedDeal).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent property deal', async () => {
    const nonExistentId = 99999;
    const input: GetByIdInput = { id: nonExistentId };
    
    const result = await deletePropertyDeal(input);

    // Should return false when no rows are affected
    expect(result).toBe(false);
  });

  it('should delete related records when deleting property deal', async () => {
    // Create a test property deal
    const propertyDealId = await createTestPropertyDeal();
    
    // Create related data
    await createRelatedData(propertyDealId);

    // Verify related data exists before deletion
    const tasksBefore = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.property_deal_id, propertyDealId))
      .execute();
    const documentsBefore = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.property_deal_id, propertyDealId))
      .execute();
    const communicationsBefore = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.property_deal_id, propertyDealId))
      .execute();

    expect(tasksBefore).toHaveLength(1);
    expect(documentsBefore).toHaveLength(1);
    expect(communicationsBefore).toHaveLength(1);

    // Delete the property deal
    const input: GetByIdInput = { id: propertyDealId };
    const result = await deletePropertyDeal(input);

    expect(result).toBe(true);

    // Verify related records were deleted along with the property deal
    const tasksAfter = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.property_deal_id, propertyDealId))
      .execute();
    const documentsAfter = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.property_deal_id, propertyDealId))
      .execute();
    const communicationsAfter = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.property_deal_id, propertyDealId))
      .execute();

    expect(tasksAfter).toHaveLength(0);
    expect(documentsAfter).toHaveLength(0);
    expect(communicationsAfter).toHaveLength(0);
  });

  it('should handle multiple deletion attempts gracefully', async () => {
    // Create a test property deal
    const propertyDealId = await createTestPropertyDeal();

    const input: GetByIdInput = { id: propertyDealId };

    // First deletion should succeed
    const firstResult = await deletePropertyDeal(input);
    expect(firstResult).toBe(true);

    // Second deletion attempt should return false (no rows affected)
    const secondResult = await deletePropertyDeal(input);
    expect(secondResult).toBe(false);
  });

  it('should handle deletion with various property deal data', async () => {
    // Create property deals with different data
    const deal1Result = await db.insert(propertyDealsTable)
      .values({
        name: 'Deal 1',
        address: 'Address 1',
        status: 'pending',
        description: 'Description 1'
      })
      .returning()
      .execute();

    const deal2Result = await db.insert(propertyDealsTable)
      .values({
        name: 'Deal 2',
        address: 'Address 2',
        status: 'completed',
        description: 'Description 2'
      })
      .returning()
      .execute();

    const deal1Id = deal1Result[0].id;
    const deal2Id = deal2Result[0].id;

    // Delete first deal
    const result1 = await deletePropertyDeal({ id: deal1Id });
    expect(result1).toBe(true);

    // Verify only first deal was deleted
    const remainingDeals = await db.select()
      .from(propertyDealsTable)
      .execute();

    expect(remainingDeals).toHaveLength(1);
    expect(remainingDeals[0].id).toBe(deal2Id);

    // Delete second deal
    const result2 = await deletePropertyDeal({ id: deal2Id });
    expect(result2).toBe(true);

    // Verify all deals are deleted
    const finalDeals = await db.select()
      .from(propertyDealsTable)
      .execute();

    expect(finalDeals).toHaveLength(0);
  });
});