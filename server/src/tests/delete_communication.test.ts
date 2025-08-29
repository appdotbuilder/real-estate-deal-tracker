import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { communicationsTable, propertyDealsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput, type CreateCommunicationInput } from '../schema';
import { deleteCommunication } from '../handlers/delete_communication';

// Test input for deleting communication
const testDeleteInput: GetByIdInput = {
  id: 1
};

describe('deleteCommunication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing communication', async () => {
    // Create a property deal first (required for foreign key)
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '123 Test St',
        status: 'active',
        description: 'A test property for communication testing'
      })
      .returning()
      .execute();

    const propertyDealId = propertyDealResult[0].id;

    // Create a communication to delete
    const communicationResult = await db.insert(communicationsTable)
      .values({
        property_deal_id: propertyDealId,
        date: '2024-01-15',
        type: 'email',
        subject: 'Test Communication',
        notes: 'This is a test communication'
      })
      .returning()
      .execute();

    const communicationId = communicationResult[0].id;

    // Delete the communication
    const result = await deleteCommunication({ id: communicationId });

    expect(result).toBe(true);

    // Verify the communication was actually deleted from the database
    const communications = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.id, communicationId))
      .execute();

    expect(communications).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent communication', async () => {
    const result = await deleteCommunication({ id: 999 });

    expect(result).toBe(false);
  });

  it('should not delete other communications when deleting one', async () => {
    // Create a property deal first (required for foreign key)
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '123 Test St',
        status: 'active',
        description: 'A test property for communication testing'
      })
      .returning()
      .execute();

    const propertyDealId = propertyDealResult[0].id;

    // Create two communications
    const communication1Result = await db.insert(communicationsTable)
      .values({
        property_deal_id: propertyDealId,
        date: '2024-01-15',
        type: 'email',
        subject: 'First Communication',
        notes: 'This is the first communication'
      })
      .returning()
      .execute();

    const communication2Result = await db.insert(communicationsTable)
      .values({
        property_deal_id: propertyDealId,
        date: '2024-01-16',
        type: 'phone',
        subject: 'Second Communication',
        notes: 'This is the second communication'
      })
      .returning()
      .execute();

    const communication1Id = communication1Result[0].id;
    const communication2Id = communication2Result[0].id;

    // Delete only the first communication
    const result = await deleteCommunication({ id: communication1Id });

    expect(result).toBe(true);

    // Verify only the first communication was deleted
    const remainingCommunications = await db.select()
      .from(communicationsTable)
      .execute();

    expect(remainingCommunications).toHaveLength(1);
    expect(remainingCommunications[0].id).toBe(communication2Id);
    expect(remainingCommunications[0].subject).toBe('Second Communication');
  });

  it('should return false for zero or negative IDs', async () => {
    // Test with edge case IDs that should not exist
    const result1 = await deleteCommunication({ id: 0 });
    const result2 = await deleteCommunication({ id: -1 });

    expect(result1).toBe(false);
    expect(result2).toBe(false);
  });
});