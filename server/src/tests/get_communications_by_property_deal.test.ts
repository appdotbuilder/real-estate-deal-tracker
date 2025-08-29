import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable, communicationsTable } from '../db/schema';
import { type GetByPropertyDealIdInput } from '../schema';
import { getCommunicationsByPropertyDeal } from '../handlers/get_communications_by_property_deal';

describe('getCommunicationsByPropertyDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return communications for a specific property deal', async () => {
    // Create a property deal first
    const propertyDeal = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '123 Main St',
        status: 'active',
        description: 'Test property deal'
      })
      .returning()
      .execute();

    const propertyDealId = propertyDeal[0].id;

    // Create communications for this property deal
    await db.insert(communicationsTable)
      .values([
        {
          property_deal_id: propertyDealId,
          date: '2024-01-15',
          type: 'email',
          subject: 'Initial inquiry',
          notes: 'First contact with seller'
        },
        {
          property_deal_id: propertyDealId,
          date: '2024-01-16',
          type: 'phone',
          subject: 'Follow-up call',
          notes: 'Discussed property details'
        }
      ])
      .execute();

    const input: GetByPropertyDealIdInput = {
      property_deal_id: propertyDealId
    };

    const result = await getCommunicationsByPropertyDeal(input);

    expect(result).toHaveLength(2);
    expect(result[0].property_deal_id).toEqual(propertyDealId);
    expect(result[0].subject).toEqual('Initial inquiry');
    expect(result[0].type).toEqual('email');
    expect(result[0].notes).toEqual('First contact with seller');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].property_deal_id).toEqual(propertyDealId);
    expect(result[1].subject).toEqual('Follow-up call');
    expect(result[1].type).toEqual('phone');
    expect(result[1].notes).toEqual('Discussed property details');
  });

  it('should return empty array when no communications exist for property deal', async () => {
    // Create a property deal
    const propertyDeal = await db.insert(propertyDealsTable)
      .values({
        name: 'Empty Property',
        address: '456 Oak St',
        status: 'active',
        description: 'Property with no communications'
      })
      .returning()
      .execute();

    const input: GetByPropertyDealIdInput = {
      property_deal_id: propertyDeal[0].id
    };

    const result = await getCommunicationsByPropertyDeal(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return communications for the specified property deal', async () => {
    // Create two property deals
    const propertyDeals = await db.insert(propertyDealsTable)
      .values([
        {
          name: 'Property One',
          address: '111 First St',
          status: 'active',
          description: 'First property deal'
        },
        {
          name: 'Property Two',
          address: '222 Second St',
          status: 'active',
          description: 'Second property deal'
        }
      ])
      .returning()
      .execute();

    const propertyDealId1 = propertyDeals[0].id;
    const propertyDealId2 = propertyDeals[1].id;

    // Create communications for both property deals
    await db.insert(communicationsTable)
      .values([
        {
          property_deal_id: propertyDealId1,
          date: '2024-01-15',
          type: 'email',
          subject: 'Property One Communication',
          notes: 'Notes for property one'
        },
        {
          property_deal_id: propertyDealId2,
          date: '2024-01-16',
          type: 'phone',
          subject: 'Property Two Communication',
          notes: 'Notes for property two'
        },
        {
          property_deal_id: propertyDealId1,
          date: '2024-01-17',
          type: 'meeting',
          subject: 'Another Property One Communication',
          notes: 'More notes for property one'
        }
      ])
      .execute();

    const input: GetByPropertyDealIdInput = {
      property_deal_id: propertyDealId1
    };

    const result = await getCommunicationsByPropertyDeal(input);

    expect(result).toHaveLength(2);
    result.forEach(communication => {
      expect(communication.property_deal_id).toEqual(propertyDealId1);
    });

    // Verify subjects match property one communications
    const subjects = result.map(c => c.subject).sort();
    expect(subjects).toEqual(['Another Property One Communication', 'Property One Communication']);
  });

  it('should handle non-existent property deal id gracefully', async () => {
    const input: GetByPropertyDealIdInput = {
      property_deal_id: 999999 // Non-existent ID
    };

    const result = await getCommunicationsByPropertyDeal(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});