import { describe, it, expect, vi, beforeEach } from 'vitest';

// Normalize paths to forward slashes for cross-platform key matching
const norm = (p: string) => p.replace(/\\/g, '/');

// Use vi.hoisted() so tracking variables are initialized before vi.mock factories run
const { mkdirCalls, copyCalls, statResults, lstatResults, existsSyncResults, readdirResults, resetAll } = vi.hoisted(
  () => {
    const dirs: string[] = [];
    // Skills are COPIED into the workspace, not symlinked: wayland-core's
    // SandboxedFs canonicalizes before its containment check and refuses a
    // symlink that resolves outside the root, which is where our skills live.
    const links: Array<{ source: string; target: string }> = [];
    const stats: Record<string, boolean> = {};
    const lstats: Record<string, boolean> = {};
    const existsSync: Record<string, boolean> = {};
    const readdir: Record<string, string[]> = {};

    return {
      mkdirCalls: dirs,
      copyCalls: links,
      statResults: stats,
      lstatResults: lstats,
      existsSyncResults: existsSync,
      readdirResults: readdir,
      resetAll: () => {
        dirs.length = 0;
        links.length = 0;
        for (const key of Object.keys(stats)) delete stats[key];
        for (const key of Object.keys(lstats)) delete lstats[key];
        for (const key of Object.keys(existsSync)) delete existsSync[key];
        for (const key of Object.keys(readdir)) delete readdir[key];
      },
    };
  }
);

vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn(async (dir: string) => {
      mkdirCalls.push(norm(dir));
    }),
    stat: vi.fn(async (p: string) => {
      if (statResults[norm(p)]) return {};
      throw new Error(`ENOENT: ${p}`);
    }),
    lstat: vi.fn(async (p: string) => {
      if (lstatResults[norm(p)]) return {};
      throw new Error(`ENOENT: ${p}`);
    }),
    readdir: vi.fn(async (p: string) => readdirResults[norm(p)] ?? []),
  },
}));

// The placement mechanism under test. Partial mock so the rest of the module
// (getDataPath and friends) keeps its real behaviour.
vi.mock('@process/utils/utils', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  copyDirectoryRecursively: vi.fn(async (source: string, target: string) => {
    copyCalls.push({ source: norm(source), target: norm(target) });
  }),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn((p: string) => existsSyncResults[norm(p)] ?? false),
}));

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: vi.fn(() => '/mock/user/skills'),
  getBuiltinSkillsCopyDir: vi.fn(() => '/mock/builtin-skills'),
  getAutoSkillsDir: vi.fn(() => '/mock/auto-skills'),
  getSystemDir: vi.fn(() => '/mock/system'),
}));

vi.mock('@process/utils/openclawUtils', () => ({
  computeOpenClawIdentityHash: vi.fn(() => 'mock-hash'),
}));

vi.mock('@/common/utils', () => ({
  uuid: vi.fn(() => 'mock-uuid'),
}));

describe('initAgent - skill support', () => {
  let hasNativeSkillSupport: (agentTypeOrBackend: string | undefined) => boolean;
  let setupAssistantWorkspace: (
    workspace: string,
    options: { agentType?: string; backend?: string; enabledSkills?: string[] }
  ) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    resetAll();

    const mod = await import('@process/utils/initAgent');
    hasNativeSkillSupport = mod.hasNativeSkillSupport;
    setupAssistantWorkspace = mod.setupAssistantWorkspace;
  });

  describe('hasNativeSkillSupport', () => {
    it('should return true for all backends with verified native skill dirs', () => {
      // Includes both ACP backends and non-ACP agents (gemini, wcore) with native skill support
      const supported = [
        'claude',
        'codebuddy',
        'codex',
        'qwen',
        'goose',
        'droid',
        'kimi',
        'vibe',
        'cursor',
        'gemini',
        'wcore',
        'opencode',
      ];
      for (const backend of supported) {
        expect(hasNativeSkillSupport(backend)).toBe(true);
      }
    });

    it('should return false for backends without native skill support', () => {
      const unsupported = ['auggie', 'copilot', 'nanobot', 'qoder'];
      for (const backend of unsupported) {
        expect(hasNativeSkillSupport(backend)).toBe(false);
      }
    });

    it('should return false for undefined or empty string', () => {
      expect(hasNativeSkillSupport(undefined)).toBe(false);
      expect(hasNativeSkillSupport('')).toBe(false);
    });

    it('should return false for unknown backend names', () => {
      expect(hasNativeSkillSupport('unknown-agent')).toBe(false);
      expect(hasNativeSkillSupport('custom')).toBe(false);
    });
  });

  describe('setupAssistantWorkspace', () => {
    it('should create skills dir even when enabledSkills is empty', async () => {
      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
        enabledSkills: [],
      });
      expect(mkdirCalls).toContain('/tmp/workspace/.claude/skills');
      expect(copyCalls).toHaveLength(0); // no builtin skills in mock readdir
    });

    it('should create skills dir even when enabledSkills is undefined', async () => {
      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
      });
      expect(mkdirCalls).toContain('/tmp/workspace/.claude/skills');
      expect(copyCalls).toHaveLength(0); // no builtin skills in mock readdir
    });

    it('should create skills dir for opencode backend', async () => {
      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'opencode',
        enabledSkills: ['pptx'],
      });
      expect(mkdirCalls).toContain('/tmp/workspace/.opencode/skills');
      expect(copyCalls).toHaveLength(0); // no builtin skills in mock readdir, pptx not found
    });

    it('should place the skill in correct dir for claude backend', async () => {
      const skillSource = '/mock/user/skills/pptx';
      statResults[skillSource] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
        enabledSkills: ['pptx'],
      });

      expect(mkdirCalls).toContain('/tmp/workspace/.claude/skills');
      expect(copyCalls).toHaveLength(1);
      expect(copyCalls[0]).toEqual({
        source: skillSource,
        target: '/tmp/workspace/.claude/skills/pptx',
      });
    });

    it('should place the skill in .codex/skills for codex backend', async () => {
      statResults['/mock/user/skills/pdf'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'codex',
        enabledSkills: ['pdf'],
      });

      expect(mkdirCalls).toContain('/tmp/workspace/.codex/skills');
      expect(copyCalls[0].target).toBe('/tmp/workspace/.codex/skills/pdf');
    });

    it('should place the skill in .codebuddy/skills for codebuddy', async () => {
      statResults['/mock/user/skills/morph-ppt'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        agentType: 'codebuddy',
        enabledSkills: ['morph-ppt'],
      });

      expect(copyCalls[0].target).toBe('/tmp/workspace/.codebuddy/skills/morph-ppt');
    });

    it('should place the skill in .wayland-core/skills for wcore backend', async () => {
      statResults['/mock/user/skills/officecli-docx'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        agentType: 'wcore',
        enabledSkills: ['officecli-docx'],
      });

      // wcore is a non-ACP agent but still supports native skill discovery.
      // The engine looks in `.wayland-core/skills/` (wcore-skills/src/paths.rs);
      // the 'wcore' agentType key maps to that path in NON_ACP_SKILLS_DIRS.
      expect(mkdirCalls).toContain('/tmp/workspace/.wayland-core/skills');
      expect(copyCalls).toHaveLength(1);
      expect(copyCalls[0].target).toBe('/tmp/workspace/.wayland-core/skills/officecli-docx');
    });

    it('should place the skill in .factory/skills for droid backend', async () => {
      statResults['/mock/user/skills/deploy'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'droid',
        enabledSkills: ['deploy'],
      });

      expect(copyCalls[0].target).toBe('/tmp/workspace/.factory/skills/deploy');
    });

    /**
     * This used to assert the `junction` symlink type, for Windows. Skills are
     * no longer symlinked at all, so that concern is gone with the mechanism —
     * but the reason it existed is not, so the guard becomes the stronger claim:
     * the skill is materialised INSIDE the workspace, with no link to follow.
     *
     * That is what wayland-core's sandbox requires. Its containment check
     * canonicalizes first and refuses any path resolving outside the root, so a
     * link pointing back at the config directory made every file in the skill
     * unreadable to the agent.
     */
    it('materialises the skill inside the workspace rather than linking to it', async () => {
      statResults['/mock/user/skills/test-skill'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
        enabledSkills: ['test-skill'],
      });

      expect(copyCalls).toHaveLength(1);
      expect(copyCalls[0].target).toBe('/tmp/workspace/.claude/skills/test-skill');
      expect(copyCalls[0].target.startsWith('/tmp/workspace/')).toBe(true);
    });

    it('should prefer builtin-skills/ over user skills/', async () => {
      existsSyncResults['/mock/builtin-skills/pptx'] = true;
      statResults['/mock/builtin-skills/pptx'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
        enabledSkills: ['pptx'],
      });

      expect(copyCalls[0].source).toBe('/mock/builtin-skills/pptx');
    });

    it('should fall back to user skills/ when not in builtin-skills/', async () => {
      existsSyncResults['/mock/builtin-skills/custom-skill'] = false;
      statResults['/mock/user/skills/custom-skill'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
        enabledSkills: ['custom-skill'],
      });

      expect(copyCalls[0].source).toBe('/mock/user/skills/custom-skill');
    });

    it('should inject builtin skills from autoSkillsDir and deduplicate from enabledSkills', async () => {
      readdirResults['/mock/auto-skills'] = ['cron', 'office-cli'];
      statResults['/mock/auto-skills/cron'] = true;
      statResults['/mock/auto-skills/office-cli'] = true;
      statResults['/mock/user/skills/pptx'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
        enabledSkills: ['cron', 'pptx'], // cron is in autoSkillNames - should not duplicate
      });

      // cron (builtin) + office-cli (builtin) + pptx (user), cron not duplicated
      expect(copyCalls).toHaveLength(3);
      const cronCall = copyCalls.find((c) => c.target.includes('cron'));
      expect(cronCall?.source).toBe('/mock/auto-skills/cron');
      expect(copyCalls.filter((c) => c.target.includes('cron'))).toHaveLength(1);
    });

    it('should skip symlink when target already exists', async () => {
      const skillSource = '/mock/user/skills/pptx';
      const skillTarget = '/tmp/workspace/.claude/skills/pptx';
      statResults[skillSource] = true;
      lstatResults[skillTarget] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
        enabledSkills: ['pptx'],
      });

      expect(copyCalls).toHaveLength(0);
    });

    it('should warn when source skill directory does not exist', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
        enabledSkills: ['nonexistent-skill'],
      });

      expect(copyCalls).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent-skill'));
      consoleSpy.mockRestore();
    });

    it('should prefer backend over agentType when both provided', async () => {
      statResults['/mock/user/skills/test-skill'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        agentType: 'gemini',
        backend: 'codex',
        enabledSkills: ['test-skill'],
      });

      // backend 'codex' takes priority -> .codex/skills
      expect(mkdirCalls).toContain('/tmp/workspace/.codex/skills');
    });

    it('should handle multiple enabled skills', async () => {
      statResults['/mock/user/skills/pptx'] = true;
      statResults['/mock/user/skills/pdf'] = true;
      statResults['/mock/user/skills/docx'] = true;

      await setupAssistantWorkspace('/tmp/workspace', {
        backend: 'claude',
        enabledSkills: ['pptx', 'pdf', 'docx'],
      });

      expect(copyCalls).toHaveLength(3);
    });
  });
});
