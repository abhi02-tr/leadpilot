import { ZodError } from 'zod';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNPROCESSABLE'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Array<{ field: string; message: string }>;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    options?: {
      details?: Array<{ field: string; message: string }>;
      isOperational?: boolean;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options?.cause });
    this.code = code;
    this.statusCode = statusCode;
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static fromZod(error: ZodError): AppError {
    const details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return new AppError('VALIDATION_ERROR', 'The request contains invalid fields.', 400, { details });
  }

  static badRequest(message: string): AppError {
    return new AppError('VALIDATION_ERROR', message, 400);
  }

  static payloadTooLarge(message: string): AppError {
    return new AppError('PAYLOAD_TOO_LARGE', message, 413);
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError('NOT_FOUND', `${resource} not found.`, 404);
  }

  static forbidden(message = 'You do not have permission to perform this action.'): AppError {
    return new AppError('FORBIDDEN', message, 403);
  }

  static conflict(message: string): AppError {
    return new AppError('CONFLICT', message, 409);
  }

  static unauthorized(): AppError {
    return new AppError('AUTHENTICATION_REQUIRED', 'Authentication is required.', 401);
  }

  static serviceUnavailable(message: string): AppError {
    return new AppError('SERVICE_UNAVAILABLE', message, 503);
  }

  static unprocessable(message: string): AppError {
    return new AppError('UNPROCESSABLE', message, 422);
  }
}
