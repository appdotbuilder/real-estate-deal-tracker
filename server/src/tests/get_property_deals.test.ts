import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable } from '../db/schema';
import { type CreatePropertyDealInput } from '../schema';
import { getPropertyDeals } from '../handlers/get_property_deals';

// Test data for creating property deals
const testPropertyDeal1: CreatePropertyDealInput = {
  name: 'Sunset Villa',
  address: '123 Main Street, Anytown, ST 12345',
  status: 'active',
  description: 'Beautiful 3-bedroom villa with ocean view'
};

const testPropertyDeal2: CreatePropertyDealInput = {
  name: 'Downtown Office Building',
  address: '456 Business Ave, City Center, ST 67890',
  status: 'pending',
  description: 'Modern office space in prime location'
};

const testPropertyDeal3: CreatePropertyDealInput = {
  name: 'Lakeside Cottage',
  address: '789 Lake Road, Peaceful, ST 11111',
  status: 'closed',
  description: 'Cozy cottage by the lake, perfect for weekends'
};

describe('getPropertyDeals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no property deals exist', async () => {
    const result = await getPropertyDeals();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all property deals when they exist', async () => {
    // Create test property deals
    await db.insert(propertyDealsTable)
      .values([testPropertyDeal1, testPropertyDeal2, testPropertyDeal3])
      .execute();

    const result = await getPropertyDeals();

    expect(result).toHaveLength(3);
    
    // Check that all required fields are present
    result.forEach(deal => {
      expect(deal.id).toBeDefined();
      expect(typeof deal.id).toBe('number');
      expect(deal.name).toBeDefined();
      expect(typeof deal.name).toBe('string');
      expect(deal.address).toBeDefined();
      expect(typeof deal.address).toBe('string');
      expect(deal.status).toBeDefined();
      expect(typeof deal.status).toBe('string');
      expect(deal.description).toBeDefined();
      expect(typeof deal.description).toBe('string');
      expect(deal.created_at).toBeInstanceOf(Date);
      expect(deal.updated_at).toBeInstanceOf(Date);
    });

    // Check specific property deal data
    const sunsetVilla = result.find(deal => deal.name === 'Sunset Villa');
    expect(sunsetVilla).toBeDefined();
    expect(sunsetVilla?.address).toEqual('123 Main Street, Anytown, ST 12345');
    expect(sunsetVilla?.status).toEqual('active');
    expect(sunsetVilla?.description).toEqual('Beautiful 3-bedroom villa with ocean view');

    const officeBuilding = result.find(deal => deal.name === 'Downtown Office Building');
    expect(officeBuilding).toBeDefined();
    expect(officeBuilding?.status).toEqual('pending');

    const lakesideCottage = result.find(deal => deal.name === 'Lakeside Cottage');
    expect(lakesideCottage).toBeDefined();
    expect(lakesideCottage?.status).toEqual('closed');
  });

  it('should return property deals in creation order', async () => {
    // Create property deals one by one to test ordering
    const deal1Result = await db.insert(propertyDealsTable)
      .values(testPropertyDeal1)
      .returning()
      .execute();

    const deal2Result = await db.insert(propertyDealsTable)
      .values(testPropertyDeal2)
      .returning()
      .execute();

    const deal3Result = await db.insert(propertyDealsTable)
      .values(testPropertyDeal3)
      .returning()
      .execute();

    const result = await getPropertyDeals();

    expect(result).toHaveLength(3);
    
    // Verify they're returned in database order (by ID)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
    
    // Verify the names match expected order
    expect(result[0].name).toEqual('Sunset Villa');
    expect(result[1].name).toEqual('Downtown Office Building');
    expect(result[2].name).toEqual('Lakeside Cottage');
  });

  it('should handle property deals with different statuses', async () => {
    // Create property deals with various statuses
    const statusVariations = [
      { ...testPropertyDeal1, status: 'active' },
      { ...testPropertyDeal2, status: 'pending' },
      { ...testPropertyDeal3, status: 'closed' },
      { name: 'Test Deal 4', address: '999 Test St', status: 'cancelled', description: 'Cancelled deal' }
    ];

    await db.insert(propertyDealsTable)
      .values(statusVariations)
      .execute();

    const result = await getPropertyDeals();

    expect(result).toHaveLength(4);
    
    const statuses = result.map(deal => deal.status);
    expect(statuses).toContain('active');
    expect(statuses).toContain('pending');
    expect(statuses).toContain('closed');
    expect(statuses).toContain('cancelled');
  });

  it('should preserve timestamp data correctly', async () => {
    await db.insert(propertyDealsTable)
      .values(testPropertyDeal1)
      .execute();

    // Wait a brief moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const result = await getPropertyDeals();

    expect(result).toHaveLength(1);
    
    const deal = result[0];
    expect(deal.created_at).toBeInstanceOf(Date);
    expect(deal.updated_at).toBeInstanceOf(Date);
    
    // Created and updated timestamps should be close but potentially different
    const timeDiff = Math.abs(deal.updated_at.getTime() - deal.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Within 1 second
  });
});