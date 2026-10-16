import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Validates and replaces req[target] with the parsed Zod result.
 * Returns 400 with field-level details on failure.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw AppError.fromZod(result.error as ZodError);
    }
    // Replace with parsed (coerced/transformed) value
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
