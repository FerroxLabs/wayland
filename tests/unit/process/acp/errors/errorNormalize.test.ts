// tests/unit/process/acp/errors/errorNormalize.test.ts

import { describe, it, expect } from 'vitest';
import { normalizeError } from '@process/acp/errors/errorNormalize';
import { AcpError } from '@process/acp/errors/AcpError';

describe('normalizeError', () => {
  it('passes through AcpError unchanged', () => {
    const err = new AcpError('QUEUE_FULL', 'full');
    expect(normalizeError(err)).toBe(err);
  });

  it('normalizes connection refused to CONNECTION_FAILED (retryable)', () => {
    const err = new Error('connect ECONNREFUSED');
    (err as NodeJS.ErrnoException).code = 'ECONNREFUSED';
    const result = normalizeError(err);
    expect(result.code).toBe('CONNECTION_FAILED');
    expect(result.retryable).toBe(true);
  });

  it('normalizes ACP -32001 to ACP_SESSION_NOT_FOUND', () => {
    const err = { code: -32001, message: 'Session not found' };
    const result = normalizeError(err);
    expect(result.code).toBe('ACP_SESSION_NOT_FOUND');
    expect(result.retryable).toBe(false);
  });

  it('normalizes ACP -32603 to AGENT_INTERNAL_ERROR (retryable)', () => {
    const err = { code: -32603, message: 'Internal error' };
    const result = normalizeError(err);
    expect(result.code).toBe('AGENT_INTERNAL_ERROR');
    expect(result.retryable).toBe(true);
  });

  it('normalizes auth_required to AUTH_REQUIRED (retryable)', () => {
    const err = { code: -32000, message: 'auth_required' };
    const result = normalizeError(err);
    expect(result.code).toBe('AUTH_REQUIRED');
    expect(result.retryable).toBe(true);
  });

  it('normalizes unknown error to INTERNAL_ERROR', () => {
    const result = normalizeError('random string');
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.retryable).toBe(false);
  });

  it('folds string `data` detail into a bare "Internal error" message (#69)', () => {
    const err = { code: -32603, message: 'Internal error', data: 'Model metadata not found for gpt-9' };
    const result = normalizeError(err);
    expect(result.code).toBe('AGENT_INTERNAL_ERROR');
    expect(result.message).toContain('Internal error');
    expect(result.message).toContain('Model metadata not found for gpt-9');
  });

  it('folds object `data` detail as JSON when present', () => {
    const err = { code: -32603, message: 'Internal error', data: { reason: 'corrupted_index' } };
    const result = normalizeError(err);
    expect(result.message).toContain('corrupted_index');
  });

  it('leaves the message unchanged when there is no extra detail', () => {
    const err = { code: -32603, message: 'Internal error' };
    const result = normalizeError(err);
    expect(result.message).toBe('Internal error');
  });

  it('does not duplicate detail already present in the message', () => {
    const err = { code: -32602, message: 'Invalid params: bad model', data: 'bad model' };
    const result = normalizeError(err);
    expect(result.message).toBe('Invalid params: bad model');
  });
});
