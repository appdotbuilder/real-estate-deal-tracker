import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, propertyDealsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPropertyDealId: number;
  let testTaskId: number;

  beforeEach(async () => {
    // Create a property deal first (required for foreign key)
    const propertyDealResult = await db.insert(propertyDealsTable)
      .values({
        name: 'Test Property',
        address: '123 Test St',
        status: 'active',
        description: 'Test property for tasks'
      })
      .returning()
      .execute();
    
    testPropertyDealId = propertyDealResult[0].id;

    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        property_deal_id: testPropertyDealId,
        name: 'Original Task',
        description: 'Original description',
        due_date: '2024-12-31',
        status: 'pending'
      })
      .returning()
      .execute();
    
    testTaskId = taskResult[0].id;
  });

  it('should update a task with all fields', async () => {
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      name: 'Updated Task Name',
      description: 'Updated description',
      due_date: new Date('2025-01-15'),
      status: 'in_progress'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testTaskId);
    expect(result!.name).toEqual('Updated Task Name');
    expect(result!.description).toEqual('Updated description');
    expect(result!.due_date).toEqual(new Date('2025-01-15'));
    expect(result!.status).toEqual('in_progress');
    expect(result!.property_deal_id).toEqual(testPropertyDealId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      name: 'Only Name Updated',
      status: 'completed'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Only Name Updated');
    expect(result!.status).toEqual('completed');
    // Other fields should remain unchanged
    expect(result!.description).toEqual('Original description');
    expect(result!.due_date).toEqual(new Date('2024-12-31'));
  });

  it('should update task in database', async () => {
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      name: 'Database Update Test',
      description: 'Testing database update'
    };

    await updateTask(updateInput);

    // Verify the task was updated in the database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTaskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toEqual('Database Update Test');
    expect(tasks[0].description).toEqual('Testing database update');
    expect(new Date(tasks[0].updated_at)).toBeInstanceOf(Date);
  });

  it('should return null for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      name: 'This should not work'
    };

    const result = await updateTask(updateInput);

    expect(result).toBeNull();
  });

  it('should update only the updated_at timestamp when no other fields provided', async () => {
    const originalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTaskId))
      .execute();

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: testTaskId
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Original Task');
    expect(result!.description).toEqual('Original description');
    expect(result!.updated_at.getTime()).toBeGreaterThan(new Date(originalTask[0].updated_at).getTime());
  });

  it('should handle date field updates correctly', async () => {
    const newDueDate = new Date('2025-06-15');
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      due_date: newDueDate
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.due_date).toEqual(newDueDate);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTaskId))
      .execute();

    expect(new Date(tasks[0].due_date)).toEqual(newDueDate);
  });
});