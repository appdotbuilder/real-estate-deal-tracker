import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { communicationsTable, propertyDealsTable } from '../db/schema';
import { type CreateCommunicationInput } from '../schema';
import { createCommunication } from '../handlers/create_communication';
import { eq } from 'drizzle-orm';

describe('createCommunication', () => {
  let propertyDealId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a property deal first (required for foreign key)
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property Deal',
        address: '123 Test St',
        status: 'Active',
        description: 'Test property deal for communication'
      })
      .returning()
      .execute();
    
    propertyDealId = propertyDealResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateCommunicationInput = {
    property_deal_id: 0, // Will be set in tests
    date: new Date('2024-01-15'),
    type: 'email',
    subject: 'Initial Property Inquiry',
    notes: 'Client expressed interest in the property and requested a viewing.'
  };

  it('should create a communication', async () => {
    const input = { ...testInput, property_deal_id: propertyDealId };
    const result = await createCommunication(input);

    // Basic field validation
    expect(result.property_deal_id).toEqual(propertyDealId);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.type).toEqual('email');
    expect(result.subject).toEqual('Initial Property Inquiry');
    expect(result.notes).toEqual('Client expressed interest in the property and requested a viewing.');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save communication to database', async () => {
    const input = { ...testInput, property_deal_id: propertyDealId };
    const result = await createCommunication(input);

    // Query to verify database record
    const communications = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.id, result.id))
      .execute();

    expect(communications).toHaveLength(1);
    expect(communications[0].property_deal_id).toEqual(propertyDealId);
    expect(communications[0].date).toEqual('2024-01-15'); // Database stores as string
    expect(communications[0].type).toEqual('email');
    expect(communications[0].subject).toEqual('Initial Property Inquiry');
    expect(communications[0].notes).toEqual('Client expressed interest in the property and requested a viewing.');
    expect(communications[0].created_at).toBeInstanceOf(Date);
    expect(communications[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create communication with different types', async () => {
    const phoneInput = {
      ...testInput,
      property_deal_id: propertyDealId,
      type: 'phone',
      subject: 'Follow-up Call',
      notes: 'Discussed property details and scheduling.'
    };

    const result = await createCommunication(phoneInput);

    expect(result.type).toEqual('phone');
    expect(result.subject).toEqual('Follow-up Call');
    expect(result.notes).toEqual('Discussed property details and scheduling.');
  });

  it('should handle long notes content', async () => {
    const longNotes = 'This is a very detailed communication note that contains extensive information about the property discussion, including multiple topics covered, client preferences, timeline requirements, and various other details that might be important for future reference and follow-up activities.';
    
    const input = {
      ...testInput,
      property_deal_id: propertyDealId,
      notes: longNotes
    };

    const result = await createCommunication(input);

    expect(result.notes).toEqual(longNotes);
    expect(result.notes.length).toBeGreaterThan(200);
  });

  it('should create multiple communications for same property deal', async () => {
    const input1 = {
      ...testInput,
      property_deal_id: propertyDealId,
      subject: 'First Communication'
    };

    const input2 = {
      ...testInput,
      property_deal_id: propertyDealId,
      date: new Date('2024-01-16'),
      subject: 'Second Communication',
      type: 'phone'
    };

    const result1 = await createCommunication(input1);
    const result2 = await createCommunication(input2);

    expect(result1.property_deal_id).toEqual(propertyDealId);
    expect(result2.property_deal_id).toEqual(propertyDealId);
    expect(result1.subject).toEqual('First Communication');
    expect(result2.subject).toEqual('Second Communication');
    expect(result1.id).not.toEqual(result2.id);

    // Verify both records exist in database
    const communications = await db.select()
      .from(communicationsTable)
      .where(eq(communicationsTable.property_deal_id, propertyDealId))
      .execute();

    expect(communications).toHaveLength(2);
  });

  it('should fail with invalid property_deal_id', async () => {
    const invalidInput = {
      ...testInput,
      property_deal_id: 99999 // Non-existent property deal ID
    };

    await expect(createCommunication(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});