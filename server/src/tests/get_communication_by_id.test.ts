import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable, communicationsTable } from '../db/schema';
import { type GetByIdInput, type CreatePropertyDealInput, type CreateCommunicationInput } from '../schema';
import { getCommunicationById } from '../handlers/get_communication_by_id';

// Test data
const testPropertyDeal: CreatePropertyDealInput = {
  name: 'Test Property Deal',
  address: '123 Test Street',
  status: 'active',
  description: 'A property deal for testing'
};

const testCommunicationData = {
  property_deal_id: 1, // Will be set dynamically after property deal creation
  date: '2023-12-01', // Use string format for database insertion
  type: 'email',
  subject: 'Test Communication',
  notes: 'This is a test communication note'
};

describe('getCommunicationById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return communication when found', async () => {
    // Create prerequisite property deal
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values(testPropertyDeal)
      .returning()
      .execute();
    
    const propertyDealId = propertyDealResult[0].id;

    // Create test communication
    const communicationResult = await db.insert(communicationsTable)
      .values({
        ...testCommunicationData,
        property_deal_id: propertyDealId
      })
      .returning()
      .execute();

    const communicationId = communicationResult[0].id;

    // Test the handler
    const input: GetByIdInput = { id: communicationId };
    const result = await getCommunicationById(input);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(communicationId);
    expect(result!.property_deal_id).toEqual(propertyDealId);
    expect(result!.type).toEqual('email');
    expect(result!.subject).toEqual('Test Communication');
    expect(result!.notes).toEqual('This is a test communication note');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when communication not found', async () => {
    const input: GetByIdInput = { id: 999 };
    const result = await getCommunicationById(input);

    expect(result).toBeNull();
  });

  it('should handle different communication types', async () => {
    // Create prerequisite property deal
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values(testPropertyDeal)
      .returning()
      .execute();
    
    const propertyDealId = propertyDealResult[0].id;

    // Create communication with different type
    const phoneCallCommunication = {
      ...testCommunicationData,
      property_deal_id: propertyDealId,
      type: 'phone_call',
      subject: 'Important Phone Call',
      notes: 'Discussed contract terms over the phone'
    };

    const communicationResult = await db.insert(communicationsTable)
      .values(phoneCallCommunication)
      .returning()
      .execute();

    const communicationId = communicationResult[0].id;

    // Test the handler
    const input: GetByIdInput = { id: communicationId };
    const result = await getCommunicationById(input);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(communicationId);
    expect(result!.type).toEqual('phone_call');
    expect(result!.subject).toEqual('Important Phone Call');
    expect(result!.notes).toEqual('Discussed contract terms over the phone');
  });

  it('should validate date fields are properly formatted', async () => {
    // Create prerequisite property deal
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values(testPropertyDeal)
      .returning()
      .execute();
    
    const propertyDealId = propertyDealResult[0].id;

    // Create communication with specific date
    const specificDate = '2023-06-15';
    const dateTestCommunication = {
      ...testCommunicationData,
      property_deal_id: propertyDealId,
      date: specificDate
    };

    const communicationResult = await db.insert(communicationsTable)
      .values(dateTestCommunication)
      .returning()
      .execute();

    const communicationId = communicationResult[0].id;

    // Test the handler
    const input: GetByIdInput = { id: communicationId };
    const result = await getCommunicationById(input);

    // Validate date handling
    expect(result).not.toBeNull();
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.date.toISOString().split('T')[0]).toEqual('2023-06-15');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});