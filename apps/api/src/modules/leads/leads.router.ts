import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspace } from '../../middleware/workspace.js';
import { validate } from '../../middleware/validate.js';
import { CreateLeadSchema, UpdateLeadSchema, LeadFiltersSchema, CreateContactSchema } from '@leadpilot/shared';
import * as leadsService from './leads.service.js';

export const leadsRouter = Router();

leadsRouter.use(requireAuth);
leadsRouter.use(requireWorkspace);

// GET /api/v1/leads
leadsRouter.get('/', validate(LeadFiltersSchema, 'query'), async (req, res, next) => {
  try {
    const result = await leadsService.listLeads(req.workspaceId, req.query as any);
    res.json({ data: result.items, meta: { requestId: req.requestId, cursor: result.cursor, total: result.total } });
  } catch (err) { next(err); }
});

// GET /api/v1/leads/export/csv
leadsRouter.get('/export/csv', async (req, res, next) => {
  try {
    const csvData = await leadsService.exportLeadsToCsv(req.workspaceId, req.query as any);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leadpilot-leads.csv"');
    res.send(csvData);
  } catch (err) { next(err); }
});

// POST /api/v1/leads/import/csv
leadsRouter.post('/import/csv', async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    const summary = await leadsService.importLeadsFromCsv(req.workspaceId, rows);
    res.status(200).json({ data: summary, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/leads
leadsRouter.post('/', validate(CreateLeadSchema), async (req, res, next) => {
  try {
    const lead = await leadsService.createLead(req.workspaceId, req.body);
    res.status(201).json({ data: lead, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// GET /api/v1/leads/:id
leadsRouter.get('/:id', async (req, res, next) => {
  try {
    const lead = await leadsService.getLead(req.workspaceId, req.params['id']!);
    res.json({ data: lead, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// PATCH /api/v1/leads/:id
leadsRouter.patch('/:id', validate(UpdateLeadSchema), async (req, res, next) => {
  try {
    const lead = await leadsService.updateLead(req.workspaceId, req.params['id']!, req.body);
    res.json({ data: lead, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// DELETE /api/v1/leads/:id
leadsRouter.delete('/:id', async (req, res, next) => {
  try {
    await leadsService.deleteLead(req.workspaceId, req.params['id']!);
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET /api/v1/leads/:id/activities
leadsRouter.get('/:id/activities', async (req, res, next) => {
  try {
    const acts = await leadsService.getLeadActivities(req.workspaceId, req.params['id']!);
    res.json({ data: acts, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// GET /api/v1/leads/:id/contacts
leadsRouter.get('/:id/contacts', async (req, res, next) => {
  try {
    const contacts = await leadsService.getLeadContacts(req.workspaceId, req.params['id']!);
    res.json({ data: contacts, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/leads/:id/contacts
leadsRouter.post('/:id/contacts', validate(CreateContactSchema), async (req, res, next) => {
  try {
    const contact = await leadsService.createContact(req.workspaceId, req.params['id']!, req.body);
    res.status(201).json({ data: contact, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// DELETE /api/v1/leads/:id/contacts/:contactId
leadsRouter.delete('/:id/contacts/:contactId', async (req, res, next) => {
  try {
    await leadsService.deleteContact(req.workspaceId, req.params['id']!, req.params['contactId']!);
    res.status(204).send();
  } catch (err) { next(err); }
});
