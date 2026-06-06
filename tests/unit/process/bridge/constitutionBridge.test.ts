/**
 * Unit tests for readConstitutionWithOverlay - the Constitution +
 * per-specialist overlay reader. fs and electron are fully mocked
 * so no real ~/.wayland/ is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { homedir } from 'os';
import { join } from 'path';

// Hoist fs mock so it can be referenced inside vi.mock factory.
const { fsMock } = vi.hoisted(() => ({
  fsMock: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    renameSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
}));

vi.mock('fs', () => ({
  existsSync: fsMock.existsSync,
  readFileSync: fsMock.readFileSync,
  readdirSync: fsMock.readdirSync,
  statSync: fsMock.statSync,
  mkdirSync: fsMock.mkdirSync,
  writeFileSync: fsMock.writeFileSync,
  renameSync: fsMock.renameSync,
  unlinkSync: fsMock.unlinkSync,
}));

// Path constants - must mirror the bridge's resolution logic.
const HOME = homedir();
const WAYLAND_DIR = join(HOME, '.wayland');
const CONSTITUTION_PATH = join(WAYLAND_DIR, 'CONSTITUTION.md');
const LEGACY_SOUL_PATH = join(WAYLAND_DIR, 'SOUL.md');
const SPECIALISTS_DIR = join(WAYLAND_DIR, 'specialists');

const overlayPathFor = (id: string): string => join(SPECIALISTS_DIR, `${id}.md`);

describe('readConstitutionWithOverlay', () => {
  beforeEach(() => {
    vi.resetModules();
    fsMock.existsSync.mockReset();
    fsMock.readFileSync.mockReset();
    fsMock.mkdirSync.mockReset();
    fsMock.writeFileSync.mockReset();
    fsMock.renameSync.mockReset();
    fsMock.unlinkSync.mockReset();
  });

  it('returns empty constitution and null overlay when no files exist', async () => {
    // No CONSTITUTION.md, no SOUL.md, no overlay (assistantId omitted).
    fsMock.existsSync.mockReturnValue(false);

    const { readConstitutionWithOverlay } = await import('@process/bridge/constitutionBridge');
    const result = readConstitutionWithOverlay();

    // Bridge's `readConstitution` returns '' (no auto-seed of DEFAULT_CONSTITUTION on read;
    // that path only fires through writeConstitution/resetConstitution).
    expect(result).toEqual({ constitution: '', overlay: null });
    // The bridge must not read any Constitution/overlay/specialist file when
    // nothing exists on disk. (The rate-limit guard added by the security
    // hardening pulls in a transitive import that reads the app's own
    // package.json at module-load time; that read is unrelated to the bridge's
    // file access and is excluded here.)
    const waylandReads = fsMock.readFileSync.mock.calls.filter((call) => String(call[0]).includes(WAYLAND_DIR));
    expect(waylandReads).toEqual([]);
  });

  it('returns CONSTITUTION.md contents and null overlay when assistantId is omitted', async () => {
    const body = '# Live Constitution\nUser-edited content.';
    fsMock.existsSync.mockImplementation((p) => p === CONSTITUTION_PATH);
    fsMock.readFileSync.mockImplementation((p) => {
      if (p === CONSTITUTION_PATH) return body;
      throw new Error(`unexpected readFileSync: ${String(p)}`);
    });

    const { readConstitutionWithOverlay } = await import('@process/bridge/constitutionBridge');
    const result = readConstitutionWithOverlay();

    expect(result).toEqual({ constitution: body, overlay: null });
  });

  it('returns null overlay when assistantId is set but no overlay file exists', async () => {
    const body = 'CONSTITUTION_BODY';
    fsMock.existsSync.mockImplementation((p) => p === CONSTITUTION_PATH);
    fsMock.readFileSync.mockImplementation((p) => {
      if (p === CONSTITUTION_PATH) return body;
      throw new Error(`unexpected readFileSync: ${String(p)}`);
    });

    const { readConstitutionWithOverlay } = await import('@process/bridge/constitutionBridge');
    const result = readConstitutionWithOverlay('foo');

    expect(result).toEqual({ constitution: body, overlay: null });
    // The bridge MUST have checked for the overlay path.
    expect(fsMock.existsSync).toHaveBeenCalledWith(overlayPathFor('foo'));
  });

  it('returns overlay contents when ~/.wayland/specialists/<id>.md exists', async () => {
    const body = 'CONSTITUTION_BODY';
    const overlayBody = 'OVERLAY_BODY for foo';
    const overlayPath = overlayPathFor('foo');
    fsMock.existsSync.mockImplementation((p) => p === CONSTITUTION_PATH || p === overlayPath);
    fsMock.readFileSync.mockImplementation((p) => {
      if (p === CONSTITUTION_PATH) return body;
      if (p === overlayPath) return overlayBody;
      throw new Error(`unexpected readFileSync: ${String(p)}`);
    });

    const { readConstitutionWithOverlay } = await import('@process/bridge/constitutionBridge');
    const result = readConstitutionWithOverlay('foo');

    expect(result).toEqual({ constitution: body, overlay: overlayBody });
  });

  it('falls back to legacy ~/.wayland/SOUL.md when CONSTITUTION.md is missing', async () => {
    const legacyBody = 'legacy SOUL.md body';
    fsMock.existsSync.mockImplementation((p) => p === LEGACY_SOUL_PATH);
    fsMock.readFileSync.mockImplementation((p) => {
      if (p === LEGACY_SOUL_PATH) return legacyBody;
      throw new Error(`unexpected readFileSync: ${String(p)}`);
    });

    const { readConstitutionWithOverlay } = await import('@process/bridge/constitutionBridge');
    const result = readConstitutionWithOverlay();

    expect(result).toEqual({ constitution: legacyBody, overlay: null });
  });

  it('blocks path-traversal assistantIds without calling existsSync on the dangerous path', async () => {
    const body = 'CONSTITUTION_BODY';
    fsMock.existsSync.mockImplementation((p) => p === CONSTITUTION_PATH);
    fsMock.readFileSync.mockImplementation((p) => {
      if (p === CONSTITUTION_PATH) return body;
      throw new Error(`unexpected readFileSync: ${String(p)}`);
    });

    const { readConstitutionWithOverlay } = await import('@process/bridge/constitutionBridge');

    const dangerousIds = ['../etc/passwd', 'a/b', '', 'foo bar', '..', './foo', 'foo/../bar'];

    for (const id of dangerousIds) {
      fsMock.existsSync.mockClear();
      fsMock.readFileSync.mockClear();
      // Reset implementations after mockClear (mockClear keeps impl, but
      // be explicit so reads of CONSTITUTION_PATH still return body).
      fsMock.existsSync.mockImplementation((p) => p === CONSTITUTION_PATH);
      fsMock.readFileSync.mockImplementation((p) => {
        if (p === CONSTITUTION_PATH) return body;
        throw new Error(`unexpected readFileSync: ${String(p)}`);
      });

      const result = readConstitutionWithOverlay(id);
      expect(result.overlay).toBeNull();
      expect(result.constitution).toBe(body);

      // existsSync MUST NOT have been called with a path containing
      // the dangerous input - the regex gate short-circuits before
      // we ever construct an overlay path.
      for (const call of fsMock.existsSync.mock.calls) {
        const calledPath = String(call[0]);
        // CONSTITUTION_PATH and LEGACY_SOUL_PATH are the only legitimate
        // existsSync calls; the dangerous id must not appear anywhere.
        expect(calledPath.includes(id) && id.length > 0).toBe(false);
        // Also assert the overlay path was not probed.
        expect(calledPath).not.toContain('specialists');
      }
    }
  });
});

describe('specialist overlay CRUD', () => {
  beforeEach(() => {
    vi.resetModules();
    fsMock.existsSync.mockReset();
    fsMock.readFileSync.mockReset();
    fsMock.readdirSync.mockReset();
    fsMock.statSync.mockReset();
    fsMock.mkdirSync.mockReset();
    fsMock.writeFileSync.mockReset();
    fsMock.renameSync.mockReset();
    fsMock.unlinkSync.mockReset();
  });

  describe('listConstitutionSpecialists', () => {
    it('returns [] when the specialists/ directory does not exist', async () => {
      fsMock.existsSync.mockReturnValue(false);

      const { __test__ } = await import('@process/bridge/constitutionBridge');
      const result = __test__.listConstitutionSpecialists();

      expect(result).toEqual([]);
      // Directory missing - no readdir attempt.
      expect(fsMock.readdirSync).not.toHaveBeenCalled();
    });

    it('returns only .md files, ids without extension, sorted ascending, with byte sizes', async () => {
      fsMock.existsSync.mockImplementation((p) => p === SPECIALISTS_DIR);
      // Deliberately out of order + one non-.md file.
      fsMock.readdirSync.mockReturnValue(['zeta.md', 'alpha.md', 'README.txt']);
      const sizes: Record<string, number> = {
        [join(SPECIALISTS_DIR, 'zeta.md')]: 128,
        [join(SPECIALISTS_DIR, 'alpha.md')]: 42,
      };
      fsMock.statSync.mockImplementation((p) => {
        const size = sizes[String(p)];
        if (size === undefined) throw new Error(`unexpected statSync: ${String(p)}`);
        return { size };
      });

      const { __test__ } = await import('@process/bridge/constitutionBridge');
      const result = __test__.listConstitutionSpecialists();

      expect(result).toEqual([
        { id: 'alpha', bytes: 42 },
        { id: 'zeta', bytes: 128 },
      ]);
      // README.txt must not have been stat'd.
      expect(fsMock.statSync).not.toHaveBeenCalledWith(join(SPECIALISTS_DIR, 'README.txt'));
    });
  });

  describe('readConstitutionSpecialist', () => {
    it('returns file content for a valid id when the overlay file exists', async () => {
      const body = 'OVERLAY for copy';
      const overlayPath = overlayPathFor('copy');
      fsMock.existsSync.mockImplementation((p) => p === overlayPath);
      fsMock.readFileSync.mockImplementation((p) => {
        if (p === overlayPath) return body;
        throw new Error(`unexpected readFileSync: ${String(p)}`);
      });

      const { __test__ } = await import('@process/bridge/constitutionBridge');
      const result = __test__.readConstitutionSpecialist('copy');

      expect(result).toBe(body);
    });

    it("returns '' for a valid id when the overlay file is absent", async () => {
      fsMock.existsSync.mockReturnValue(false);

      const { __test__ } = await import('@process/bridge/constitutionBridge');
      const result = __test__.readConstitutionSpecialist('copy');

      expect(result).toBe('');
      // No overlay file exists, so the bridge must not read any specialist
      // file. (A transitive import reads the app's own package.json at
      // module-load time; that read is unrelated and excluded here.)
      const waylandReads = fsMock.readFileSync.mock.calls.filter((call) => String(call[0]).includes(WAYLAND_DIR));
      expect(waylandReads).toEqual([]);
    });

    it("returns '' for path-traversal ids without probing the dangerous path", async () => {
      const dangerousIds = ['../../etc/passwd', 'a/b', '', 'foo bar', '..', './foo'];

      const { __test__ } = await import('@process/bridge/constitutionBridge');

      for (const id of dangerousIds) {
        fsMock.existsSync.mockClear();
        fsMock.readFileSync.mockClear();

        const result = __test__.readConstitutionSpecialist(id);

        expect(result).toBe('');
        // Regex gate short-circuits before any fs access.
        expect(fsMock.existsSync).not.toHaveBeenCalled();
        expect(fsMock.readFileSync).not.toHaveBeenCalled();
      }
    });
  });

  describe('writeConstitutionSpecialist', () => {
    it('creates the directory and atomically writes the overlay file for a valid id', async () => {
      const content = '# Copy overlay\nTighter voice rules.';
      const overlayPath = overlayPathFor('copy');
      fsMock.mkdirSync.mockReturnValue(undefined);
      fsMock.writeFileSync.mockReturnValue(undefined);
      fsMock.renameSync.mockReturnValue(undefined);

      const { __test__ } = await import('@process/bridge/constitutionBridge');
      const result = __test__.writeConstitutionSpecialist('copy', content);

      expect(result).toBe(true);
      expect(fsMock.mkdirSync).toHaveBeenCalledWith(SPECIALISTS_DIR, { recursive: true });
      // Atomic write: content goes to a .tmp file, then renamed onto the final path.
      expect(fsMock.writeFileSync).toHaveBeenCalledWith(`${overlayPath}.tmp`, content, 'utf-8');
      expect(fsMock.renameSync).toHaveBeenCalledWith(`${overlayPath}.tmp`, overlayPath);
    });

    it('returns false and does not write for an invalid id', async () => {
      const invalidIds = ['../../evil', 'a/b', ''];

      const { __test__ } = await import('@process/bridge/constitutionBridge');

      for (const id of invalidIds) {
        fsMock.mkdirSync.mockClear();
        fsMock.writeFileSync.mockClear();
        fsMock.renameSync.mockClear();

        const result = __test__.writeConstitutionSpecialist(id, 'payload');

        expect(result).toBe(false);
        expect(fsMock.mkdirSync).not.toHaveBeenCalled();
        expect(fsMock.writeFileSync).not.toHaveBeenCalled();
        expect(fsMock.renameSync).not.toHaveBeenCalled();
      }
    });
  });

  describe('deleteConstitutionSpecialist', () => {
    it('deletes the file and returns true for a valid id when the file exists', async () => {
      const overlayPath = overlayPathFor('copy');
      fsMock.existsSync.mockImplementation((p) => p === overlayPath);
      fsMock.unlinkSync.mockReturnValue(undefined);

      const { __test__ } = await import('@process/bridge/constitutionBridge');
      const result = __test__.deleteConstitutionSpecialist('copy');

      expect(result).toBe(true);
      expect(fsMock.unlinkSync).toHaveBeenCalledWith(overlayPath);
    });

    it('returns true (idempotent) for a valid id when the file is already absent', async () => {
      fsMock.existsSync.mockReturnValue(false);

      const { __test__ } = await import('@process/bridge/constitutionBridge');
      const result = __test__.deleteConstitutionSpecialist('copy');

      expect(result).toBe(true);
      // Nothing to unlink - idempotent delete.
      expect(fsMock.unlinkSync).not.toHaveBeenCalled();
    });

    it('returns false and does not unlink for an invalid id', async () => {
      const invalidIds = ['../../etc/passwd', 'a/b', ''];

      const { __test__ } = await import('@process/bridge/constitutionBridge');

      for (const id of invalidIds) {
        fsMock.existsSync.mockClear();
        fsMock.unlinkSync.mockClear();

        const result = __test__.deleteConstitutionSpecialist(id);

        expect(result).toBe(false);
        expect(fsMock.unlinkSync).not.toHaveBeenCalled();
      }
    });
  });
});
