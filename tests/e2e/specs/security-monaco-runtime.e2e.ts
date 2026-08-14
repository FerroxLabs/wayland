/**
 * Runtime proof for the Monaco removal.
 *
 * The static dependency and renderer-artifact checks live in unit/build gates.
 * This journey covers the missing runtime seam: the real Desktop bridge opens
 * an HTML preview, the source view mounts CodeMirror, and the renderer does not
 * initiate a Monaco request, worker, script, or stylesheet load.
 */
import { expect, test, type ElectronApplication, type Page, type Request, type Worker } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchAppWithEnv, seedCompletedOnboarding } from '../fixtures';
import { invokeBridge } from '../helpers';

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-monaco-runtime-userdata-'));
const extensionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-monaco-runtime-extensions-'));
const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-monaco-runtime-state-'));
const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-monaco-runtime-home-'));
fs.mkdirSync(path.join(homeDir, '.wayland'));

function isAuxiliaryWindow(candidate: Page): boolean {
  const url = candidate.url().toLowerCase();
  return (
    url.startsWith('devtools://') ||
    url.includes('/ambient/') ||
    url.includes('/pet/') ||
    url.includes('ambient.html') ||
    url.includes('pet.html') ||
    url.includes('pet-hit.html') ||
    url.includes('pet-confirm.html')
  );
}

async function waitForMainWindow(electronApp: ElectronApplication, deadline: number): Promise<Page> {
  const remainingMs = deadline - Date.now();
  if (remainingMs <= 0) throw new Error('Monaco runtime E2E could not resolve the main Desktop window.');

  const candidate = await electronApp
    .waitForEvent('window', { timeout: Math.min(1_000, remainingMs) })
    .catch(() => null);
  if (candidate && !isAuxiliaryWindow(candidate)) return candidate;

  const existing = electronApp.windows().find((window) => !isAuxiliaryWindow(window));
  if (existing) return existing;

  return waitForMainWindow(electronApp, deadline);
}

async function resolveMainWindow(electronApp: ElectronApplication): Promise<Page> {
  const existing = electronApp.windows().find((candidate) => !isAuxiliaryWindow(candidate));
  if (existing) return existing;

  return waitForMainWindow(electronApp, Date.now() + 30_000);
}

test.describe.serial('HTML editor runtime dependency boundary', () => {
  let electronApp: ElectronApplication;
  let page: Page;
  let rendererUrl: string;
  let baselineScriptUrls: string[];
  let baselineStylesheetUrls: string[];
  const runtimeRequests: Array<{ url: string; resourceType: string }> = [];
  const workerUrls: string[] = [];
  const recordRequest = (request: Request): void => {
    runtimeRequests.push({ url: request.url(), resourceType: request.resourceType() });
  };
  const recordWorker = (worker: Worker): void => {
    workerUrls.push(worker.url());
  };

  test.beforeAll(async () => {
    test.setTimeout(120_000);
    seedCompletedOnboarding(userDataDir);
    electronApp = await launchAppWithEnv({
      HOME: homeDir,
      USERPROFILE: homeDir,
      APPDATA: path.join(homeDir, 'AppData', 'Roaming'),
      LOCALAPPDATA: path.join(homeDir, 'AppData', 'Local'),
      XDG_CONFIG_HOME: path.join(homeDir, '.config'),
      XDG_CACHE_HOME: path.join(homeDir, '.cache'),
      XDG_DATA_HOME: path.join(homeDir, '.local', 'share'),
      XDG_STATE_HOME: path.join(homeDir, '.local', 'state'),
      WAYLAND_E2E_USER_DATA_DIR: userDataDir,
      WAYLAND_EXTENSIONS_PATH: extensionsDir,
      WAYLAND_EXTENSION_STATES_FILE: path.join(stateDir, 'extension-states.json'),
    });

    page = await resolveMainWindow(electronApp);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof (window as { electronAPI?: unknown }).electronAPI !== 'undefined');
    rendererUrl = page.url();
    ({ scriptUrls: baselineScriptUrls, stylesheetUrls: baselineStylesheetUrls } = await page.evaluate(() => ({
      scriptUrls: Array.from(document.scripts, (script) => script.src).filter(Boolean),
      stylesheetUrls: Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
        (link) => link.href
      ).filter(Boolean),
    })));
    page.on('request', recordRequest);
    page.on('worker', recordWorker);

    const now = Date.now();
    const conversation = await invokeBridge<{ id: string }>(
      page,
      'create-conversation-with-conversation',
      {
        conversation: {
          id: `e2e-monaco-runtime-${now}`,
          createTime: now,
          modifyTime: now,
          name: 'E2E Monaco Runtime',
          type: 'wcore',
          source: 'wayland',
          extra: {
            workspace: homeDir,
            customWorkspace: true,
          },
          model: {
            id: 'e2e-monaco-runtime',
            platform: 'openai',
            name: 'E2E Monaco Runtime',
            baseUrl: 'https://api.example.com',
            apiKey: 'sk-e2e',
            useModel: 'gpt-4o-mini',
          },
        },
      },
      20_000
    );
    if (!conversation?.id) throw new Error('Monaco runtime E2E could not create its isolated conversation.');

    await page.evaluate((conversationId) => {
      window.location.hash = `#/conversation/${conversationId}`;
    }, conversation.id);
    await page.waitForURL(/#\/conversation\//, { timeout: 15_000 });
    rendererUrl = page.url();
    await expect(page.getByRole('button', { name: 'E2E Monaco Runtime Pop Out' })).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
    );
  });

  test.afterAll(async () => {
    page?.off('request', recordRequest);
    page?.off('worker', recordWorker);
    const childProcess = electronApp?.process();
    let closeError: unknown;
    try {
      await electronApp?.close();
      if (childProcess && childProcess.exitCode === null && childProcess.signalCode === null) {
        throw new Error('Desktop process survived Playwright shutdown.');
      }
    } catch (error) {
      closeError = error;
    } finally {
      fs.rmSync(userDataDir, { recursive: true, force: true });
      fs.rmSync(extensionsDir, { recursive: true, force: true });
      fs.rmSync(stateDir, { recursive: true, force: true });
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
    if (closeError) throw closeError;
  });

  test('mounts CodeMirror without initiating a Monaco runtime load', async () => {
    await electronApp.evaluate(({ BrowserWindow }, expectedRendererUrl) => {
      const mainWindow = BrowserWindow.getAllWindows().find(
        (candidate) => !candidate.isDestroyed() && candidate.webContents.getURL() === expectedRendererUrl
      );
      if (!mainWindow) throw new Error('Desktop main window is unavailable.');

      mainWindow.webContents.send(
        'office-ai-bridge-adapter',
        JSON.stringify({
          name: 'preview.open',
          data: {
            content: '<!doctype html><html><body><h1>Runtime editor proof</h1></body></html>',
            contentType: 'html',
            metadata: {
              title: 'Runtime editor proof',
              fileName: 'runtime-editor-proof.html',
            },
          },
        })
      );
    }, rendererUrl);

    await expect(page.getByText('runtime-editor-proof.html', { exact: true })).toBeVisible();
    await page.getByText('Code', { exact: true }).last().click();
    const editor = page.locator('.cm-editor');
    const editorContent = page.locator('.cm-content');
    await expect(editor).toBeVisible();
    await expect(editorContent).toContainText('Runtime editor proof');
    await editorContent.click();
    await editorContent.press('End');
    await editorContent.press('Enter');
    await editorContent.type('<!-- runtime activation probe -->');
    await page.waitForTimeout(1_000);

    const rendererEvidence = await page.evaluate(
      ({ initialScripts, initialStylesheets }) => {
        const currentScripts = Array.from(document.scripts, (script) => script.src).filter(Boolean);
        const currentStylesheets = Array.from(
          document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
          (link) => link.href
        ).filter(Boolean);
        return {
          resourceUrls: performance.getEntriesByType('resource').map((entry) => entry.name),
          addedScriptUrls: currentScripts.filter((url) => !initialScripts.includes(url)),
          addedStylesheetUrls: currentStylesheets.filter((url) => !initialStylesheets.includes(url)),
          monacoDomNodes: document.querySelectorAll('.monaco-editor, script[src*="monaco" i], link[href*="monaco" i]')
            .length,
          hasMonacoGlobal: Object.prototype.hasOwnProperty.call(window, 'monaco'),
          codeMirrorEditors: document.querySelectorAll('.cm-editor').length,
        };
      },
      { initialScripts: baselineScriptUrls, initialStylesheets: baselineStylesheetUrls }
    );

    expect(rendererEvidence.codeMirrorEditors).toBeGreaterThan(0);
    expect(rendererEvidence.monacoDomNodes).toBe(0);
    expect(rendererEvidence.hasMonacoGlobal).toBe(false);
    // Scope to Monaco. The app legitimately spawns first-party workers - e.g.
    // assets/whisperWorker-*.js for voice STT - and a blanket "no workers at
    // all" assertion is not this spec's contract (see the Monaco-scoped filter
    // it already applies further down).
    expect(workerUrls.filter((url) => /monaco/i.test(url))).toEqual([]);

    const executableUrls = Array.from(
      new Set([
        ...runtimeRequests
          .filter(({ resourceType }) => ['script', 'stylesheet'].includes(resourceType))
          .map(({ url }) => url),
        ...rendererEvidence.addedScriptUrls,
        ...rendererEvidence.addedStylesheetUrls,
      ])
    );
    const externalExecutableUrls = executableUrls.filter((url) => !url.startsWith('file:'));
    expect(externalExecutableUrls).toEqual([]);

    const monacoArtifactMarkers = executableUrls.flatMap((url) => {
      const artifactPath = fileURLToPath(url);
      const source = fs.readFileSync(artifactPath, 'utf8');
      return /monaco|vs\/editor|MonacoEnvironment|\.monaco-editor/i.test(source) ? [artifactPath] : [];
    });
    expect(monacoArtifactMarkers).toEqual([]);

    const monacoRuntimeUrls = [
      ...runtimeRequests.map(({ url }) => url),
      ...workerUrls,
      ...rendererEvidence.resourceUrls,
    ].filter((url) => /monaco/i.test(url));
    expect(monacoRuntimeUrls).toEqual([]);
  });
});
