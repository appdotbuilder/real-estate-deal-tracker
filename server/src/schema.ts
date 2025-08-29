import { z } from 'zod';

// Property Deal schemas
export const propertyDealSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  status: z.string(),
  description: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type PropertyDeal = z.infer<typeof propertyDealSchema>;

export const createPropertyDealInputSchema = z.object({
  name: z.string(),
  address: z.string(),
  status: z.string(),
  description: z.string(),
});

export type CreatePropertyDealInput = z.infer<typeof createPropertyDealInputSchema>;

export const updatePropertyDealInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  address: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
});

export type UpdatePropertyDealInput = z.infer<typeof updatePropertyDealInputSchema>;

// Task schemas
export const taskSchema = z.object({
  id: z.number(),
  property_deal_id: z.number(),
  name: z.string(),
  description: z.string(),
  due_date: z.coerce.date(),
  status: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Task = z.infer<typeof taskSchema>;

export const createTaskInputSchema = z.object({
  property_deal_id: z.number(),
  name: z.string(),
  description: z.string(),
  due_date: z.coerce.date(),
  status: z.string(),
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
  due_date: z.coerce.date().optional(),
  status: z.string().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Document schemas
export const documentSchema = z.object({
  id: z.number(),
  property_deal_id: z.number(),
  name: z.string(),
  type: z.string(),
  upload_date: z.coerce.date(),
  file_path: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Document = z.infer<typeof documentSchema>;

export const createDocumentInputSchema = z.object({
  property_deal_id: z.number(),
  name: z.string(),
  type: z.string(),
  file_path: z.string().nullable(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

export const updateDocumentInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: z.string().optional(),
  file_path: z.string().nullable().optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentInputSchema>;

// Communication schemas
export const communicationSchema = z.object({
  id: z.number(),
  property_deal_id: z.number(),
  date: z.coerce.date(),
  type: z.string(),
  subject: z.string(),
  notes: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Communication = z.infer<typeof communicationSchema>;

export const createCommunicationInputSchema = z.object({
  property_deal_id: z.number(),
  date: z.coerce.date(),
  type: z.string(),
  subject: z.string(),
  notes: z.string(),
});

export type CreateCommunicationInput = z.infer<typeof createCommunicationInputSchema>;

export const updateCommunicationInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(),
  type: z.string().optional(),
  subject: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateCommunicationInput = z.infer<typeof updateCommunicationInputSchema>;

// Query parameter schemas
export const getByIdInputSchema = z.object({
  id: z.number(),
});

export type GetByIdInput = z.infer<typeof getByIdInputSchema>;

export const getByPropertyDealIdInputSchema = z.object({
  property_deal_id: z.number(),
});

export type GetByPropertyDealIdInput = z.infer<typeof getByPropertyDealIdInputSchema>;