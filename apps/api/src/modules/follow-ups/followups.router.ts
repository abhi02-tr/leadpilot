import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspace } from '../../middleware/workspace.js';
import { validate } from '../../middleware/validate.js';
import { CreateFollowUpSchema } from '@leadpilot/shared';
import * as followUpsService from './followups.service.js';

export const followUpsRouter = Router();

followUpsRouter.use(requireAuth);
followUpsRouter.use(requireWorkspace);

// GET /api/v1/follow-ups
followUpsRouter.get('/', async (req, res, next) => {
  try {
    const tasks = await followUpsService.listFollowUps(req.workspaceId, req.query['view'] as string);
    res.json({ data: tasks, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/follow-ups
followUpsRouter.post('/', validate(CreateFollowUpSchema), async (req, res, next) => {
  try {
    const task = await followUpsService.createFollowUp(req.workspaceId, req.session.userId!, req.body);
    res.status(201).json({ data: task, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// PATCH /api/v1/follow-ups/:id
followUpsRouter.patch('/:id', async (req, res, next) => {
  try {
    const task = await followUpsService.updateFollowUp(req.workspaceId, req.params['id']!, req.body);
    res.json({ data: task, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/follow-ups/:id/complete
followUpsRouter.post('/:id/complete', async (req, res, next) => {
  try {
    const task = await followUpsService.completeFollowUp(req.workspaceId, req.params['id']!, req.session.userId!);
    res.json({ data: task, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/follow-ups/:id/cancel
followUpsRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    const task = await followUpsService.cancelFollowUp(req.workspaceId, req.params['id']!);
    res.json({ data: task, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});
