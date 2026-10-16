import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspace, requirePermission } from '../../middleware/workspace.js';
import { validate } from '../../middleware/validate.js';
import { CreateCampaignSchema, UpdateCampaignSchema } from '@leadpilot/shared';
import * as campaignService from './campaigns.service.js';

export const campaignsRouter = Router();

// All campaign routes require auth + workspace
campaignsRouter.use(requireAuth);
campaignsRouter.use(requireWorkspace);

// GET /api/v1/campaigns
campaignsRouter.get('/', async (req, res, next) => {
  try {
    const result = await campaignService.listCampaigns(req.workspaceId, req.query);
    res.json({ data: result.items, meta: { requestId: req.requestId, cursor: result.cursor, total: result.total } });
  } catch (err) { next(err); }
});

// POST /api/v1/campaigns
campaignsRouter.post('/', requirePermission('campaign:create'), validate(CreateCampaignSchema), async (req, res, next) => {
  try {
    const campaign = await campaignService.createCampaign(req.workspaceId, req.session.userId!, req.body);
    res.status(201).json({ data: campaign, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// GET /api/v1/campaigns/:id
campaignsRouter.get('/:id', async (req, res, next) => {
  try {
    const campaign = await campaignService.getCampaign(req.workspaceId, req.params['id']!);
    res.json({ data: campaign, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// PATCH /api/v1/campaigns/:id
campaignsRouter.patch('/:id', requirePermission('campaign:update'), validate(UpdateCampaignSchema), async (req, res, next) => {
  try {
    const campaign = await campaignService.updateCampaign(req.workspaceId, req.params['id']!, req.body);
    res.json({ data: campaign, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// DELETE /api/v1/campaigns/:id — archives by default
campaignsRouter.delete('/:id', requirePermission('campaign:delete'), async (req, res, next) => {
  try {
    await campaignService.archiveCampaign(req.workspaceId, req.params['id']!);
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET /api/v1/campaigns/:id/leads
campaignsRouter.get('/:id/leads', async (req, res, next) => {
  try {
    const leads = await campaignService.listCampaignLeads(req.workspaceId, req.params['id']!);
    res.json({ data: leads, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/campaigns/:id/leads
campaignsRouter.post('/:id/leads', async (req, res, next) => {
  try {
    const lead = await campaignService.addLeadToCampaign(req.workspaceId, req.params['id']!, req.body.leadId);
    res.status(201).json({ data: lead, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// PATCH /api/v1/campaigns/:id/leads/:leadId
campaignsRouter.patch('/:id/leads/:leadId', async (req, res, next) => {
  try {
    const lead = await campaignService.updateCampaignLeadStatus(req.workspaceId, req.params['id']!, req.params['leadId']!, req.body.status);
    res.json({ data: lead, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// DELETE /api/v1/campaigns/:id/leads/:leadId
campaignsRouter.delete('/:id/leads/:leadId', async (req, res, next) => {
  try {
    await campaignService.removeLeadFromCampaign(req.workspaceId, req.params['id']!, req.params['leadId']!);
    res.status(204).send();
  } catch (err) { next(err); }
});

