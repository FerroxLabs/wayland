import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { IncomingMessage } from 'http';

// Mock AuthService before importing TokenMiddleware
vi.mock('../../src/process/webserver/auth/service/AuthService', () => ({
  AuthService: {
    verifyToken: vi.fn(),
    verifyWebSocketToken: vi.fn(),
  },
}));

vi.mock('../../src/process/webserver/auth/repository/UserRepository', () => ({
  UserRepository: { findById: vi.fn() },
}));

describe('extractWebSocketToken – cookie parsing with special characters', () => {
  let TokenMiddleware: typeof import('../../src/process/webserver/auth/middleware/TokenMiddleware').TokenMiddleware;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../../src/process/webserver/auth/middleware/TokenMiddleware');
    TokenMiddleware = mod.TokenMiddleware;
  });

  function fakeReq(headers: Record<string, string | string[] | undefined>, rawHeaders?: string[]): IncomingMessage {
    return { headers, rawHeaders } as unknown as IncomingMessage;
  }

  function extractExplicit(req: IncomingMessage): string | null {
    const middleware = TokenMiddleware as typeof TokenMiddleware & {
      extractExplicitWebSocketToken?: (request: IncomingMessage) => string | null;
    };
    expect(middleware.extractExplicitWebSocketToken).toBeTypeOf('function');
    return middleware.extractExplicitWebSocketToken?.(req) ?? null;
  }

  it('extracts token from a normal cookie', () => {
    const req = fakeReq({ cookie: 'wayland-session=mytoken123' });
    expect(TokenMiddleware.extractWebSocketToken(req)).toBe('mytoken123');
  });

  it('extracts token when cookie value contains = characters', () => {
    const req = fakeReq({ cookie: 'other=a=b=c; wayland-session=tok=en' });
    expect(TokenMiddleware.extractWebSocketToken(req)).toBe('tok=en');
  });

  it('extracts token when other cookies contain malformed % sequences', () => {
    const req = fakeReq({ cookie: 'bad=test%XY; wayland-session=goodtoken' });
    expect(TokenMiddleware.extractWebSocketToken(req)).toBe('goodtoken');
  });

  it('extracts token when cookie value is a bare % character', () => {
    const req = fakeReq({ cookie: 'noise=%; wayland-session=valid' });
    expect(TokenMiddleware.extractWebSocketToken(req)).toBe('valid');
  });

  it('handles token value that itself contains %', () => {
    const req = fakeReq({ cookie: 'wayland-session=token%25with%25percent' });
    expect(TokenMiddleware.extractWebSocketToken(req)).toBe('token%with%percent');
  });

  it('returns null when cookie header is missing', () => {
    const req = fakeReq({});
    expect(TokenMiddleware.extractWebSocketToken(req)).toBeNull();
  });

  it('returns null when session cookie is absent', () => {
    const req = fakeReq({ cookie: 'other=value; another=123' });
    expect(TokenMiddleware.extractWebSocketToken(req)).toBeNull();
  });

  it('prefers Authorization header over cookie', () => {
    const req = fakeReq({
      authorization: 'Bearer headertoken',
      cookie: 'wayland-session=cookietoken',
    });
    expect(TokenMiddleware.extractWebSocketToken(req)).toBe('headertoken');
  });

  it('extracts an exact non-empty bearer credential without rewriting it', () => {
    const req = fakeReq({ authorization: 'Bearer abc.def==' });

    expect(extractExplicit(req)).toBe('abc.def==');
  });

  it('extracts one exact token subprotocol credential', () => {
    const req = fakeReq({ 'sec-websocket-protocol': 'paired-device-token' });

    expect(extractExplicit(req)).toBe('paired-device-token');
  });

  it.each([
    ['empty bearer', { authorization: 'Bearer ' }, undefined],
    ['whitespace-only bearer', { authorization: 'Bearer   ' }, undefined],
    ['trailing bearer whitespace', { authorization: 'Bearer token ' }, undefined],
    ['comma-ambiguous bearer', { authorization: 'Bearer first, Bearer second' }, undefined],
    ['array authorization', { authorization: ['Bearer token'] }, undefined],
    [
      'repeated raw authorization',
      { authorization: 'Bearer first' },
      ['Authorization', 'Bearer first', 'Authorization', 'Bearer second'],
    ],
  ])('rejects %s', (_label, headers, rawHeaders) => {
    expect(extractExplicit(fakeReq(headers, rawHeaders))).toBeNull();
  });

  it.each([
    ['empty subprotocol', ''],
    ['mixed token list', 'first-token, second-token'],
    ['leading empty item', ', token'],
    ['trailing empty item', 'token,'],
    ['Vite HMR marker', 'vite-hmr'],
    ['Vite ping marker', 'vite-ping'],
  ])('rejects %s', (_label, protocol) => {
    expect(extractExplicit(fakeReq({ 'sec-websocket-protocol': protocol }))).toBeNull();
  });

  it('rejects an array subprotocol header', () => {
    expect(extractExplicit(fakeReq({ 'sec-websocket-protocol': ['paired-device-token'] }))).toBeNull();
  });

  it('does not fall through a malformed Authorization header to a subprotocol token', () => {
    const req = fakeReq({
      authorization: 'Bearer first, Bearer second',
      'sec-websocket-protocol': 'paired-device-token',
    });

    expect(extractExplicit(req)).toBeNull();
  });

  it('ignores the session cookie while the generic extractor keeps browser-cookie support', () => {
    const req = fakeReq({ cookie: 'wayland-session=cookie-token' });

    expect(extractExplicit(req)).toBeNull();
    expect(TokenMiddleware.extractWebSocketToken(req)).toBe('cookie-token');
  });
});
