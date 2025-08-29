import { serial, text, pgTable, timestamp, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Property Deals table
export const propertyDealsTable = pgTable('property_deals', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  status: text('status').notNull(),
  description: text('description').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  property_deal_id: integer('property_deal_id').notNull().references(() => propertyDealsTable.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  due_date: date('due_date').notNull(),
  status: text('status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Documents table
export const documentsTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  property_deal_id: integer('property_deal_id').notNull().references(() => propertyDealsTable.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  upload_date: date('upload_date').defaultNow().notNull(),
  file_path: text('file_path'), // Nullable for file storage path
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Communications table
export const communicationsTable = pgTable('communications', {
  id: serial('id').primaryKey(),
  property_deal_id: integer('property_deal_id').notNull().references(() => propertyDealsTable.id),
  date: date('date').notNull(),
  type: text('type').notNull(),
  subject: text('subject').notNull(),
  notes: text('notes').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Contacts table
export const contactsTable = pgTable('contacts', {
  id: serial('id').primaryKey(),
  property_deal_id: integer('property_deal_id').notNull().references(() => propertyDealsTable.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  organization: text('organization'), // Nullable
  email: text('email'), // Nullable
  phone: text('phone'), // Nullable
  notes: text('notes'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relationships
export const propertyDealsRelations = relations(propertyDealsTable, ({ many }) => ({
  tasks: many(tasksTable),
  documents: many(documentsTable),
  communications: many(communicationsTable),
  contacts: many(contactsTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  propertyDeal: one(propertyDealsTable, {
    fields: [tasksTable.property_deal_id],
    references: [propertyDealsTable.id],
  }),
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  propertyDeal: one(propertyDealsTable, {
    fields: [documentsTable.property_deal_id],
    references: [propertyDealsTable.id],
  }),
}));

export const communicationsRelations = relations(communicationsTable, ({ one }) => ({
  propertyDeal: one(propertyDealsTable, {
    fields: [communicationsTable.property_deal_id],
    references: [propertyDealsTable.id],
  }),
}));

export const contactsRelations = relations(contactsTable, ({ one }) => ({
  propertyDeal: one(propertyDealsTable, {
    fields: [contactsTable.property_deal_id],
    references: [propertyDealsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  propertyDeals: propertyDealsTable,
  tasks: tasksTable,
  documents: documentsTable,
  communications: communicationsTable,
  contacts: contactsTable,
};