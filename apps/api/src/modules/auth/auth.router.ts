import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@leadpilot/shared';
import * as authService from './auth.service.js';
import { AppError } from '../../lib/errors.js';

export const authRouter = Router();

// POST /api/v1/auth/register
authRouter.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const { user, workspace } = await authService.registerUser(req.body);
    req.session.userId = user.id;
    res.status(201).json({
      data: { user: { id: user.id, email: user.email, name: user.name }, workspace },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const user = await authService.loginUser(req.body);
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) return next(err);
      res.json({
        data: { user: { id: user.id, email: user.email, name: user.name } },
        meta: { requestId: req.requestId },
      });
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('leadpilot.sid');
    res.status(204).send();
  });
});

// GET /api/v1/me
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.session.userId!);
    const workspaceList = await authService.getUserWorkspaces(user.id);
    res.json({
      data: { user, workspaces: workspaceList },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', validate(ForgotPasswordSchema), async (req, res, next) => {
  try {
    await authService.initiatePasswordReset(req.body.email);
    // Always return 200 — do not indicate whether email exists
    res.json({
      data: { message: 'If that email is registered, a reset link has been sent.' },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/reset-password
authRouter.post('/reset-password', validate(ResetPasswordSchema), async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({
      data: { message: 'Password reset successfully.' },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});
