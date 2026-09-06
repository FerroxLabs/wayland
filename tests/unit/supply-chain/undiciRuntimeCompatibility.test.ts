/**
 * Installed npm-runtime regression for Undici 7.29.1.
 *
 * Uses only loopback origins, an explicit private dispatcher/cache and fake
 * payloads. Node/Electron's built-in global fetch is deliberately not tested as
 * evidence for the npm dependency upgrade.
 */
import { existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { createRequire } from 'node:module';
import { connect } from 'node:net';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { Agent, ProxyAgent, cacheStores, fetch as undiciFetch, interceptors } from 'undici';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();

function address(server: Server): AddressInfo {
  const value = server.address();
  if (!value || typeof value === 'string') throw new Error('loopback server has no TCP address');
  return value;
}

async function listen(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
}

async function close(server: Server): Promise<void> {
  server.closeAllConnections?.();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

describe('installed npm Undici runtime', () => {
  it('resolves every runtime consumer to one exact 7.29.1 copy', () => {
    const consumers = [
      repositoryRoot,
      path.join(repositoryRoot, 'node_modules/@office-ai/aioncli-core'),
      path.join(repositoryRoot, 'node_modules/discord.js'),
      path.join(repositoryRoot, 'node_modules/@discordjs/rest'),
      path.join(repositoryRoot, 'node_modules/@discordjs/ws'),
      path.join(repositoryRoot, 'node_modules/@electron/get'),
      path.join(repositoryRoot, 'node_modules/jsdom'),
    ];
    const resolved = consumers.map((root) => {
      const requireFromConsumer = createRequire(path.join(root, 'package.json'));
      const packagePath = requireFromConsumer.resolve('undici/package.json');
      const metadata = requireFromConsumer(packagePath) as { version?: string };
      return { root, packagePath, version: metadata.version };
    });

    expect(new Set(resolved.map(({ packagePath }) => packagePath)).size).toBe(1);
    expect(resolved.every(({ version }) => version === '7.29.1')).toBe(true);
    expect(existsSync(path.join(repositoryRoot, 'src/process/channels/whatsapp-bridge/node_modules/undici'))).toBe(
      false
    );
  });

  it('does not share malformed or mixed private responses and positively caches public responses', async () => {
    const hits = new Map<string, number>();
    const origin = createServer((request, response) => {
      const url = request.url ?? '/';
      const hit = (hits.get(url) ?? 0) + 1;
      hits.set(url, hit);
      const cacheControl =
        url === '/private-empty'
          ? 'public, max-age=300, private=""'
          : url === '/private-comma'
            ? 'public, max-age=300, private=",,"'
            : url === '/mixed-private'
              ? 'public, max-age=60, private, private="x-private"'
              : 'public, max-age=300';
      response.setHeader('cache-control', cacheControl);
      response.end(`${url}:${hit}`);
    });
    await listen(origin);
    const dispatcher = new Agent().compose(
      interceptors.cache({ store: new cacheStores.MemoryCacheStore({ maxCount: 20, maxSize: 1024 * 1024 }) })
    );
    const base = `http://127.0.0.1:${address(origin).port}`;

    try {
      for (const url of ['/private-empty', '/private-comma', '/mixed-private']) {
        const first = await undiciFetch(`${base}${url}`, { dispatcher });
        const firstBody = await first.text();
        const second = await undiciFetch(`${base}${url}`, { dispatcher });
        expect(firstBody).toBe(`${url}:1`);
        expect(await second.text()).toBe(`${url}:2`);
        expect(hits.get(url)).toBe(2);
      }

      const firstPublic = await undiciFetch(`${base}/public`, { dispatcher });
      const firstPublicBody = await firstPublic.text();
      const secondPublic = await undiciFetch(`${base}/public`, { dispatcher });
      expect(firstPublicBody).toBe('/public:1');
      expect(await secondPublic.text()).toBe('/public:1');
      expect(hits.get('/public')).toBe(1);
    } finally {
      await dispatcher.close();
      await close(origin);
    }
  });

  it('preserves explicit JSON, binary, streaming, status and abort behavior', async () => {
    const origin = createServer((request, response) => {
      if (request.url === '/json') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ ok: true }));
        return;
      }
      if (request.url === '/binary') {
        response.end(Buffer.from([0, 1, 2, 255]));
        return;
      }
      if (request.url === '/stream') {
        response.write('first');
        setTimeout(() => response.end('-second'), 20).unref();
        return;
      }
      if (request.url === '/status') {
        response.statusCode = 503;
        response.end('unavailable');
        return;
      }
      if (request.url === '/abort') return;
      response.statusCode = 404;
      response.end();
    });
    await listen(origin);
    const dispatcher = new Agent();
    const base = `http://127.0.0.1:${address(origin).port}`;

    try {
      const json = await undiciFetch(`${base}/json`, { dispatcher });
      expect(await json.json()).toEqual({ ok: true });

      const binary = await undiciFetch(`${base}/binary`, { dispatcher });
      expect(Buffer.from(await binary.arrayBuffer())).toEqual(Buffer.from([0, 1, 2, 255]));

      const streamed = await undiciFetch(`${base}/stream`, { dispatcher });
      expect(await streamed.text()).toBe('first-second');

      const status = await undiciFetch(`${base}/status`, { dispatcher });
      expect(status.status).toBe(503);
      expect(await status.text()).toBe('unavailable');

      const controller = new AbortController();
      const pending = undiciFetch(`${base}/abort`, { dispatcher, signal: controller.signal });
      setTimeout(() => controller.abort(), 20).unref();
      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    } finally {
      await dispatcher.close();
      await close(origin);
    }
  });

  it('routes only the explicitly proxied request through a local ProxyAgent', async () => {
    let directHits = 0;
    let proxyConnects = 0;
    const origin = createServer((_request, response) => {
      directHits += 1;
      response.end(`origin:${directHits}`);
    });
    const proxy = createServer();
    proxy.on('connect', (request, clientSocket, head) => {
      proxyConnects += 1;
      const [host, rawPort] = (request.url ?? '').split(':');
      const upstream = connect(Number(rawPort), host, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length) upstream.write(head);
        upstream.pipe(clientSocket);
        clientSocket.pipe(upstream);
      });
      upstream.on('error', () => clientSocket.destroy());
    });
    await Promise.all([listen(origin), listen(proxy)]);
    const directAgent = new Agent();
    const proxyAgent = new ProxyAgent(`http://127.0.0.1:${address(proxy).port}`);
    const url = `http://127.0.0.1:${address(origin).port}/proxy-check`;

    try {
      const direct = await undiciFetch(url, { dispatcher: directAgent });
      expect(await direct.text()).toBe('origin:1');
      expect(proxyConnects).toBe(0);

      const proxied = await undiciFetch(url, { dispatcher: proxyAgent });
      expect(await proxied.text()).toBe('origin:2');
      expect(proxyConnects).toBe(1);
    } finally {
      await Promise.all([directAgent.close(), proxyAgent.close()]);
      await Promise.all([close(origin), close(proxy)]);
    }
  });
});
