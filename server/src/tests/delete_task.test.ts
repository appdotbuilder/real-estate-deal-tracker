import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { propertyDealsTable, tasksTable } from '../db/schema';
import { type GetByIdInput, type CreatePropertyDealInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input
const testInput: GetByIdInput = {
  id: 1
};

// Helper function to create a property deal
const createTestPropertyDeal = async (): Promise<number> => {
  const propertyDealInput: CreatePropertyDealInput = {
    name: 'Test Property',
    address: '123 Test St',
    status: 'Active',
    description: 'A test property deal'
  };

  const result = await db.insert(propertyDealsTable)
    .values(propertyDealInput)
    .returning()
    .execute();

  return result[0].id;
};

// Helper function to create a task
const createTestTask = async (propertyDealId: number): Promise<number> => {
  const taskInput: CreateTaskInput = {
    property_deal_id: propertyDealId,
    name: 'Test Task',
    description: 'A test task',
    due_date: new Date('2024-12-31'),
    status: 'Pending'
  };

  const result = await db.insert(tasksTable)
    .values({
      ...taskInput,
      due_date: taskInput.due_date.toISOString().split('T')[0] // Convert date to string for date column
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task and return true', async () => {
    // Create prerequisite property deal and task
    const propertyDealId = await createTestPropertyDeal();
    const taskId = await createTestTask(propertyDealId);

    // Verify task exists before deletion
    const tasksBefore = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(tasksBefore).toHaveLength(1);

    // Delete the task
    const result = await deleteTask({ id: taskId });

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify task was deleted from database
    const tasksAfter = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(tasksAfter).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent task', async () => {
    const nonExistentId = 999;

    // Verify no task with this ID exists
    const tasksBefore = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, nonExistentId))
      .execute();
    expect(tasksBefore).toHaveLength(0);

    // Try to delete non-existent task
    const result = await deleteTask({ id: nonExistentId });

    // Should return false indicating no deletion occurred
    expect(result).toBe(false);
  });

  it('should delete only the specified task when multiple tasks exist', async () => {
    // Create prerequisite property deal
    const propertyDealId = await createTestPropertyDeal();
    
    // Create multiple tasks
    const taskId1 = await createTestTask(propertyDealId);
    const taskId2 = await createTestTask(propertyDealId);

    // Verify both tasks exist
    const tasksBefore = await db.select()
      .from(tasksTable)
      .execute();
    expect(tasksBefore).toHaveLength(2);

    // Delete only the first task
    const result = await deleteTask({ id: taskId1 });

    // Should return true
    expect(result).toBe(true);

    // Verify only first task was deleted
    const tasksAfter = await db.select()
      .from(tasksTable)
      .execute();
    expect(tasksAfter).toHaveLength(1);
    expect(tasksAfter[0].id).toBe(taskId2);

    // Verify specific task was deleted
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId1))
      .execute();
    expect(deletedTask).toHaveLength(0);
  });

  it('should handle deletion with valid foreign key constraints', async () => {
    // Create prerequisite property deal and task
    const propertyDealId = await createTestPropertyDeal();
    const taskId = await createTestTask(propertyDealId);

    // Verify the property deal still exists (foreign key constraint)
    const propertyDealsBefore = await db.select()
      .from(propertyDealsTable)
      .where(eq(propertyDealsTable.id, propertyDealId))
      .execute();
    expect(propertyDealsBefore).toHaveLength(1);

    // Delete the task
    const result = await deleteTask({ id: taskId });
    expect(result).toBe(true);

    // Property deal should still exist after task deletion
    const propertyDealsAfter = await db.select()
      .from(propertyDealsTable)
      .where(eq(propertyDealsTable.id, propertyDealId))
      .execute();
    expect(propertyDealsAfter).toHaveLength(1);
  });
});