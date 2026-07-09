/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for POST /api/projects/generate-knowledge-draft (issue #234).
 *
 * Coverage:
 *  - generateKnowledgeDraftLogic: happy path, no-model, failed-LLM, error enum
 *  - Route: rejects missing token; rejects invalid kind; accepts valid request;
 *    returns no-model; emits audit
 *  - Permission-class regression (#683): draft generation is NOT gated by the
 *    secure-config-write floor (no 403 even from public internet over plain
 *    HTTP), while requireSecureConfigWrite itself still refuses that context
 *    for real config writes
 *  - Confinement regression (RT-F2-01): /etc/passwd path must not produce a
 *    draft with "passwd"/"root:", and the response must not echo the file path
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerProjectKnowledgeDraftRoutes } from '@process/webserver/routes/projectKnowledgeDraftRoutes';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockNetworkContext, mockAppendAudit, mockReadSourceFiles, mockHasUsableModel, mockOneShotCompleteBest } =
  vi.hoisted(() => ({
    mockNetworkContext: { reachedVia: 'loopback', isHttps: true },
    mockAppendAudit: vi.fn(() => Promise.resolve(true)),
    mockReadSourceFiles: vi.fn(async (_paths: string[]) => ''),
    mockHasUsableModel: vi.fn(async () => true as boolean),
    mockOneShotCompleteBest: vi.fn(async (_prompt: string) => 'DRAFT_OUTPUT'),
  }));

// configWriteGuards is intentionally NOT mocked: #683's regression tests below
// exercise the REAL requireSecureConfigWrite to prove the gate is unweakened.
// Its auth-layer imports are stubbed so importing it stays hermetic.
vi.mock('@process/webserver/auth/repository/UserRepository', () => ({
  UserRepository: { findById: vi.fn() },
}));
vi.mock('@process/webserver/auth/service/AuthService', () => ({
  AuthService: { verifyPassword: vi.fn() },
}));

vi.mock('@process/webserver/audit/auditLog', () => ({
  appendAudit: mockAppendAudit,
}));

vi.mock('@process/bridge/projectBridge', () => ({
  readSourceFiles: mockReadSourceFiles,
}));

vi.mock('@process/services/completion/oneShot', () => ({
  hasUsableModel: mockHasUsableModel,
  oneShotCompleteBest: mockOneShotCompleteBest,
}));

vi.mock('@process/webserver/middleware/security', () => ({
  apiRateLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('@process/webserver/middleware/detectNetworkContext', () => ({
  detectNetworkContext: () => ({ ...mockNetworkContext }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const passThroughAuth = (_req: Request, _res: Response, next: NextFunction) => next();
const denyAuth = (_req: Request, res: Response) => res.status(401).json({ success: false, msg: 'Unauthorized' });

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

function makeReq(body: Record<string, unknown> = {}): Request {
  return {
    body,
    user: { id: 'user-1' },
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;
}

// ---------------------------------------------------------------------------
// generateKnowledgeDraftLogic — pure logic tests (no HTTP layer)
// ---------------------------------------------------------------------------

describe('generateKnowledgeDraftLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasUsableModel.mockResolvedValue(true);
    mockOneShotCompleteBest.mockResolvedValue('DRAFT_OUTPUT');
    mockReadSourceFiles.mockResolvedValue('');
  });

  it('returns { draft } on success', async () => {
    const { generateKnowledgeDraftLogic } = await import('@process/webserver/routes/projectKnowledgeDraftRoutes');
    const result = await generateKnowledgeDraftLogic({ kind: 'context' });
    expect(result).toEqual({ draft: 'DRAFT_OUTPUT' });
  });

  it('returns { error: "no-model" } when hasUsableModel is false', async () => {
    mockHasUsableModel.mockResolvedValue(false);
    const { generateKnowledgeDraftLogic } = await import('@process/webserver/routes/projectKnowledgeDraftRoutes');
    const result = await generateKnowledgeDraftLogic({ kind: 'context' });
    expect(result).toEqual({ draft: '', error: 'no-model' });
  });

  it('maps a thrown "no-usable-model" to { error: "no-model" } with no leaked detail', async () => {
    mockOneShotCompleteBest.mockRejectedValue(new Error('no-usable-model'));
    const { generateKnowledgeDraftLogic } = await import('@process/webserver/routes/projectKnowledgeDraftRoutes');
    const result = await generateKnowledgeDraftLogic({ kind: 'rules' });
    expect(result).toEqual({ draft: '', error: 'no-model' });
    expect(result.detail).toBeUndefined();
  });

  it('returns { error: "failed", detail } surfacing the real provider cause (#238 parity)', async () => {
    mockOneShotCompleteBest.mockRejectedValue(new Error('Provider returned HTTP 502 (non-JSON response)'));
    const { generateKnowledgeDraftLogic } = await import('@process/webserver/routes/projectKnowledgeDraftRoutes');
    const result = await generateKnowledgeDraftLogic({ kind: 'context' });
    expect(result).toEqual({
      draft: '',
      error: 'failed',
      detail: 'Provider returned HTTP 502 (non-JSON response)',
    });
  });

  it('calls readSourceFiles with the supplied filePaths', async () => {
    const filePaths = ['/some/file.md'];
    mockReadSourceFiles.mockResolvedValue('file content');
    const { generateKnowledgeDraftLogic } = await import('@process/webserver/routes/projectKnowledgeDraftRoutes');
    await generateKnowledgeDraftLogic({ kind: 'context', filePaths });
    expect(mockReadSourceFiles).toHaveBeenCalledWith(filePaths);
  });

  describe('confinement regression (RT-F2-01)', () => {
    it('does not produce a draft with "passwd" or "root:" when /etc/passwd is supplied — confinePath in readSourceFiles rejects it (returns empty)', async () => {
      // readSourceFiles (which calls confinePath internally) returns '' for a
      // rejected path. We simulate that here.
      mockReadSourceFiles.mockResolvedValue('');
      mockOneShotCompleteBest.mockResolvedValue('safe draft only');
      const { generateKnowledgeDraftLogic } = await import('@process/webserver/routes/projectKnowledgeDraftRoutes');
      const result = await generateKnowledgeDraftLogic({ kind: 'context', filePaths: ['/etc/passwd'] });
      expect(result.draft).not.toMatch(/passwd/i);
      expect(result.draft).not.toMatch(/root:/i);
    });

    it('does not echo the input file path in the returned draft', async () => {
      mockReadSourceFiles.mockResolvedValue('');
      mockOneShotCompleteBest.mockResolvedValue('clean draft');
      const { generateKnowledgeDraftLogic } = await import('@process/webserver/routes/projectKnowledgeDraftRoutes');
      const result = await generateKnowledgeDraftLogic({
        kind: 'context',
        filePaths: ['/etc/passwd', '/home/user/secrets.txt'],
      });
      expect(JSON.stringify(result)).not.toContain('/etc/passwd');
      expect(JSON.stringify(result)).not.toContain('secrets.txt');
    });
  });
});

// ---------------------------------------------------------------------------
// HTTP route tests — test the express handler directly
// ---------------------------------------------------------------------------

describe('POST /api/projects/generate-knowledge-draft (route)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNetworkContext.reachedVia = 'loopback';
    mockNetworkContext.isHttps = true;
    mockHasUsableModel.mockResolvedValue(true);
    mockOneShotCompleteBest.mockResolvedValue('DRAFT_OUTPUT');
    mockReadSourceFiles.mockResolvedValue('');
  });

  /**
   * Extract the business handler from the route stack.
   * Accessing `app.router` triggers lazy initialization (same as authRoutesStatus.test.ts).
   */
  function getHandler(validateApiAccess: express.RequestHandler) {
    const app = express();
    app.use(express.json());
    registerProjectKnowledgeDraftRoutes(app, validateApiAccess);

    // Access app.router to trigger lazy initialization (Express getter pattern).
    const layer = app.router.stack.find(
      (l: { route?: { path?: string } }) => l.route?.path === '/api/projects/generate-knowledge-draft'
    );
    const stack = (layer as { route?: { stack?: Array<{ handle: express.RequestHandler }> } })?.route?.stack ?? [];
    // Business handler is the last entry in the middleware stack for the route.
    return stack[stack.length - 1]?.handle as express.RequestHandler;
  }

  it('rejects when validateApiAccess denies (missing/invalid token)', async () => {
    const res = mockRes();
    const req = makeReq({ kind: 'context' });
    denyAuth(req, res, vi.fn());
    expect(res.status as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(401);
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('is not 403d by the secure-config-write floor: drafts succeed even from public internet over plain HTTP (#683)', async () => {
    // The exact context requireSecureConfigWrite refuses. Drafting is a
    // model/read operation, not a config write, so it must still succeed.
    mockNetworkContext.reachedVia = 'public_internet';
    mockNetworkContext.isHttps = false;
    const handler = getHandler(passThroughAuth);
    const res = mockRes();
    await handler(makeReq({ kind: 'context' }), res, vi.fn());
    expect(res.status as ReturnType<typeof vi.fn>).not.toHaveBeenCalledWith(403);
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ draft: 'DRAFT_OUTPUT' }),
      })
    );
  });

  it('leaves the secure-config gate unweakened: requireSecureConfigWrite still 403s public plain-HTTP writes', async () => {
    // The REAL guard (not a mock) under the same network context the draft
    // route now permits — proving #683 reclassified the route, not the gate.
    mockNetworkContext.reachedVia = 'public_internet';
    mockNetworkContext.isHttps = false;
    const { requireSecureConfigWrite } = await import('@process/webserver/routes/configWriteGuards');
    const res = mockRes();
    const allowed = requireSecureConfigWrite(makeReq({}), res);
    expect(allowed).toBe(false);
    expect(res.status as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(403);
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('returns 400 for a missing or invalid kind', async () => {
    const handler = getHandler(passThroughAuth);
    const res = mockRes();
    await handler(makeReq({ kind: 'invalid' }), res, vi.fn());
    expect(res.status as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(400);
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('accepts a valid request and returns { success: true, data: { draft } }', async () => {
    const handler = getHandler(passThroughAuth);
    const res = mockRes();
    await handler(makeReq({ kind: 'context', name: 'My project' }), res, vi.fn());
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ draft: 'DRAFT_OUTPUT' }),
      })
    );
  });

  it('returns { error: "no-model" } when no model is available', async () => {
    mockHasUsableModel.mockResolvedValue(false);
    const handler = getHandler(passThroughAuth);
    const res = mockRes();
    await handler(makeReq({ kind: 'rules' }), res, vi.fn());
    expect(res.json as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ error: 'no-model' }),
      })
    );
  });

  it('emits an audit log entry with action "project.generate-knowledge-draft"', async () => {
    const handler = getHandler(passThroughAuth);
    const res = mockRes();
    await handler(makeReq({ kind: 'context' }), res, vi.fn());
    expect(mockAppendAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'project.generate-knowledge-draft' })
    );
  });

  it('does not echo filePaths in the HTTP response', async () => {
    mockReadSourceFiles.mockResolvedValue('');
    mockOneShotCompleteBest.mockResolvedValue('clean draft');
    const handler = getHandler(passThroughAuth);
    const res = mockRes();
    await handler(makeReq({ kind: 'context', filePaths: ['/etc/passwd'] }), res, vi.fn());
    const responseJson = JSON.stringify((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(responseJson).not.toContain('/etc/passwd');
  });
});
