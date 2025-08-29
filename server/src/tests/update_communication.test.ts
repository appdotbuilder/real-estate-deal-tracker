import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { communicationsTable, propertyDealsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateCommunicationInput, type CreatePropertyDealInput } from '../schema';
import { updateCommunication } from '../handlers/update_communication';

// Test data setup
const testPropertyDeal: CreatePropertyDealInput = {
  name: 'Test Property Deal',
  address: '123 Test St',
  status: 'active',
  description: 'A property deal for testing'
};

const testCommunication = {
  property_deal_id: 1, // Will be set after property deal creation
  date: '2024-01-15',
  type: 'email',
  subject: 'Initial Contact',
  notes: 'First communication with seller'
};

describe('updateCommunication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let propertyDealId: number;
  let communicationId: number;

  beforeEach(async () => {
    // Create property deal first
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values(testPropertyDeal)
      .returning()
      .execute();
    propertyDealId = propertyDealResult[0].id;

    // Create communication to update
    const communicationResult = await db.insert(communicationsTable)
      .values({
        ...testCommunication,
        property_deal_id: propertyDealId
      })
      .returning()
      .execute();
    communicationId = communicationResult[0].id;
  });

  it('should update all communication fields', async () => {
    const updateInput: UpdateCommunicationInput = {
      id: communicationId,
      date: new Date('2024-02-01'),
      type: 'phone',
      subject: 'Follow-up Call',
      notes: 'Discussed pricing details'
    };

    const result = await updateCommunication(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(communicationId);
    expect(result!.property_deal_id).toEqual(propertyDealId);
    expect(result!.date).toEqual(new Date('2024-02-01'));
    expect(result!.type).toEqual('phone');
    expect(result!.subject).toEqual('Follow-up Call');
    expect(result!.notes).toEqual('Discussed pricing details');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update partial communication fields', async () => {
    const updateInput: UpdateCommunicationInput = {
      id: communicationId,
      type: 'meeting',
      subject: 'Property Viewing'
    };

    const result = await updateCommunication(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(communicationId);
    expect(result!.type).toEqual('meeting');
    expect(result!.subject).toEqual('Property Viewing');
    // Original values should remain unchanged
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.notes).toEqual('First communication with seller');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only the date field', async () => {
    const updateInput: UpdateCommunicationInput = {
      id: communicationId,
      date: new Date('2024-03-01')
    };

    const result = await updateCommunication(updateInput);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(new Date('2024-03-01'));
    // Other fields should remain unchanged
    expect(result!.type).toEqual('email');
    expect(result!.subject).toEqual('Initial Contact');
    expect(result!.notes).toEqual('First communication with seller');
  });

  it('should update only the notes field', async () => {
    const updateInput: UpdateCommunicationInput = {
      id: communicationId,
      notes: 'Updated notes with more details'
    };

    const result = await updateCommunication(updateInput);

    expect(result).not.toBeNull();
    expect(result!.notes).toEqual('Updated notes with more details');
    // Other fields should remain unchanged
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.type).toEqual('email');
    expect(result!.subject).toEqual('Initial Contact');
  });

  it('should save updated communication to database', async () => {
    const updateInput: UpdateCommunicationInput = {
      id: communicationId,
      type: 'text',
      notes: 'Quick update via text message'
    };

    await updateCommunication(updateInput);

    // Query database directly to verify changes
    const communications = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.id, communicationId))
      .execute();

    expect(communications).toHaveLength(1);
    expect(communications[0].type).toEqual('text');
    expect(communications[0].notes).toEqual('Quick update via text message');
    expect(communications[0].updated_at).toBeInstanceOf(Date);
    // Verify date is stored correctly in database
    expect(new Date(communications[0].date)).toEqual(new Date('2024-01-15'));
  });

  it('should return null when communication does not exist', async () => {
    const updateInput: UpdateCommunicationInput = {
      id: 999999, // Non-existent ID
      type: 'email',
      subject: 'Test Update'
    };

    const result = await updateCommunication(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided to update', async () => {
    const updateInput: UpdateCommunicationInput = {
      id: communicationId
      // No update fields provided
    };

    const result = await updateCommunication(updateInput);

    expect(result).toBeNull();
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalCommunications = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.id, communicationId))
      .execute();
    const originalUpdatedAt = originalCommunications[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateCommunicationInput = {
      id: communicationId,
      type: 'updated'
    };

    const result = await updateCommunication(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle date updates correctly', async () => {
    const futureDate = new Date('2024-12-31');
    const updateInput: UpdateCommunicationInput = {
      id: communicationId,
      date: futureDate
    };

    const result = await updateCommunication(updateInput);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(futureDate);
    expect(typeof result!.date).toBe('object');
    expect(result!.date).toBeInstanceOf(Date);
    
    // Verify the date was stored correctly in database
    const dbCommunications = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.id, communicationId))
      .execute();
    expect(new Date(dbCommunications[0].date)).toEqual(futureDate);
  });
});