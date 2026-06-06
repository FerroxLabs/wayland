/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ErrorRequestHandler, Response } from 'express';

/**
 * Application Error Class - Custom error class with status code and error code
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'internal_error') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Error Command Interface - Define how error responses are executed
 */
interface ErrorCommand {
  execute(res: Response): void;
}

/**
 * JSON Error Command - Return error response in JSON format
 */
class JsonErrorCommand implements ErrorCommand {
  constructor(
    private readonly statusCode: number,
    private readonly payload: Record<string, unknown>
  ) {}

  execute(res: Response): void {
    res.status(this.statusCode).json({ success: false, ...this.payload });
  }
}

/**
 * Classify uncaught errors into a (status, code) pair so handlers like
 * tiny-csrf (which throw plain Errors) don't cascade into a misleading 500.
 *
 * Detected:
 *   - tiny-csrf rejection      → 403 csrf_invalid
 *   - multer file-size error   → 413 payload_too_large
 *   - multer other errors      → 400 bad_request
 *   - jwt verification errors  → 401 unauthorized
 *
 * Everything else → 500 internal_error (preserves existing behavior).
 *
 * Caught by adversarial Phase 2-H red-team probes (REGRESSION on /api/upload
 * and /api/auth/refresh returned 500 instead of 401/403).
 */
function classifyError(err: unknown): { statusCode: number; code: string; message: string } | null {
  if (!err || typeof err !== 'object') return null;
  const name = (err as { name?: unknown }).name;
  const msg = (err as { message?: unknown }).message;
  const message = typeof msg === 'string' ? msg : '';

  if (message.startsWith('Did not get a valid CSRF token') || name === 'CsrfError') {
    return { statusCode: 403, code: 'csrf_invalid', message: 'Invalid or missing CSRF token' };
  }
  if (name === 'MulterError') {
    const mcode = (err as { code?: unknown }).code;
    if (mcode === 'LIMIT_FILE_SIZE') {
      return { statusCode: 413, code: 'payload_too_large', message: 'File exceeds maximum size' };
    }
    return { statusCode: 400, code: 'upload_error', message: 'Invalid upload' };
  }
  if (name === 'TokenExpiredError' || name === 'JsonWebTokenError' || name === 'NotBeforeError') {
    return { statusCode: 401, code: 'unauthorized', message: 'Invalid or expired token' };
  }
  return null;
}

/**
 * Global error handling middleware
 *
 * Handles all uncaught errors and returns formatted error responses
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    new JsonErrorCommand(err.statusCode, { error: err.message, code: err.code }).execute(res);
    return;
  }

  const classified = classifyError(err);
  if (classified) {
    new JsonErrorCommand(classified.statusCode, { error: classified.message, code: classified.code }).execute(res);
    return;
  }

  // Unexpected - log + 500.
  console.error('[Error]', err);
  new JsonErrorCommand(500, { error: 'Internal server error', code: 'internal_error' }).execute(res);
};

/**
 * Create application error
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param code - Error code
 * @returns AppError instance
 */
export const createAppError = (message: string, statusCode = 400, code = 'bad_request'): AppError => {
  return new AppError(message, statusCode, code);
};
