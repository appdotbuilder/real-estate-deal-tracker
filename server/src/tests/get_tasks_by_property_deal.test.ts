import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable, tasksTable } from '../db/schema';
import { type GetByPropertyDealIdInput, type CreatePropertyDealInput, type CreateTaskInput } from '../schema';
import { getTasksByPropertyDeal } from '../handlers/get_tasks_by_property_deal';

describe('getTasksByPropertyDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testPropertyDealInput: CreatePropertyDealInput = {
    name: 'Test Property Deal',
    address: '123 Main St',
    status: 'active',
    description: 'A property deal for testing',
  };

  const testTaskInput = {
    property_deal_id: 1,
    name: 'Test Task',
    description: 'A task for testing',
    due_date: '2024-12-31',
    status: 'pending',
  };

  it('should return empty array when no tasks exist for property deal', async () => {
    // Create a property deal first
    await db.insert(propertyDealsTable)
      .values(testPropertyDealInput)
      .execute();

    const input: GetByPropertyDealIdInput = { property_deal_id: 1 };
    const result = await getTasksByPropertyDeal(input);

    expect(result).toEqual([]);
  });

  it('should return tasks for specified property deal', async () => {
    // Create a property deal first
    await db.insert(propertyDealsTable)
      .values(testPropertyDealInput)
      .execute();

    // Create a task for this property deal
    await db.insert(tasksTable)
      .values(testTaskInput)
      .execute();

    const input: GetByPropertyDealIdInput = { property_deal_id: 1 };
    const result = await getTasksByPropertyDeal(input);

    expect(result).toHaveLength(1);
    expect(result[0].property_deal_id).toEqual(1);
    expect(result[0].name).toEqual('Test Task');
    expect(result[0].description).toEqual('A task for testing');
    expect(result[0].status).toEqual('pending');
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should return multiple tasks for same property deal', async () => {
    // Create a property deal first
    await db.insert(propertyDealsTable)
      .values(testPropertyDealInput)
      .execute();

    // Create multiple tasks for this property deal
    const task1 = {
      ...testTaskInput,
      name: 'First Task',
      description: 'First task description',
    };

    const task2 = {
      ...testTaskInput,
      name: 'Second Task',
      description: 'Second task description',
      status: 'completed',
    };

    await db.insert(tasksTable)
      .values([task1, task2])
      .execute();

    const input: GetByPropertyDealIdInput = { property_deal_id: 1 };
    const result = await getTasksByPropertyDeal(input);

    expect(result).toHaveLength(2);
    expect(result.map(task => task.name)).toContain('First Task');
    expect(result.map(task => task.name)).toContain('Second Task');
    expect(result.every(task => task.property_deal_id === 1)).toBe(true);
  });

  it('should only return tasks for specified property deal', async () => {
    // Create two property deals
    const propertyDeal1 = { ...testPropertyDealInput, name: 'Property Deal 1' };
    const propertyDeal2 = { ...testPropertyDealInput, name: 'Property Deal 2' };

    await db.insert(propertyDealsTable)
      .values([propertyDeal1, propertyDeal2])
      .execute();

    // Create tasks for both property deals
    const taskForDeal1 = {
      ...testTaskInput,
      property_deal_id: 1,
      name: 'Task for Deal 1',
    };

    const taskForDeal2 = {
      ...testTaskInput,
      property_deal_id: 2,
      name: 'Task for Deal 2',
    };

    await db.insert(tasksTable)
      .values([taskForDeal1, taskForDeal2])
      .execute();

    // Query tasks for first property deal only
    const input: GetByPropertyDealIdInput = { property_deal_id: 1 };
    const result = await getTasksByPropertyDeal(input);

    expect(result).toHaveLength(1);
    expect(result[0].property_deal_id).toEqual(1);
    expect(result[0].name).toEqual('Task for Deal 1');
  });

  it('should return empty array for non-existent property deal', async () => {
    const input: GetByPropertyDealIdInput = { property_deal_id: 999 };
    const result = await getTasksByPropertyDeal(input);

    expect(result).toEqual([]);
  });

  it('should handle date fields correctly', async () => {
    // Create a property deal first
    await db.insert(propertyDealsTable)
      .values(testPropertyDealInput)
      .execute();

    // Create a task with a specific due date
    const taskWithDate = {
      ...testTaskInput,
      due_date: '2024-06-15',
    };

    await db.insert(tasksTable)
      .values(taskWithDate)
      .execute();

    const input: GetByPropertyDealIdInput = { property_deal_id: 1 };
    const result = await getTasksByPropertyDeal(input);

    expect(result).toHaveLength(1);
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].due_date.getFullYear()).toEqual(2024);
    expect(result[0].due_date.getMonth()).toEqual(5); // June is month 5 (0-indexed)
    expect(result[0].due_date.getDate()).toEqual(15);
  });
});