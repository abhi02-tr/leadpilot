import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import rateLimit from 'express-rate-limit';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.router.js';
import { campaignsRouter } from './modules/campaigns/campaigns.router.js';
import { leadsRouter } from './modules/leads/leads.router.js';
import { outreachRouter, aiRouter } from './modules/outreach/outreach.router.js';
import { followUpsRouter } from './modules/follow-ups/followups.router.js';
import { logger } from './lib/logger.js';
import { getPool } from './db/client.js';
import { requireAuth } from './middleware/auth.js';
import { requireWorkspace } from './middleware/workspace.js';
import * as analyticsService from './modules/analytics/analytics.service.js';
import * as qualificationService from './modules/qualification/qualification.service.js';

// ─── Validate required environment variables ──────────────────────────────────
const requiredEnv = ['DATABASE_URL', 'SESSION_SECRET'];
const missingEnv = requiredEnv.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the required values.');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:5173';

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: WEB_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Workspace-ID', 'X-Request-ID'],
}));

// ─── Request ID ───────────────────────────────────────────────────────────────
app.use(requestIdMiddleware);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Session ──────────────────────────────────────────────────────────────────
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool: getPool(),
    tableName: 'session',
    createTableIfMissing: true,
  }),
  name: 'leadpilot.sid',
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX ?? 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────
const api = express.Router();

api.use('/auth', authLimiter, authRouter);
api.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { getUserById, getUserWorkspaces } = await import('./modules/auth/auth.service.js');
    const user = await getUserById(req.session.userId!);
    const workspaces = await getUserWorkspaces(user.id);
    res.json({ data: { user, workspaces }, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

api.use('/campaigns', campaignsRouter);
api.use('/leads', leadsRouter);
api.use('/outreach', outreachRouter);
api.use('/ai', aiRouter);
api.use('/follow-ups', followUpsRouter);

// Dashboard summary
api.get('/dashboard/summary', requireAuth, requireWorkspace, async (req, res, next) => {
  try {
    const summary = await analyticsService.getDashboardSummary(req.workspaceId);
    res.json({ data: summary, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

// Qualification endpoint
api.post('/leads/:leadId/qualification', requireAuth, requireWorkspace, async (req, res, next) => {
  try {
    const result = await qualificationService.qualifyLead(
      req.workspaceId,
      req.params['leadId']!,
      req.body.campaignId,
      req.session.userId,
    );
    res.status(201).json({ data: result, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

api.get('/leads/:leadId/qualification', requireAuth, requireWorkspace, async (req, res, next) => {
  try {
    const result = await qualificationService.getLatestQualification(req.workspaceId, req.params['leadId']!);
    res.json({ data: result, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

app.use('/api/v1', api);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.', requestId: 'unknown' },
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'LeadPilot API server started');
});

export default app;
