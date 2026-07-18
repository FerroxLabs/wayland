import { createServer, type Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { invokeBridge } from '../helpers';
import {
  assertEquivalentJ23State,
  assertTrustedArtifactReceipts,
  inspectNativeArtifact,
  type ArtifactEvidence,
  type ReceiptSurfaceEvidence,
} from '../cowork/replayContract';

type Journey = Readonly<{
  id: string;
  entry: 'ordinary-composer' | 'cowork-starter';
  workspace: string;
  docx: string;
  pdf: string;
  title: string;
  revisedTitle?: string;
  prompt: string;
  revisionPrompt?: string;
}>;

type Contract = Readonly<{
  contract: string;
  sourceIds: readonly string[];
  requiredFacts: readonly string[];
  journeys: readonly Journey[];
}>;

const ROOT = path.resolve(__dirname, '../../..');
const FIXTURE_ROOT = path.join(ROOT, 'tests/e2e/fixtures/cowork');
const CONTRACT = JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, 'j17-j23.json'), 'utf8')) as Contract;
const EXECUTABLE = process.env.WAYLAND_M8_EXECUTABLE;
const USER_DATA = process.env.WAYLAND_M8_USER_DATA_DIR;
const WORKSPACE_ROOT = process.env.WAYLAND_M8_WORKSPACE_ROOT;
const EVIDENCE_ROOT = process.env.WAYLAND_M8_EVIDENCE_ROOT;

let app: ElectronApplication;
let page: Page;
let sourceServer: Server;
let webSourceUrl: string;

const requiredMarkers = (journey: Journey, revised = false) => [
  revised ? (journey.revisedTitle ?? journey.title) : journey.title,
  ...CONTRACT.sourceIds,
  ...CONTRACT.requiredFacts,
  'Sources',
  'Limitations',
];

function requireHarnessEnvironment(): void {
  for (const [name, value] of Object.entries({
    WAYLAND_M8_EXECUTABLE: EXECUTABLE,
    WAYLAND_M8_USER_DATA_DIR: USER_DATA,
    WAYLAND_M8_WORKSPACE_ROOT: WORKSPACE_ROOT,
    WAYLAND_M8_EVIDENCE_ROOT: EVIDENCE_ROOT,
  })) {
    if (!value || !path.isAbsolute(value)) throw new Error(`M8_HARNESS_ENV_INVALID:${name}`);
  }
  if (!fs.existsSync(EXECUTABLE!)) throw new Error(`M8_PACKAGED_EXECUTABLE_MISSING:${EXECUTABLE}`);
}

function writeJourneyEvidence(id: string, value: unknown): void {
  fs.mkdirSync(EVIDENCE_ROOT!, { recursive: true });
  fs.writeFileSync(path.join(EVIDENCE_ROOT!, `${id}.json`), `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  });
}

async function prepareWorkspace(journey: Journey): Promise<string> {
  const workspace = path.join(WORKSPACE_ROOT!, journey.workspace);
  fs.rmSync(workspace, { recursive: true, force: true });
  fs.mkdirSync(workspace, { recursive: true });
  fs.copyFileSync(path.join(FIXTURE_ROOT, 'local-source.md'), path.join(workspace, 'local-source.md'));
  return workspace;
}

async function selectWorkspace(workspace: string): Promise<void> {
  await app.evaluate(({ dialog }, selectedWorkspace) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selectedWorkspace] });
  }, workspace);
  const button = page.locator('button.sendbox-model-btn').filter({ hasText: /Chat in Folder|Specify Workspace/i });
  await button.first().click();
  await expect(page.locator('.guid-input-card-shell')).toContainText(path.basename(workspace), { timeout: 10_000 });
}

async function openEntry(journey: Journey, workspace: string): Promise<void> {
  await page.evaluate(() => {
    window.location.hash = '#/guid';
  });
  await page.waitForURL(/#\/guid/, { timeout: 20_000 });
  await invokeBridge(page, 'agent.config.storage.set', { key: 'guid.lastSelectedAgent', data: '' });
  await page.reload();
  await page.locator('.guid-input-card-shell textarea').waitFor({ state: 'visible', timeout: 20_000 });
  if (journey.entry === 'cowork-starter') {
    const starter = page.locator('[data-quicklaunch-id="builtin-cowork"]');
    await starter.waitFor({ state: 'visible', timeout: 20_000 });
    await starter.click();
    await expect(page.locator('[class*="heroTitle"]')).toContainText(/Cowork/i);
  } else {
    await expect(page.locator('[class*="heroTitle"]')).toHaveCount(0);
  }
  await selectWorkspace(workspace);
}

async function clickVisibleApprovals(): Promise<void> {
  const approvals = await page.getByRole('button', { name: /^(Allow|Approve|Continue|Run|Yes)$/i }).all();
  const visibility = await Promise.all(approvals.map((approval) => approval.isVisible().catch(() => false)));
  const firstVisible = approvals[visibility.findIndex(Boolean)];
  if (firstVisible) await firstVisible.click().catch(() => undefined);
}

async function waitForTurnAndFiles(journey: Journey, timeoutMs = 8 * 60_000): Promise<void> {
  const docx = path.join(WORKSPACE_ROOT!, journey.workspace, journey.docx);
  const pdf = path.join(WORKSPACE_ROOT!, journey.workspace, journey.pdf);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // The packaged product is intentionally polled serially: each approval can advance the same turn.
    // eslint-disable-next-line no-await-in-loop
    await clickVisibleApprovals();
    if (fs.existsSync(docx) && fs.existsSync(pdf) && fs.statSync(docx).size > 255 && fs.statSync(pdf).size > 255) return;
    // eslint-disable-next-line no-await-in-loop
    const fatal = await page
      .getByText(/API Error|Policy denied|failed to start|not configured|command requires/i)
      .last()
      .textContent()
      .catch(() => null);
    if (fatal) throw new Error(`M8_PRODUCT_TURN_BLOCKED:${fatal.replace(/\s+/g, ' ').trim()}`);
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(500);
  }
  throw new Error(`M8_ARTIFACT_TIMEOUT:${journey.id}`);
}

async function sendFromComposer(prompt: string): Promise<void> {
  const input = page.locator('.guid-input-card-shell textarea');
  await input.fill(prompt.replace('{{WEB_SOURCE_URL}}', webSourceUrl));
  await input.press('Enter');
  await page.waitForURL(/#\/conversation\//, { timeout: 20_000 });
}

async function sendFollowUp(prompt: string): Promise<void> {
  const input = page.locator('textarea:visible').last();
  await input.fill(prompt.replace('{{WEB_SOURCE_URL}}', webSourceUrl));
  await input.press('Enter');
}

async function collectTrustedReceiptSurfaces(): Promise<ReceiptSurfaceEvidence[]> {
  const coreTab = page.getByRole('button', { name: /^Core(?: \(open\))?$/ }).first();
  if (!(await coreTab.isVisible().catch(() => false))) throw new Error('M8_CORE_EVIDENCE_SURFACE_MISSING');
  await coreTab.click();
  const receiptsFacet = page.getByRole('button', { name: /^Receipts$/ }).first();
  if (!(await receiptsFacet.isVisible().catch(() => false))) throw new Error('M8_RECEIPT_FACET_MISSING');
  await receiptsFacet.click();
  return page.locator('[data-testid="receipt-trust-surface"]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const terms = [...node.querySelectorAll('dt')];
      const read = (label: string) => {
        const term = terms.find((item) => item.textContent?.trim() === label);
        return term?.nextElementSibling?.textContent?.trim();
      };
      return {
        status: node.getAttribute('data-trust-status') ?? '',
        origin: read('Origin'),
        contract: read('Contract'),
        artifactDigest: read('Artifact'),
        gateClosureDigest: read('Gate closure'),
      };
    })
  );
}

async function validateJourney(journey: Journey, revised = false): Promise<ArtifactEvidence[]> {
  const workspace = path.join(WORKSPACE_ROOT!, journey.workspace);
  const artifacts = await Promise.all([
    inspectNativeArtifact(path.join(workspace, journey.docx), 'docx', requiredMarkers(journey, revised)),
    inspectNativeArtifact(path.join(workspace, journey.pdf), 'pdf', requiredMarkers(journey, revised)),
  ]);
  const receipts = await collectTrustedReceiptSurfaces();
  assertTrustedArtifactReceipts(receipts, artifacts);
  writeJourneyEvidence(journey.id, {
    contract: CONTRACT.contract,
    status: 'passed',
    entry: journey.entry,
    artifacts: artifacts.map(({ text: _text, ...artifact }) => artifact),
    receipts,
  });
  return artifacts;
}

async function runJourney(journey: Journey): Promise<ArtifactEvidence[]> {
  const workspace = await prepareWorkspace(journey);
  try {
    await openEntry(journey, workspace);
    await sendFromComposer(journey.prompt);
    await waitForTurnAndFiles(journey);
    return await validateJourney(journey);
  } catch (error) {
    writeJourneyEvidence(journey.id, {
      contract: CONTRACT.contract,
      status: 'failed',
      entry: journey.entry,
      blocker: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

test.beforeAll(async () => {
  requireHarnessEnvironment();
  sourceServer = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    response.end(fs.readFileSync(path.join(FIXTURE_ROOT, 'web-source.html')));
  });
  await new Promise<void>((resolve) => sourceServer.listen(0, '127.0.0.1', resolve));
  const address = sourceServer.address();
  if (!address || typeof address === 'string') throw new Error('M8_SOURCE_SERVER_ADDRESS_UNAVAILABLE');
  webSourceUrl = `http://127.0.0.1:${address.port}/northstar.html`;

  app = await electron.launch({
    executablePath: EXECUTABLE!,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      WAYLAND_DISABLE_AUTO_UPDATE: '1',
      WAYLAND_DISABLE_DEVTOOLS: '1',
      WAYLAND_E2E_TEST: '1',
      WAYLAND_E2E_USER_DATA_DIR: USER_DATA!,
      WAYLAND_MULTI_INSTANCE: '1',
      WAYLAND_CDP_PORT: '0',
    },
    timeout: 60_000,
  });
  page = await app.firstWindow({ timeout: 60_000 });
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await app?.close().catch(() => undefined);
  await new Promise<void>((resolve) => sourceServer?.close(() => resolve()));
});

test.describe('M8-D packaged Cowork J17/J23 replay', () => {
  test.describe.configure({ timeout: 12 * 60_000 });

  test('J17 ordinary composer produces cited native outputs and fresh trusted receipts after revision', async () => {
    const journey = CONTRACT.journeys.find((item) => item.id === 'J17')!;
    const initial = await runJourney(journey);
    const initialDigests = initial.map((artifact) => artifact.digest);
    try {
      await sendFollowUp(journey.revisionPrompt!);
      await waitForTurnAndFiles(journey);
      const revised = await validateJourney(journey, true);
      expect(revised.map((artifact) => artifact.digest)).not.toEqual(initialDigests);
    } catch (error) {
      writeJourneyEvidence(journey.id, {
        contract: CONTRACT.contract,
        status: 'failed',
        entry: journey.entry,
        stage: 'scoped-revision',
        blocker: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  test('J23 plain and Cowork starter converge on equivalent cited native-artifact state', async () => {
    const plainJourney = CONTRACT.journeys.find((item) => item.id === 'J23-plain')!;
    const coworkJourney = CONTRACT.journeys.find((item) => item.id === 'J23-cowork')!;
    const plain = await runJourney(plainJourney);
    const cowork = await runJourney(coworkJourney);
    assertEquivalentJ23State(plain, cowork, [...CONTRACT.sourceIds, ...CONTRACT.requiredFacts, 'Sources', 'Limitations']);
  });
});
