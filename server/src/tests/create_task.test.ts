import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, propertyDealsTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test input data
const testTaskInput: CreateTaskInput = {
  property_deal_id: 1,
  name: 'Test Task',
  description: 'A task for testing',
  due_date: new Date('2024-12-31'),
  status: 'pending'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a property deal for testing
  const createTestPropertyDeal = async () => {
    const result = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property Deal',
        address: '123 Test Street',
        status: 'active',
        description: 'A property deal for testing'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a task successfully', async () => {
    // Create prerequisite property deal
    await createTestPropertyDeal();

    const result = await createTask(testTaskInput);

    // Verify all fields are correctly set
    expect(result.property_deal_id).toEqual(1);
    expect(result.name).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database correctly', async () => {
    // Create prerequisite property deal
    await createTestPropertyDeal();

    const result = await createTask(testTaskInput);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    const savedTask = tasks[0];
    expect(savedTask.property_deal_id).toEqual(1);
    expect(savedTask.name).toEqual('Test Task');
    expect(savedTask.description).toEqual('A task for testing');
    expect(new Date(savedTask.due_date)).toEqual(new Date('2024-12-31'));
    expect(savedTask.status).toEqual('pending');
    expect(savedTask.created_at).toBeInstanceOf(Date);
    expect(savedTask.updated_at).toBeInstanceOf(Date);
  });

  it('should handle date conversion correctly', async () => {
    // Create prerequisite property deal
    await createTestPropertyDeal();

    const taskWithSpecificDate: CreateTaskInput = {
      ...testTaskInput,
      due_date: new Date('2025-06-15')
    };

    const result = await createTask(taskWithSpecificDate);

    // Verify date is properly converted and maintained
    expect(result.due_date).toEqual(new Date('2025-06-15'));
    expect(result.due_date).toBeInstanceOf(Date);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(new Date(tasks[0].due_date)).toEqual(new Date('2025-06-15'));
  });

  it('should throw error for non-existent property deal', async () => {
    // Don't create a property deal - test with non-existent ID
    const invalidInput: CreateTaskInput = {
      ...testTaskInput,
      property_deal_id: 999
    };

    await expect(createTask(invalidInput)).rejects.toThrow(/Property deal with id 999 not found/i);
  });

  it('should create tasks with different statuses', async () => {
    // Create prerequisite property deal
    await createTestPropertyDeal();

    const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    
    for (const status of statuses) {
      const taskInput: CreateTaskInput = {
        ...testTaskInput,
        name: `Task with ${status} status`,
        status: status
      };

      const result = await createTask(taskInput);
      
      expect(result.status).toEqual(status);
      expect(result.name).toEqual(`Task with ${status} status`);
    }

    // Verify all tasks were created
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(statuses.length);
  });

  it('should create multiple tasks for the same property deal', async () => {
    // Create prerequisite property deal
    const propertyDeal = await createTestPropertyDeal();

    const task1Input: CreateTaskInput = {
      ...testTaskInput,
      name: 'First Task',
      due_date: new Date('2024-11-01')
    };

    const task2Input: CreateTaskInput = {
      ...testTaskInput,
      name: 'Second Task',
      due_date: new Date('2024-11-15')
    };

    const result1 = await createTask(task1Input);
    const result2 = await createTask(task2Input);

    expect(result1.property_deal_id).toEqual(propertyDeal.id);
    expect(result2.property_deal_id).toEqual(propertyDeal.id);
    expect(result1.name).toEqual('First Task');
    expect(result2.name).toEqual('Second Task');
    expect(result1.id).not.toEqual(result2.id);

    // Verify both tasks exist in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.property_deal_id, propertyDeal.id))
      .execute();

    expect(tasks).toHaveLength(2);
  });
});