import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const state = { excerpt: '' };
const ipc = {
  team: {
    agentSpawned: { emit: () => {} },
    agentStatusChanged: { emit: () => {} },
    agentRemoved: { emit: () => {} },
    agentRenamed: { emit: () => {} },
    messageStream: { emit: () => {} },
    mcpStatus: { emit: () => {} },
  },
  acpConversation: { responseStream: { emit: () => {} } },
  conversation: { responseStream: { emit: () => {} } },
};

const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-team-artifact-')));
const workspace = path.join(root, 'workspace');

mock.module('@/common', () => ({ ipcBridge: ipc }));
mock.module('electron', () => ({
  app: { isPackaged: false, getPath: () => os.tmpdir(), getAppPath: () => process.cwd(), on: () => {} },
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: (value: string) => Buffer.from(value, 'utf8'),
    decryptString: (value: Buffer) => value.toString('utf8'),
  },
  ipcMain: { handle: () => {}, on: () => {} },
  net: { request: () => ({ on: () => {}, end: () => {} }), isOnline: () => false },
  powerMonitor: { on: () => {} },
  Notification: class {},
  powerSaveBlocker: { start: () => 1, stop: () => {} },
  utilityProcess: { fork: () => ({ on: () => {}, kill: () => {} }) },
  BrowserWindow: class {},
  Menu: { buildFromTemplate: () => ({}) },
  MenuItem: class {},
  clipboard: { writeText: () => {} },
  systemPreferences: {},
  screen: {},
  session: {},
  shell: {},
  dialog: {},
}));
mock.module('@process/utils/message', () => ({
  addMessage: () => {},
  addOrUpdateMessage: () => {},
  flushConversationMessages: async () => {},
  nextTickToLocalFinish: (callback: () => void) => queueMicrotask(callback),
}));
mock.module('@process/agent/acp/AcpDetector', () => ({ acpDetector: { getDetectedAgents: () => [] } }));
mock.module('@process/utils/initStorage', () => ({
  ProcessConfig: { get: async () => null },
  getSkillsDir: () => path.join(root, 'skills'),
  getBuiltinSkillsCopyDir: () => path.join(root, 'builtin-skills'),
  getAutoSkillsDir: () => path.join(root, 'builtin-skills', '_builtin'),
  getCronSkillsDir: () => path.join(root, 'cron-skills'),
  getSystemDir: () => ({
    cacheDir: path.join(root, 'cache'),
    workDir: workspace,
    logDir: path.join(root, 'logs'),
    platform: process.platform,
    arch: process.arch,
    userName: 'fixture-user',
  }),
  loadSkillsContent: async () => '',
}));
mock.module('@process/services/database', () => ({
  getDatabase: async () => ({
    getConversationMessages: () => ({
      data: state.excerpt
        ? [{ id: 'assistant-report', type: 'text', position: 'left', content: { content: state.excerpt } }]
        : [],
    }),
  }),
}));
mock.module('@process/services/constitution/constitutionFsService', () => ({
  getConstitutionFsService: () => ({
    capability: () => ({ supported: true }),
    readWithOverlay: () => ({ constitution: { status: 'absent', revision: 'fixture' }, overlay: null }),
    consumeRevisionAuthorityReclaim: () => null,
  }),
}));

const { BunSqliteDriver } = await import('../../src/process/services/database/drivers/BunSqliteDriver');
const { initSchema, CURRENT_DB_VERSION } = await import('../../src/process/services/database/schema');
const { runMigrations } = await import('../../src/process/services/database/migrations');
const { SqliteTeamRepository } = await import('../../src/process/team/repository/SqliteTeamRepository');
const { Mailbox } = await import('../../src/process/team/Mailbox');
const { TaskManager } = await import('../../src/process/team/TaskManager');
const { TeamMcpServer } = await import('../../src/process/team/mcp/team/TeamMcpServer');
const { TeammateManager } = await import('../../src/process/team/TeammateManager');
const { teamEventBus } = await import('../../src/process/team/teamEventBus');

let driver: InstanceType<typeof BunSqliteDriver>;
let repo: InstanceType<typeof SqliteTeamRepository>;
let mailbox: InstanceType<typeof Mailbox>;

const agents = [
  {
    slotId: 'slot-lead',
    conversationId: 'conv-lead',
    role: 'leader' as const,
    agentType: 'acp',
    agentName: 'Leader',
    conversationType: 'acp' as const,
    status: 'idle' as const,
  },
  {
    slotId: 'slot-worker',
    conversationId: 'conv-worker',
    role: 'teammate' as const,
    agentType: 'acp',
    agentName: 'Worker',
    conversationType: 'acp' as const,
    status: 'active' as const,
  },
];

beforeAll(async () => {
  await fs.mkdir(workspace, { recursive: true });
  driver = new BunSqliteDriver(path.join(root, 'team.db'));
  initSchema(driver);
  runMigrations(driver, 0, CURRENT_DB_VERSION);
  driver
    .prepare('INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run('user-1', 'fixture-user', 'fixture-hash', 1, 1);
  repo = new SqliteTeamRepository(driver);

  mailbox = new Mailbox(repo);
});

afterAll(async () => {
  teamEventBus.removeAllListeners('responseStream');
  driver.close();
  await fs.rm(root, { recursive: true, force: true });
});

const notice = (content: string): string => content.slice(content.indexOf('[Wayland]'));

describe('team artifact claim parity with SQLite mailbox persistence', () => {
  it.each([
    { scenario: 'missing', relativePath: 'reports/missing-audit.md', present: false },
    { scenario: 'present', relativePath: 'reports/real-audit.md', present: true },
  ])(
    'persists truthful $scenario artifact observations for both notifications',
    async ({ scenario, relativePath, present }) => {
      const teamId = `team-${scenario}`;
      await repo.create({
        id: teamId,
        userId: 'user-1',
        name: 'Artifact truth fixture',
        workspace,
        workspaceMode: 'shared',
        leaderAgentId: 'slot-lead',
        agents,
        createdAt: 1,
        updatedAt: 1,
      });
      if (present) {
        await fs.mkdir(path.dirname(path.join(workspace, relativePath)), { recursive: true });
        await fs.writeFile(path.join(workspace, relativePath), '# Real artifact fixture\n');
      }
      const claim = `Completed the audit and saved it to ${relativePath}`;
      const taskManager = new TaskManager(repo, () => agents);
      const server = new TeamMcpServer({
        teamId,
        getAgents: () => agents,
        getTeam: () => ({ id: teamId, workspace, agents }) as never,
        mailbox,
        taskManager,
        wakeAgent: async () => {},
      });
      const call = (
        server as unknown as {
          handleToolCall: (tool: string, args: Record<string, unknown>, caller?: string) => Promise<string>;
        }
      ).handleToolCall.bind(server);

      await call('team_send_message', { to: 'Leader', message: claim }, 'slot-worker');
      const explicit = (await mailbox.getHistory(teamId, 'slot-lead')).find((message) => message.type === 'message');
      expect(explicit).toBeDefined();

      state.excerpt = claim;
      const workerTaskManager = {
        getOrBuildTask: async () => ({ sendMessage: async () => {} }),
        kill: () => {},
      };
      const manager = new TeammateManager({
        teamId,
        agents: agents.map((agent) => ({ ...agent })),
        mailbox,
        taskManager,
        workerTaskManager: workerTaskManager as never,
        teamWorkspace: workspace,
      });
      teamEventBus.emit('responseStream', {
        type: 'finish',
        conversation_id: 'conv-worker',
        msg_id: 'turn-automatic',
        data: null,
      });

      let automatic;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const history = await mailbox.getHistory(teamId, 'slot-lead');
        automatic = history.find((message) => message.type === 'idle_notification');
        if (automatic) break;
        await new Promise<void>((resolve) => setTimeout(resolve, 5));
      }
      manager.dispose();

      expect(automatic).toBeDefined();
      expect(explicit!.content).toContain(claim);
      expect(automatic!.content).toContain(claim);
      if (present) {
        expect(explicit!.content).not.toContain('[Wayland]');
        expect(automatic!.content).not.toContain('[Wayland]');
      } else {
        expect(notice(explicit!.content)).toBe(notice(automatic!.content));
        expect(automatic!.content).toContain('bounded workspace check');
        expect(automatic!.content).not.toContain('not found anywhere');
      }

      const persisted = await repo.getMailboxHistory(teamId, 'slot-lead');
      expect(persisted.find((message) => message.id === explicit!.id)?.content).toBe(explicit!.content);
      expect(persisted.find((message) => message.id === automatic!.id)?.content).toBe(automatic!.content);
    }
  );
});
