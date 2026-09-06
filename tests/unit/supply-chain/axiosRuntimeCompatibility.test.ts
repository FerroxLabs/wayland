/**
 * Installed-package regression for GHSA-gcfj-64vw-6mp9.
 *
 * Both dependency roots ship at runtime. These tests execute each installed
 * Axios copy through the Node HTTP adapter against loopback servers only, with
 * fake credentials and complete prototype/environment cleanup.
 */
import { createHash } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { AxiosStatic, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const proxyEnvKeys = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'http_proxy',
  'https_proxy',
  'all_proxy',
  'NO_PROXY',
  'no_proxy',
] as const;

type Hit = { url: string; method: string; authorization: string | null; body: string };
type AxiosModule = AxiosStatic & { default?: AxiosStatic };

function loadAxios(packageRoot: string): { axios: AxiosStatic; packagePath: string; digest: string } {
  const requireFromRoot = createRequire(path.join(packageRoot, 'package.json'));
  const loaded = requireFromRoot('axios') as AxiosModule;
  const axios = loaded.default ?? loaded;
  const packagePath = requireFromRoot.resolve('axios/package.json');
  const metadata = requireFromRoot(packagePath) as { version?: string };
  if (metadata.version !== '1.20.0') throw new Error(`expected Axios 1.20.0 at ${packagePath}`);
  return {
    axios,
    packagePath,
    digest: createHash('sha256').update(JSON.stringify(metadata)).digest('hex'),
  };
}

const installedCopies = [
  { name: 'root runtime', root: repositoryRoot },
  { name: 'external WhatsApp bridge', root: path.join(repositoryRoot, 'src/process/channels/whatsapp-bridge') },
].map((entry) => ({ ...entry, ...loadAxios(entry.root) }));

function address(server: Server): AddressInfo {
  const value = server.address();
  if (!value || typeof value === 'string') throw new Error('loopback server has no TCP address');
  return value;
}

async function listen(handler: (request: IncomingMessage, response: ServerResponse) => void): Promise<Server> {
  const server = createServer(handler);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  return server;
}

async function close(server: Server): Promise<void> {
  server.closeAllConnections?.();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

async function body(request: IncomingMessage): Promise<string> {
  let value = '';
  for await (const chunk of request) value += String(chunk);
  return value;
}

function isolateProxyEnvironment(): () => void {
  const saved = new Map<string, string | undefined>();
  for (const key of proxyEnvKeys) {
    saved.set(key, process.env[key]);
    delete process.env[key];
  }
  return () => {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

function polluteProxy(port: number): () => void {
  const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'proxy');
  Object.defineProperty(Object.prototype, 'proxy', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: { protocol: 'http', host: '127.0.0.1', port },
  });
  return () => {
    if (previous) Object.defineProperty(Object.prototype, 'proxy', previous);
    else delete (Object.prototype as { proxy?: unknown }).proxy;
  };
}

describe.each(installedCopies)('$name Axios $digest', ({ axios, packagePath }) => {
  it.each(['async', 'sync'] as const)(
    'ignores inherited proxy after a %s interceptor clones request config',
    async (interceptorKind) => {
      const targetHits: Hit[] = [];
      const proxyHits: Hit[] = [];
      const target = await listen(async (request, response) => {
        targetHits.push({
          url: request.url ?? '',
          method: request.method ?? '',
          authorization: request.headers.authorization ?? null,
          body: await body(request),
        });
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ server: 'target' }));
      });
      const proxy = await listen(async (request, response) => {
        proxyHits.push({
          url: request.url ?? '',
          method: request.method ?? '',
          authorization: request.headers.authorization ?? null,
          body: await body(request),
        });
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ server: 'proxy' }));
      });
      const restoreEnv = isolateProxyEnvironment();
      const restorePrototype = polluteProxy(address(proxy).port);

      try {
        const client = axios.create({ adapter: 'http' });
        const clone = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig =>
          ({
            ...config,
            headers: { ...config.headers, 'X-Wayland-Regression': packagePath },
          }) as InternalAxiosRequestConfig;
        client.interceptors.request.use(
          interceptorKind === 'async' ? async (config) => clone(config) : (config) => clone(config),
          undefined,
          interceptorKind === 'sync' ? { synchronous: true } : undefined
        );

        const response = await client.post(
          `http://127.0.0.1:${address(target).port}/api/fake-secret`,
          { secret: 'not-a-real-secret' },
          { headers: { Authorization: 'Bearer fake-axios-regression' }, timeout: 2_000 }
        );

        expect(response.data).toEqual({ server: 'target' });
        expect(targetHits).toHaveLength(1);
        expect(targetHits[0]).toMatchObject({
          url: '/api/fake-secret',
          method: 'POST',
          authorization: 'Bearer fake-axios-regression',
        });
        expect(proxyHits).toEqual([]);
      } finally {
        restorePrototype();
        restoreEnv();
        await Promise.all([close(target), close(proxy)]);
      }
    }
  );

  it('preserves an explicitly configured legitimate HTTP proxy', async () => {
    const targetHits: Hit[] = [];
    const proxyHits: Hit[] = [];
    const target = await listen(async (request, response) => {
      targetHits.push({
        url: request.url ?? '',
        method: request.method ?? '',
        authorization: request.headers.authorization ?? null,
        body: await body(request),
      });
      response.end('target');
    });
    const proxy = await listen(async (request, response) => {
      proxyHits.push({
        url: request.url ?? '',
        method: request.method ?? '',
        authorization: request.headers.authorization ?? null,
        body: await body(request),
      });
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ server: 'proxy' }));
    });
    const restoreEnv = isolateProxyEnvironment();

    try {
      const response = await axios.get(`http://127.0.0.1:${address(target).port}/proxy-control`, {
        adapter: 'http',
        proxy: { protocol: 'http', host: '127.0.0.1', port: address(proxy).port },
        timeout: 2_000,
      });
      expect(response.data).toEqual({ server: 'proxy' });
      expect(targetHits).toEqual([]);
      expect(proxyHits).toHaveLength(1);
      expect(proxyHits[0].url).toContain('/proxy-control');
    } finally {
      restoreEnv();
      await Promise.all([close(target), close(proxy)]);
    }
  });

  it('keeps JSON, binary, HTTP-error and cancellation behavior', async () => {
    const server = await listen((request, response) => {
      if (request.url === '/json') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ ok: true }));
        return;
      }
      if (request.url === '/binary') {
        response.end(Buffer.from([0, 1, 2, 255]));
        return;
      }
      if (request.url === '/error') {
        response.statusCode = 503;
        response.end('unavailable');
        return;
      }
      if (request.url === '/slow') {
        setTimeout(() => response.end('late'), 5_000).unref();
        return;
      }
      response.statusCode = 404;
      response.end();
    });
    const baseUrl = `http://127.0.0.1:${address(server).port}`;

    try {
      const json = await axios.get(`${baseUrl}/json`, { adapter: 'http', proxy: false });
      expect(json.data).toEqual({ ok: true });

      const binary = await axios.get(`${baseUrl}/binary`, {
        adapter: 'http',
        proxy: false,
        responseType: 'arraybuffer',
      });
      expect(Buffer.from(binary.data)).toEqual(Buffer.from([0, 1, 2, 255]));

      await expect(axios.get(`${baseUrl}/error`, { adapter: 'http', proxy: false })).rejects.toMatchObject({
        response: { status: 503 },
      });

      const controller = new AbortController();
      const pending = axios.get(`${baseUrl}/slow`, { adapter: 'http', proxy: false, signal: controller.signal });
      controller.abort();
      await expect(pending).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    } finally {
      await close(server);
    }
  });
});
