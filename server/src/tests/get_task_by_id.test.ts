import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable, tasksTable } from '../db/schema';
import { type GetByIdInput, type CreatePropertyDealInput, type CreateTaskInput } from '../schema';
import { getTaskById } from '../handlers/get_task_by_id';

// Test input for getting task by ID
const testGetInput: GetByIdInput = {
  id: 1
};

// Prerequisites for task creation
const testPropertyDeal: CreatePropertyDealInput = {
  name: 'Test Property Deal',
  address: '123 Test Street',
  status: 'active',
  description: 'A property deal for testing'
};

const testTaskInput: CreateTaskInput = {
  property_deal_id: 1,
  name: 'Test Task',
  description: 'A task for testing',
  due_date: new Date('2024-12-31'),
  status: 'pending'
};

describe('getTaskById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when it exists', async () => {
    // Create prerequisite property deal
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values(testPropertyDeal)
      .returning()
      .execute();

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTaskInput,
        property_deal_id: propertyDealResult[0].id,
        due_date: testTaskInput.due_date.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
      })
      .returning()
      .execute();

    const createdTask = taskResult[0];

    // Test the handler
    const result = await getTaskById({ id: createdTask.id });

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.property_deal_id).toEqual(propertyDealResult[0].id);
    expect(result!.name).toEqual('Test Task');
    expect(result!.description).toEqual('A task for testing');
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.due_date.toISOString().split('T')[0]).toEqual('2024-12-31');
    expect(result!.status).toEqual('pending');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task does not exist', async () => {
    const result = await getTaskById({ id: 999 });

    expect(result).toBeNull();
  });

  it('should return correct task when multiple tasks exist', async () => {
    // Create prerequisite property deal
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values(testPropertyDeal)
      .returning()
      .execute();

    // Create multiple test tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        property_deal_id: propertyDealResult[0].id,
        name: 'First Task',
        description: 'First task description',
        due_date: '2024-12-01',
        status: 'pending'
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        property_deal_id: propertyDealResult[0].id,
        name: 'Second Task',
        description: 'Second task description',
        due_date: '2024-12-15',
        status: 'completed'
      })
      .returning()
      .execute();

    // Test getting the second task specifically
    const result = await getTaskById({ id: task2Result[0].id });

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(task2Result[0].id);
    expect(result!.name).toEqual('Second Task');
    expect(result!.description).toEqual('Second task description');
    expect(result!.status).toEqual('completed');
    expect(result!.due_date.toISOString().split('T')[0]).toEqual('2024-12-15');
  });

  it('should handle date conversion correctly', async () => {
    // Create prerequisite property deal
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values(testPropertyDeal)
      .returning()
      .execute();

    // Create task with specific date
    const specificDate = new Date('2025-03-15');
    const taskResult = await db.insert(tasksTable)
      .values({
        property_deal_id: propertyDealResult[0].id,
        name: 'Date Test Task',
        description: 'Testing date conversion',
        due_date: specificDate.toISOString().split('T')[0],
        status: 'in_progress'
      })
      .returning()
      .execute();

    const result = await getTaskById({ id: taskResult[0].id });

    expect(result).not.toBeNull();
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.due_date.getFullYear()).toEqual(2025);
    expect(result!.due_date.getMonth()).toEqual(2); // March is month 2 (0-indexed)
    expect(result!.due_date.getDate()).toEqual(15);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should preserve all task properties', async () => {
    // Create prerequisite property deal
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values(testPropertyDeal)
      .returning()
      .execute();

    // Create task with all properties
    const taskResult = await db.insert(tasksTable)
      .values({
        property_deal_id: propertyDealResult[0].id,
        name: 'Complete Task Test',
        description: 'Testing all task properties preservation',
        due_date: '2024-06-30',
        status: 'overdue'
      })
      .returning()
      .execute();

    const result = await getTaskById({ id: taskResult[0].id });

    expect(result).not.toBeNull();
    
    // Verify all properties are preserved
    const expectedProperties = ['id', 'property_deal_id', 'name', 'description', 'due_date', 'status', 'created_at', 'updated_at'];
    expectedProperties.forEach(prop => {
      expect(result).toHaveProperty(prop);
      expect(result![prop as keyof typeof result]).toBeDefined();
    });

    // Verify data types
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.property_deal_id).toBe('number');
    expect(typeof result!.name).toBe('string');
    expect(typeof result!.description).toBe('string');
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(typeof result!.status).toBe('string');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});