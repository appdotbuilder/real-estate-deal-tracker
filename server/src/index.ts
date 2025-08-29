import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import all schema types
import {
  createPropertyDealInputSchema,
  updatePropertyDealInputSchema,
  getByIdInputSchema,
  getByPropertyDealIdInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  createDocumentInputSchema,
  updateDocumentInputSchema,
  createCommunicationInputSchema,
  updateCommunicationInputSchema,
} from './schema';

// Import all handlers
import { createPropertyDeal } from './handlers/create_property_deal';
import { getPropertyDeals } from './handlers/get_property_deals';
import { getPropertyDealById } from './handlers/get_property_deal_by_id';
import { updatePropertyDeal } from './handlers/update_property_deal';
import { deletePropertyDeal } from './handlers/delete_property_deal';

import { createTask } from './handlers/create_task';
import { getTasksByPropertyDeal } from './handlers/get_tasks_by_property_deal';
import { getTaskById } from './handlers/get_task_by_id';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';

import { createDocument } from './handlers/create_document';
import { getDocumentsByPropertyDeal } from './handlers/get_documents_by_property_deal';
import { getDocumentById } from './handlers/get_document_by_id';
import { updateDocument } from './handlers/update_document';
import { deleteDocument } from './handlers/delete_document';

import { createCommunication } from './handlers/create_communication';
import { getCommunicationsByPropertyDeal } from './handlers/get_communications_by_property_deal';
import { getCommunicationById } from './handlers/get_communication_by_id';
import { updateCommunication } from './handlers/update_communication';
import { deleteCommunication } from './handlers/delete_communication';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Property Deal routes
  createPropertyDeal: publicProcedure
    .input(createPropertyDealInputSchema)
    .mutation(({ input }) => createPropertyDeal(input)),
  
  getPropertyDeals: publicProcedure
    .query(() => getPropertyDeals()),
  
  getPropertyDealById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getPropertyDealById(input)),
  
  updatePropertyDeal: publicProcedure
    .input(updatePropertyDealInputSchema)
    .mutation(({ input }) => updatePropertyDeal(input)),
  
  deletePropertyDeal: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deletePropertyDeal(input)),

  // Task routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  
  getTasksByPropertyDeal: publicProcedure
    .input(getByPropertyDealIdInputSchema)
    .query(({ input }) => getTasksByPropertyDeal(input)),
  
  getTaskById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getTaskById(input)),
  
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  
  deleteTask: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteTask(input)),

  // Document routes
  createDocument: publicProcedure
    .input(createDocumentInputSchema)
    .mutation(({ input }) => createDocument(input)),
  
  getDocumentsByPropertyDeal: publicProcedure
    .input(getByPropertyDealIdInputSchema)
    .query(({ input }) => getDocumentsByPropertyDeal(input)),
  
  getDocumentById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getDocumentById(input)),
  
  updateDocument: publicProcedure
    .input(updateDocumentInputSchema)
    .mutation(({ input }) => updateDocument(input)),
  
  deleteDocument: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteDocument(input)),

  // Communication routes
  createCommunication: publicProcedure
    .input(createCommunicationInputSchema)
    .mutation(({ input }) => createCommunication(input)),
  
  getCommunicationsByPropertyDeal: publicProcedure
    .input(getByPropertyDealIdInputSchema)
    .query(({ input }) => getCommunicationsByPropertyDeal(input)),
  
  getCommunicationById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getCommunicationById(input)),
  
  updateCommunication: publicProcedure
    .input(updateCommunicationInputSchema)
    .mutation(({ input }) => updateCommunication(input)),
  
  deleteCommunication: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteCommunication(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();