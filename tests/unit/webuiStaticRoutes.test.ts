import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerPlatformServices } from '@/common/platform';
import { NodePlatformServices } from '@/common/platform/NodePlatformServices';

const tempDirs: string[] = [];

function createPackagedRendererRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-static-routes-'));
  const rendererDir = path.join(root, 'out', 'renderer');
  fs.mkdirSync(rendererDir, { recursive: true });
  fs.writeFileSync(path.join(rendererDir, 'index.html'), '<!doctype html><html><body>ok</body></html>', 'utf8');
  tempDirs.push(root);
  return root;
}

function getRegisteredGetRoutePaths(app: express.Express): Array<string | RegExp> {
  return app.router.stack
    .filter(
      (layer: { route?: { path: string | RegExp; methods?: Record<string, boolean> } }) => layer.route?.methods?.get
    )
    .map((layer: { route?: { path: string | RegExp } }) => layer.route?.path)
    .filter((value): value is string | RegExp => value !== undefined);
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  // Restore the default node platform services registered by vitest.setup.ts so
  // the per-test stub below does not leak into other tests in this file.
  registerPlatformServices(new NodePlatformServices());

  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('registerStaticRoutes', () => {
  it('does not register a dedicated /favicon.ico route in production static mode', async () => {
    const packagedRoot = createPackagedRendererRoot();

    // staticRoutes resolves the renderer build via
    // getPlatformServices().paths.getAppPath() and only registers the production
    // routes (incl. /sw.js) when <appPath>/out/renderer/index.html exists. Mock
    // the platform module rather than registering a stubbed services singleton:
    // the dynamically-imported staticRoutes can bind a different @/common/platform
    // module instance than this test's static import (vitest module reset/ordering
    // across a shard), in which case registerPlatformServices() is invisible to it
    // and it falls back to the real on-disk out/renderer — present on a built dev
    // box, ABSENT in an isolated CI shard, so the route set silently flips to
    // dev-proxy mode and /sw.js disappears (the #292 shard-4/4 flake). Mocking the
    // module pins getAppPath at our packaged root regardless of build artifacts or
    // which instance is loaded.
    vi.doMock('@/common/platform', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/common/platform')>();
      return {
        ...actual,
        getPlatformServices: () =>
          ({ paths: { getAppPath: () => packagedRoot } }) as ReturnType<typeof actual.getPlatformServices>,
      };
    });

    vi.doMock('@process/webserver/auth/middleware/TokenMiddleware', () => ({
      TokenMiddleware: {
        extractToken: () => null,
        isTokenValid: () => true,
      },
    }));
    vi.doMock('@process/webserver/middleware/security', () => ({
      createRateLimiter: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));

    const { registerStaticRoutes } = await import('@process/webserver/routes/staticRoutes');
    const app = express();

    registerStaticRoutes(app);

    expect(getRegisteredGetRoutePaths(app)).not.toContain('/favicon.ico');

    // A dedicated /sw.js route must exist (ahead of the generic static mount)
    // so the service worker opts out of HTTP caching and a wedged client can
    // pick up a corrected sw.js on the next load (#47).
    expect(getRegisteredGetRoutePaths(app)).toContain('/sw.js');
  });
});
