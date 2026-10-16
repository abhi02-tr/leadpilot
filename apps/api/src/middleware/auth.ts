import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';

/**
 * Requires an authenticated session. Attaches session user to req.
 * Must be placed after session middleware.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    throw AppError.unauthorized();
  }
  next();
}

declare module 'express-session' {
  interface SessionData {
    userId: string;
    workspaceId?: string;
  }
}
