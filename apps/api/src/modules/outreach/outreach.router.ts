import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspace } from '../../middleware/workspace.js';
import { validate } from '../../middleware/validate.js';
import { GenerateOutreachSchema } from '@leadpilot/shared';
import * as outreachService from './outreach.service.js';

export const outreachRouter = Router();
export const aiRouter = Router();

outreachRouter.use(requireAuth);
outreachRouter.use(requireWorkspace);
aiRouter.use(requireAuth);
aiRouter.use(requireWorkspace);

// GET /api/v1/ai/providers
aiRouter.get('/providers', async (req, res, next) => {
  try {
    const providers = await outreachService.getProviders();
    res.json({ data: providers, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/ai/generate-outreach
aiRouter.post('/generate-outreach', validate(GenerateOutreachSchema), async (req, res, next) => {
  try {
    const result = await outreachService.generateOutreach(req.workspaceId, req.session.userId!, req.body);
    res.status(201).json({
      data: { message: result.message, usedFallback: result.usedFallback },
      meta: { requestId: req.requestId },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/outreach/messages
outreachRouter.get('/messages', async (req, res, next) => {
  try {
    const messages = await outreachService.listMessages(req.workspaceId, req.query['status'] as string);
    res.json({ data: messages, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// GET /api/v1/outreach/messages/:id
outreachRouter.get('/messages/:id', async (req, res, next) => {
  try {
    const message = await outreachService.getMessage(req.workspaceId, req.params['id']!);
    res.json({ data: message, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// PATCH /api/v1/outreach/messages/:id
outreachRouter.patch('/messages/:id', async (req, res, next) => {
  try {
    const message = await outreachService.updateMessage(
      req.workspaceId, req.params['id']!, req.body.content, req.body.subject,
    );
    res.json({ data: message, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/outreach/messages/:id/copy-log
outreachRouter.post('/messages/:id/copy-log', async (req, res, next) => {
  try {
    const result = await outreachService.logCopy(req.workspaceId, req.params['id']!, req.session.userId!);
    res.json({ data: result, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/outreach/messages/:id/mark-sent
outreachRouter.post('/messages/:id/mark-sent', async (req, res, next) => {
  try {
    const message = await outreachService.markSent(req.workspaceId, req.params['id']!, req.session.userId!);
    res.json({ data: message, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/outreach/messages/:id/log-reply
outreachRouter.post('/messages/:id/log-reply', async (req, res, next) => {
  try {
    const message = await outreachService.logReply(req.workspaceId, req.params['id']!, req.session.userId!, req.body.content);
    res.json({ data: message, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// POST /api/v1/outreach/messages/:id/archive
outreachRouter.post('/messages/:id/archive', async (req, res, next) => {
  try {
    const message = await outreachService.archiveMessage(req.workspaceId, req.params['id']!);
    res.json({ data: message, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});
