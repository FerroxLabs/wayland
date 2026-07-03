import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

// Store all mock states at module scope to ensure they remain accessible in vi.doMock
let mockFsStore: Record<string, any> = {};
let mockCustomExternalPaths: Array<{ name: string; path: string }> = [];
// User-approved write destinations (mirrors src/process/bridge/userApprovedPaths).
// The createZip destination is allowed when it is in an authorized root OR
// inside one of these dialog/desktop-approved directories.
let mockApprovedDirectories: string[] = [];

describe('fsBridge skills functionality', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockFsStore = {};
    mockCustomExternalPaths = [];
    mockApprovedDirectories = [];

    // Mock electron
    vi.doMock('electron', () => ({
      app: {
        isPackaged: false,
        getPath: vi.fn((name: string) => {
          if (name === 'userData') return '/mock/userData';
          if (name === 'home') return '/mock/home';
          return '/mock/path';
        }),
        getAppPath: vi.fn(() => '/mock/appPath'),
      },
    }));

    // Mock os. Path confinement (pathConfinement.ts) and NodePlatformServices
    // both read os.tmpdir()/os.homedir() when seeding static authorized roots,
    // so both must be present on the mock.
    vi.doMock('os', () => ({
      default: { homedir: vi.fn(() => '/mock/home'), tmpdir: vi.fn(() => '/mock/tmp') },
      homedir: vi.fn(() => '/mock/home'),
      tmpdir: vi.fn(() => '/mock/tmp'),
    }));

    // Mock fs/promises
    vi.doMock('fs/promises', () => {
      const resolvePath = (p: string) => path.resolve(p);
      return {
        default: {
          access: vi.fn(async (filePath: string) => {
            const fp = resolvePath(filePath);
            if (fp in mockFsStore) return;
            throw new Error(`ENOENT: no such file or directory, access '${fp}'`);
          }),
          readFile: vi.fn(async (filePath: string) => {
            const fp = resolvePath(filePath);
            if (fp.endsWith('custom_external_skill_paths.json')) {
              return JSON.stringify(mockCustomExternalPaths);
            }
            if (fp in mockFsStore) {
              const fileContent = mockFsStore[fp];
              if (typeof fileContent === 'string') return fileContent;
              if (fileContent && typeof fileContent === 'object' && fileContent.content !== undefined) {
                return fileContent.content;
              }
              throw new Error(`EISDIR: illegal operation on a directory, read '${fp}'`);
            }
            const err = new Error(`ENOENT: no such file or directory, open '${fp}'`) as NodeJS.ErrnoException;
            err.code = 'ENOENT';
            throw err;
          }),
          writeFile: vi.fn(async (filePath: string, content: string) => {
            const fp = resolvePath(filePath);
            if (fp.endsWith('custom_external_skill_paths.json')) {
              mockCustomExternalPaths = JSON.stringify(content) ? JSON.parse(content as string) : [];
              return;
            }
            mockFsStore[fp] = { content, isDirectory: false };
          }),
          readdir: vi.fn(async (dirPath: string, options?: { withFileTypes?: boolean }) => {
            const dp = resolvePath(dirPath);
            if (!(dp in mockFsStore)) throw new Error(`ENOENT: no such file or directory, scandir '${dp}'`);

            const entries = [];
            for (const key of Object.keys(mockFsStore)) {
              if (key !== dp && key.startsWith(dp + path.sep)) {
                const relativePath = key.substring(dp.length + 1);
                if (!relativePath.includes(path.sep)) {
                  entries.push({
                    name: relativePath,
                    isDirectory: () => !!mockFsStore[key].isDirectory && !mockFsStore[key].isSymlink,
                    isFile: () => !mockFsStore[key].isDirectory && !mockFsStore[key].isSymlink,
                    isSymbolicLink: () => !!mockFsStore[key].isSymlink,
                  });
                }
              }
            }
            return entries;
          }),
          mkdir: vi.fn(async (dirPath: string) => {
            mockFsStore[resolvePath(dirPath)] = { isDirectory: true };
          }),
          copyFile: vi.fn(async (src: string, dest: string) => {
            const s = resolvePath(src);
            const d = resolvePath(dest);
            if (!(s in mockFsStore)) throw new Error(`ENOENT: src not found '${s}'`);
            mockFsStore[d] = { ...mockFsStore[s] };
          }),
          lstat: vi.fn(async (filePath: string) => {
            const fp = resolvePath(filePath);
            if (!(fp in mockFsStore)) throw new Error(`ENOENT: lstat '${fp}'`);
            const isSymlink = !!mockFsStore[fp]?.isSymlink;
            return {
              isDirectory: () => !!mockFsStore[fp]?.isDirectory,
              isFile: () => !mockFsStore[fp]?.isDirectory && !isSymlink,
              isSymbolicLink: () => isSymlink,
            };
          }),
          stat: vi.fn(async (filePath: string) => {
            const fp = resolvePath(filePath);
            if (!(fp in mockFsStore)) {
              const err = new Error(`ENOENT: no such file or directory, stat '${fp}'`) as NodeJS.ErrnoException;
              err.code = 'ENOENT';
              throw err;
            }
            return {
              isDirectory: () => !!mockFsStore[fp]?.isDirectory,
              isFile: () => !mockFsStore[fp]?.isDirectory,
              size: 1024,
              mtime: new Date(),
            };
          }),
          symlink: vi.fn(async (src: string, dest: string) => {
            const s = resolvePath(src);
            const d = resolvePath(dest);
            mockFsStore[d] = { isSymlink: true, target: s, isDirectory: mockFsStore[s]?.isDirectory };
          }),
          unlink: vi.fn(async (filePath: string) => {
            delete mockFsStore[resolvePath(filePath)];
          }),
          rm: vi.fn(async (dirPath: string) => {
            const dp = resolvePath(dirPath);
            for (const key in mockFsStore) {
              if (key === dp || key.startsWith(dp + path.sep)) {
                delete mockFsStore[key];
              }
            }
          }),
        },
      };
    });

    // Mock atomicWrite - the production code uses writeFileAtomic (writes a sibling
    // .tmp file then renames). The fs/promises mock above only intercepts direct
    // writeFile calls on the canonical filename, so atomic writes never hit the
    // mockCustomExternalPaths slot. Forward to a plain writeFile here so the test
    // mock's "ends with custom_external_skill_paths.json" branch fires.
    vi.doMock('@process/utils/atomicWrite', async () => {
      const fsMod = await import('fs/promises');
      return {
        writeFileAtomic: async (targetPath: string, data: string | Buffer, opts?: unknown) => {
          await (fsMod as any).default.writeFile(targetPath, data, opts);
        },
        writeFileSyncAtomic: () => undefined,
      };
    });

    // Mock jszip
    vi.doMock('jszip', () => {
      class MockJSZip {
        file = vi.fn();
        generateAsync = vi.fn(async () => Buffer.from('fake-zip-content'));
      }
      return { default: MockJSZip };
    });

    // Mock the user-approved-paths allowlist. createZip allows a destination
    // when it is inside a directory the user approved via the native dialog or
    // the MAIN-resolved Desktop default (registered out of band of the
    // renderer). Tests drive this via mockApprovedDirectories.
    const resolveWithinApprovedDirectoryMock = (target: unknown): string | null => {
      if (typeof target !== 'string' || target.length === 0) return null;
      const resolved = path.resolve(target);
      const inside = mockApprovedDirectories.some((dir) => {
        const rel = path.relative(dir, resolved);
        return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
      });
      return inside ? resolved : null;
    };
    vi.doMock('@process/bridge/userApprovedPaths', () => ({
      registerApprovedDirectory: vi.fn((dir: string) => {
        if (typeof dir === 'string' && dir.length > 0) mockApprovedDirectories.push(path.resolve(dir));
      }),
      resolveWithinApprovedDirectory: vi.fn(resolveWithinApprovedDirectoryMock),
    }));

    // Mock initStorage
    vi.doMock('@process/utils/initStorage', () => ({
      getSystemDir: vi.fn(() => ({
        cacheDir: '/mock/cache',
        workDir: '/mock/work',
        platform: 'win32',
        arch: 'x64',
      })),
      getAssistantsDir: vi.fn(() => '/mock/userData/assistants'),
      getSkillsDir: vi.fn(() => '/mock/userData/config/skills'),
      getBuiltinSkillsCopyDir: vi.fn(() => path.resolve('/mock/userData/builtin-skills')),
      getAutoSkillsDir: vi.fn(() => path.resolve('/mock/userData/builtin-skills/_builtin')),
      ProcessEnv: { set: vi.fn() },
    }));

    // Start with empty IPC handlers map
    const handlers: Record<string, Function> = {};

    // Mock ipcBridge precisely to capture registered providers
    vi.doMock('@/common', () => {
      const createCommandMock = (channel: string) => {
        return {
          provider: vi.fn((fn) => {
            handlers[channel] = fn;
          }),
          invoke: vi.fn((payload) =>
            handlers[channel] ? handlers[channel](payload) : Promise.reject(`No handler for ${channel}`)
          ),
          emit: vi.fn(),
        };
      };

      return {
        ipcBridge: {
          fs: {
            getFilesByDir: createCommandMock('get-file-by-dir'),
            listWorkspaceFiles: createCommandMock('list-workspace-files'),
            getImageBase64: createCommandMock('get-image-base64'),
            fetchRemoteImage: createCommandMock('fetch-remote-image'),
            readFile: createCommandMock('read-file'),
            readFileBuffer: createCommandMock('read-file-buffer'),
            createTempFile: createCommandMock('create-temp-file'),
            createUploadFile: createCommandMock('create-upload-file'),
            writeFile: createCommandMock('write-file'),
            createZip: createCommandMock('create-zip-file'),
            cancelZip: createCommandMock('cancel-zip-file'),
            getFileMetadata: createCommandMock('get-file-metadata'),
            copyFilesToWorkspace: createCommandMock('copy-files-to-workspace'),
            removeEntry: createCommandMock('remove-entry'),
            renameEntry: createCommandMock('rename-entry'),
            moveEntry: createCommandMock('move-entry'),
            readBuiltinRule: createCommandMock('read-builtin-rule'),
            readBuiltinSkill: createCommandMock('read-builtin-skill'),
            readAssistantRule: createCommandMock('read-assistant-rule'),
            writeAssistantRule: createCommandMock('write-assistant-rule'),
            deleteAssistantRule: createCommandMock('delete-assistant-rule'),
            readAssistantSkill: createCommandMock('read-assistant-skill'),
            writeAssistantSkill: createCommandMock('write-assistant-rule'), // intentional generic mock fallback
            deleteAssistantSkill: createCommandMock('delete-assistant-skill'),
            // The specific ones we care about
            listAvailableSkills: createCommandMock('list-available-skills'),
            readSkillInfo: createCommandMock('read-skill-info'),
            importSkill: createCommandMock('import-skill'),
            scanForSkills: createCommandMock('scan-for-skills'),
            detectCommonSkillPaths: createCommandMock('detect-common-skill-paths'),
            detectAndCountExternalSkills: createCommandMock('detect-and-count-external-skills'),
            importSkillWithSymlink: createCommandMock('import-skill-with-symlink'),
            deleteSkill: createCommandMock('delete-skill'),
            getSkillPaths: createCommandMock('get-skill-paths'),
            exportSkillWithSymlink: createCommandMock('export-skill-with-symlink'),
            getCustomExternalPaths: createCommandMock('get-custom-external-paths'),
            addCustomExternalPath: createCommandMock('add-custom-external-path'),
            removeCustomExternalPath: createCommandMock('remove-custom-external-path'),
            enableSkillsMarket: createCommandMock('enable-skills-market'),
            disableSkillsMarket: createCommandMock('disable-skills-market'),
            listBuiltinAutoSkills: createCommandMock('list-builtin-auto-skills'),
          },
          fileStream: {
            contentUpdate: { emit: vi.fn() },
          },
        },
      };
    });

    // vi.resetModules() above reset the platform-services singleton in the fresh
    // module graph; re-register Node services so path getters used by confinement
    // resolve instead of throwing "[Platform] Services not registered".
    const { registerPlatformServices } = await import('@/common/platform');
    const { NodePlatformServices } = await import('@/common/platform/NodePlatformServices');
    registerPlatformServices(new NodePlatformServices());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  // Helper macro to fetch the actual implemented provider endpoint
  const getProvider = async (channel: string) => {
    const mod = await import('@process/bridge/fsBridge');
    mod.initFsBridge();
    const ipcMod = await import('@/common');
    // Type assertion hack, accessing the internal registered function logic
    const mockCmd =
      (ipcMod.ipcBridge.fs as any)[
        channel
          .split('-')
          .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
          .join('')
      ] ||
      (ipcMod.ipcBridge.fs as any)[channel] ||
      (
        Object.values(ipcMod.ipcBridge.fs).find(
          (v: any) => v.provider?.mock?.calls?.length && v.provider.mock.calls[0][0]
        ) as any
      )?.invoke; // Fallback

    // Because my mock logic intercepts the provider call, I can extract it directly from the mock calls
    for (const key of Object.keys(ipcMod.ipcBridge.fs)) {
      const item = (ipcMod.ipcBridge.fs as any)[key];
      if (
        item &&
        item.provider &&
        item.provider.mock &&
        item.provider.mock.calls &&
        item.provider.mock.calls.length > 0
      ) {
        // We map the mock command to its actual registration name
        // if this command matches our requested test, extract its provider function
        if (key === channel) {
          return item.provider.mock.calls[0][0]; // The actual async function passed to provider()
        }
      }
    }
    throw new Error(`Provider ${channel} not found in registered mocks`);
  };

  describe('readFile ENOENT handling (Fixes ELECTRON-6W)', () => {
    it('returns null when file does not exist instead of throwing', async () => {
      // Path is inside the authorized temp root so confinement accepts it and the
      // ENOENT-handling branch (not the confinement reject) is what returns null.
      const handler = await getProvider('readFile');
      const result = await handler({ path: '/mock/tmp/gemini-temp-123/README.md' });
      expect(result).toBeNull();
    });

    it('still throws for non-ENOENT errors (e.g., EISDIR)', async () => {
      // Create a directory entry (inside the authorized temp root) so readFile throws EISDIR
      mockFsStore[path.resolve('/mock/tmp/some-dir')] = { isDirectory: true };
      const handler = await getProvider('readFile');
      await expect(handler({ path: '/mock/tmp/some-dir' })).rejects.toThrow('EISDIR');
    });
  });

  describe('readFileBuffer ENOENT handling', () => {
    it('returns null when file does not exist instead of throwing', async () => {
      const handler = await getProvider('readFileBuffer');
      const result = await handler({ path: '/mock/tmp/temp-workspace/file.bin' });
      expect(result).toBeNull();
    });
  });

  describe('listAvailableSkills', () => {
    it('should correctly parse SKILL.md and distinguish builtin vs custom', async () => {
      // Setup filesystem mock state
      const builtinBase = path.resolve('/mock/userData/builtin-skills');
      const userBase = path.resolve('/mock/userData/config/skills');

      const yamlFrontmatterBuiltin = `---\nname: BuiltinTest\ndescription: 'A builtin test skill'\n---\n# Markdown content`;
      const yamlFrontmatterCustom = `---\nname: CustomTest\ndescription: "A custom test skill"\n---\n`;
      const yamlFrontmatterDuplicate = `---\nname: BuiltinTest\ndescription: "Shadowed custom skill"\n---\n`;

      mockFsStore[builtinBase] = { isDirectory: true };
      mockFsStore[path.join(builtinBase, 'test-skill-1')] = { isDirectory: true };
      mockFsStore[path.join(builtinBase, 'test-skill-1', 'SKILL.md')] = {
        content: yamlFrontmatterBuiltin,
        isDirectory: false,
      };
      mockFsStore[path.join(builtinBase, '_builtin')] = { isDirectory: true }; // Should be skipped

      mockFsStore[userBase] = { isDirectory: true };
      mockFsStore[path.join(userBase, 'custom-skill')] = { isDirectory: true };
      mockFsStore[path.join(userBase, 'custom-skill', 'SKILL.md')] = {
        content: yamlFrontmatterCustom,
        isDirectory: false,
      };
      // Duplicate skill name, should be deduped keeping builtin
      mockFsStore[path.join(userBase, 'duplicate-skill')] = { isDirectory: true };
      mockFsStore[path.join(userBase, 'duplicate-skill', 'SKILL.md')] = {
        content: yamlFrontmatterDuplicate,
        isDirectory: false,
      };

      const handler = await getProvider('listAvailableSkills');
      const result = await handler();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      const builtin = result.find((s: any) => s.name === 'BuiltinTest');
      expect(builtin).toBeDefined();
      expect(builtin.isCustom).toBe(false); // Keeps builtin status even though duplicate exists in user dir
      expect(builtin.description).toBe('A builtin test skill');

      const custom = result.find((s: any) => s.name === 'CustomTest');
      expect(custom).toBeDefined();
      expect(custom.isCustom).toBe(true);
    });
  });

  describe('detectAndCountExternalSkills', () => {
    it('should detect direct skills and nested skill packs from common and custom paths', async () => {
      const geminiPath = path.resolve('/mock/home/.gemini/skills');
      const customSrcPath = path.resolve('/mock/my/custom/path');

      // The custom path is a user-picked EXTERNAL folder, approved via the
      // native dialog. detectAndCountExternalSkills re-gates each persisted
      // custom path, so it must be approved for enumeration to include it.
      // (Built-in candidates like ~/.gemini/skills are app-authored fixed paths
      // and stay ungated.)
      mockApprovedDirectories.push(customSrcPath);

      // Configure mock custom paths
      mockCustomExternalPaths = [{ name: 'My Custom Path', path: customSrcPath }];
      const workBase = path.resolve('/mock/work');
      mockFsStore[workBase] = { isDirectory: true };
      mockFsStore[path.join(workBase, 'custom_external_skill_paths.json')] = { isDirectory: false }; // Let it use mockCustomExternalPaths

      const yamlDirect1 = `---\nname: DirectGemini\ndescription: direct gemini skill\n---`;
      const yamlNested1 = `---\nname: NestedGemini\n---`;
      const yamlCustom = `---\nname: CustomExtSkill\n---`;

      // Setup Gemini direct skill
      mockFsStore[geminiPath] = { isDirectory: true };
      mockFsStore[path.join(geminiPath, 'direct-skill')] = { isDirectory: true };
      mockFsStore[path.join(geminiPath, 'direct-skill', 'SKILL.md')] = { content: yamlDirect1, isDirectory: false };

      // Setup Gemini nested skill pack
      mockFsStore[path.join(geminiPath, 'pack-skill')] = { isDirectory: true };
      mockFsStore[path.join(geminiPath, 'pack-skill', 'skills')] = { isDirectory: true };
      mockFsStore[path.join(geminiPath, 'pack-skill', 'skills', 'nested-skill')] = { isDirectory: true };
      mockFsStore[path.join(geminiPath, 'pack-skill', 'skills', 'nested-skill', 'SKILL.md')] = {
        content: yamlNested1,
        isDirectory: false,
      };

      // Setup custom path skill
      mockFsStore[customSrcPath] = { isDirectory: true };
      mockFsStore[path.join(customSrcPath, 'custom-ext-skill')] = { isDirectory: true };
      mockFsStore[path.join(customSrcPath, 'custom-ext-skill', 'SKILL.md')] = {
        content: yamlCustom,
        isDirectory: false,
      };

      const handler = await getProvider('detectAndCountExternalSkills');
      const result = await handler();

      if (!result.success) {
        console.log('detectAndCountExternalSkills failed:', result);
      } else if (result.data.length === 0) {
        console.log('detectAndCountExternalSkills data is empty:', result);
      }

      expect(result.success, result.msg || JSON.stringify(result)).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);

      // Should find records for "Gemini CLI" and "My Custom Path" matching the valid files
      const geminiGroup = result.data.find((d: any) => d.source === 'gemini');
      expect(geminiGroup).toBeDefined();
      expect(geminiGroup.skills).toHaveLength(2);
      expect(geminiGroup.skills.some((s: any) => s.name === 'DirectGemini')).toBe(true);
      expect(geminiGroup.skills.some((s: any) => s.name === 'NestedGemini')).toBe(true);

      const customGroup = result.data.find((d: any) => d.source.startsWith('custom-'));
      expect(customGroup).toBeDefined();
      expect(customGroup.skills).toHaveLength(1);
      expect(customGroup.skills[0].name).toBe('CustomExtSkill');
    });
  });

  describe('Custom External Paths Management', () => {
    it('should add, get and remove custom paths', async () => {
      const workBase = path.resolve('/mock/work');
      mockFsStore[workBase] = { isDirectory: true };
      mockFsStore[path.join(workBase, 'custom_external_skill_paths.json')] = { isDirectory: false };

      // The custom path is a user-picked EXTERNAL folder, approved via the
      // native dialog. addCustomExternalPath only accepts approved-or-confined
      // paths and persists the resolved form.
      const fooBar = path.resolve('/foo/bar');
      mockApprovedDirectories.push(fooBar);

      const addHandler = await getProvider('addCustomExternalPath');
      const result1 = await addHandler({ name: 'TestPath', path: '/foo/bar' });
      expect(result1.success).toBe(true);

      // Check state
      expect(mockCustomExternalPaths).toHaveLength(1);
      expect(mockCustomExternalPaths[0].name).toBe('TestPath');
      expect(mockCustomExternalPaths[0].path).toBe(fooBar);

      // Try to add duplicate
      const result2 = await addHandler({ name: 'TestPath', path: '/foo/bar' });
      expect(result2.success).toBe(false);
      expect(result2.msg).toBe('Path already exists');

      // Remove path
      const rmHandler = await getProvider('removeCustomExternalPath');
      const result3 = await rmHandler({ path: fooBar });
      expect(result3.success).toBe(true);
      expect(mockCustomExternalPaths).toHaveLength(0);
    });

    it('rejects an arbitrary unapproved custom path (e.g. /etc) and never persists it', async () => {
      const workBase = path.resolve('/mock/work');
      mockFsStore[workBase] = { isDirectory: true };
      mockFsStore[path.join(workBase, 'custom_external_skill_paths.json')] = { isDirectory: false };

      // A compromised renderer tries to register /etc as a custom skill path so
      // it can later enumerate it. Not in an authorized root, not dialog-
      // approved - must fail closed with no write.
      const addHandler = await getProvider('addCustomExternalPath');
      const result = await addHandler({ name: 'evil', path: '/etc' });
      expect(result.success).toBe(false);
      expect(mockCustomExternalPaths).toHaveLength(0);
    });
  });

  describe('importSkillWithSymlink', () => {
    it('should successfully copy a valid skill directory to user config and fail if missing SKILL.md', async () => {
      const srcPath = path.resolve('/mock/source/valid-skill');
      const badPath = path.resolve('/mock/source/invalid-skill');
      const targetBase = path.resolve('/mock/userData/config/skills');

      // The source dirs are user-picked EXTERNAL folders (outside the app
      // roots). The native dialog registers the picked dir as approved, so the
      // confinement gate accepts it. Mirror that here.
      mockApprovedDirectories.push(path.resolve('/mock/source'));

      mockFsStore[srcPath] = { isDirectory: true };
      mockFsStore[path.join(srcPath, 'SKILL.md')] = {
        content: '---\nname: ValidSymlinkSkill\n---\nData',
        isDirectory: false,
      };
      mockFsStore[path.join(srcPath, 'extra.txt')] = { content: 'hello', isDirectory: false };

      mockFsStore[badPath] = { isDirectory: true };
      // No SKILL.md in badPath

      const handler = await getProvider('importSkillWithSymlink');

      // Success case
      const result1 = await handler({ skillPath: srcPath });
      expect(result1.success).toBe(true);
      expect(result1.data.skillName).toBe('ValidSymlinkSkill');

      // Check if symlink created at target
      const expectedTarget = path.join(targetBase, 'ValidSymlinkSkill');
      expect(mockFsStore[expectedTarget]).toBeDefined();
      expect(mockFsStore[expectedTarget].isSymlink).toBe(true);
      expect(mockFsStore[expectedTarget].target).toBe(srcPath);

      // Try importing same skill again
      const result2 = await handler({ skillPath: srcPath });
      expect(result2.success).toBe(false);
      expect(result2.msg).toContain('already exists');

      // Failure case missing SKILL.md
      const result3 = await handler({ skillPath: badPath });
      expect(result3.success).toBe(false);
      expect(result3.msg).toContain('SKILL.md file not found');
    });
  });

  describe('exportSkillWithSymlink', () => {
    it('should successfully create a symlink to external path', async () => {
      const srcPath = path.resolve('/mock/userData/config/skills/MySkill');
      const targetDir = path.resolve('/mock/home/.claude/skills');
      const targetPath = path.join(targetDir, 'MySkill');

      mockFsStore[srcPath] = { isDirectory: true };
      mockFsStore[path.join(srcPath, 'SKILL.md')] = { content: 'test', isDirectory: false };

      const handler = await getProvider('exportSkillWithSymlink');
      const result = await handler({ skillPath: srcPath, targetDir });

      expect(result.success).toBe(true);
      expect(mockFsStore[targetPath]).toBeDefined();
      expect(mockFsStore[targetPath].isSymlink).toBe(true);
      expect(mockFsStore[targetPath].target).toBe(srcPath);
    });

    it('should fail if target already exists', async () => {
      const srcPath = path.resolve('/mock/userData/config/skills/MySkill');
      const targetDir = path.resolve('/mock/home/.claude/skills');
      const targetPath = path.join(targetDir, 'MySkill');

      mockFsStore[srcPath] = { isDirectory: true };
      // Pre-create target
      mockFsStore[targetDir] = { isDirectory: true };
      mockFsStore[targetPath] = { isDirectory: true };

      const handler = await getProvider('exportSkillWithSymlink');
      const result = await handler({ skillPath: srcPath, targetDir });

      expect(result.success).toBe(false);
      expect(result.msg).toContain('Target already exists');
    });
  });

  describe('deleteSkill', () => {
    it('should delete existing skill from user directory', async () => {
      const userBase = path.resolve('/mock/userData/config/skills');
      const skillPath = path.join(userBase, 'SkillToDelete');

      mockFsStore[userBase] = { isDirectory: true };
      mockFsStore[skillPath] = { isDirectory: true };
      mockFsStore[path.join(skillPath, 'SKILL.md')] = { content: '', isDirectory: false };

      const handler = await getProvider('deleteSkill');
      const result = await handler({ skillName: 'SkillToDelete' });

      expect(result.success).toBe(true);
      expect(mockFsStore[skillPath]).toBeUndefined();
      expect(mockFsStore[path.join(skillPath, 'SKILL.md')]).toBeUndefined();
    });

    it('should fail for traversal attacks or invalid paths', async () => {
      const handler = await getProvider('deleteSkill');
      // This will resolve to something outside the skills dir, the path.resolve security check will catch it
      const result = await handler({ skillName: '../config' });

      expect(result.success).toBe(false);
      // M11 tightened the error: sanitizeSkillName now rejects `../config` upfront
      // with "Invalid skill name ..." before the path-prefix containment check
      // would otherwise produce "security check failed". Either message indicates
      // the traversal was blocked; assert on the new, clearer one.
      expect(result.msg).toContain('Invalid skill name');
    });
  });

  describe('createZip ensures parent directory exists (Fixes ELECTRON-66)', () => {
    it('creates parent directory before writing zip to a user-approved destination', async () => {
      const handler = await getProvider('createZip');
      const exportDir = path.resolve('/mock/export/subdir');
      const zipPath = path.join(exportDir, 'batch-export-test.zip');

      // The export destination is a folder the user picked via the native
      // dialog (or the Desktop default), which is OUTSIDE the app's authorized
      // roots. It is write-eligible only because main approved it.
      mockApprovedDirectories.push(exportDir);

      const result = await handler({
        path: zipPath,
        files: [{ name: 'test.txt', content: 'hello' }],
        requestId: 'test-req-1',
      });

      expect(result).toBe(true);
      // Verify parent directory was created
      expect(mockFsStore[exportDir]).toBeDefined();
    });

    it('rejects an out-of-root destination that was never approved and never writes it', async () => {
      const handler = await getProvider('createZip');
      // Classic arbitrary-write target a compromised renderer would try. It is
      // neither in an authorized root nor in any user-approved directory, so it
      // must fail closed with no write - proving the arbitrary-write primitive
      // (RT-R1-03 / RT-F1-02) is closed.
      const zipPath = path.resolve('/etc/cron.d/pwned.zip');

      const result = await handler({
        path: zipPath,
        files: [{ name: 'test.txt', content: 'hello' }],
        requestId: 'test-req-reject',
      });

      expect(result).toBe(false);
      expect(mockFsStore[path.resolve('/etc/cron.d')]).toBeUndefined();
      expect(mockFsStore[zipPath]).toBeUndefined();
    });
  });

  describe('readBuiltinRule ENOENT handling (Fixes ELECTRON-68)', () => {
    it('returns empty string when builtin rule file does not exist instead of throwing', async () => {
      const handler = await getProvider('readBuiltinRule');
      const result = await handler({ fileName: 'nonexistent-rule.md' });
      expect(result).toBe('');
    });
  });

  describe('readBuiltinSkill ENOENT handling', () => {
    it('returns empty string when builtin skill file does not exist instead of throwing', async () => {
      const handler = await getProvider('readBuiltinSkill');
      const result = await handler({ fileName: 'nonexistent-skill.md' });
      expect(result).toBe('');
    });
  });

  describe('fetchRemoteImage - error handling', () => {
    it('returns empty string for disallowed host instead of throwing', async () => {
      const handler = await getProvider('fetchRemoteImage');
      // URL with a host not in the allowlist triggers Promise.reject inside downloadRemoteBuffer
      const result = await handler({ url: 'https://evil.com/malicious.png' });
      expect(result).toBe('');
    });

    it('returns empty string for unsupported protocol', async () => {
      const handler = await getProvider('fetchRemoteImage');
      const result = await handler({ url: 'ftp://github.com/image.png' });
      expect(result).toBe('');
    });
  });

  describe('scanForSkills', () => {
    it('should find skills nested in subdirectories or directly at the root', async () => {
      const scanDir = path.resolve('/mock/scan/dir');

      // The scanned folder is a user-picked EXTERNAL folder (outside the app
      // roots), approved via the native dialog. Mirror that approval so the
      // confinement gate accepts it.
      mockApprovedDirectories.push(path.resolve('/mock/scan'));

      // Scenario 1: Subdir
      mockFsStore[scanDir] = { isDirectory: true };
      mockFsStore[path.join(scanDir, 'sub-skill')] = { isDirectory: true };
      mockFsStore[path.join(scanDir, 'sub-skill', 'SKILL.md')] = {
        content: '---\nname: SubSkill\ndescription: sub\n---',
        isDirectory: false,
      };

      // Let's add another dir without skill.md
      mockFsStore[path.join(scanDir, 'empty-dir')] = { isDirectory: true };

      const handler = await getProvider('scanForSkills');
      const result = await handler({ folderPath: scanDir });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('SubSkill');

      // Scenario 2: Root dir directly is a skill
      const rootSkillDir = path.resolve('/mock/scan/rootskill');
      mockFsStore[rootSkillDir] = { isDirectory: true };
      mockFsStore[path.join(rootSkillDir, 'SKILL.md')] = { content: '---\nname: RootSkill\n---', isDirectory: false };

      const result2 = await handler({ folderPath: rootSkillDir });
      expect(result2.success).toBe(true);
      expect(result2.data).toHaveLength(1);
      expect(result2.data[0].name).toBe('RootSkill');
    });
  });

  // Red-team confinement coverage for the skill handlers that take a renderer-
  // supplied path. Each must REJECT an out-of-root, non-approved path (e.g.
  // /root/.ssh, /etc) and still ACCEPT a user-approved (dialog-picked) external
  // folder - preserving legitimate skill import.
  describe('skill-path confinement (red-team)', () => {
    const OUT_OF_ROOT = '/root/.ssh';

    it('readSkillInfo rejects an out-of-root, unapproved path and never reads it', async () => {
      const handler = await getProvider('readSkillInfo');
      const result = await handler({ skillPath: OUT_OF_ROOT });
      expect(result.success).toBe(false);
      // No SKILL.md read happened - the gate rejected before any fs access.
      expect(result.msg).toContain('outside the allowed or approved');
    });

    it('readSkillInfo accepts an approved external folder', async () => {
      const approved = path.resolve('/mock/picked/skill');
      mockApprovedDirectories.push(path.resolve('/mock/picked'));
      mockFsStore[approved] = { isDirectory: true };
      mockFsStore[path.join(approved, 'SKILL.md')] = {
        content: '---\nname: PickedSkill\ndescription: ok\n---',
        isDirectory: false,
      };
      const handler = await getProvider('readSkillInfo');
      const result = await handler({ skillPath: approved });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('PickedSkill');
    });

    it('importSkill rejects an out-of-root, unapproved path and never copies it', async () => {
      const handler = await getProvider('importSkill');
      const result = await handler({ skillPath: '/etc' });
      expect(result.success).toBe(false);
      expect(result.msg).toContain('outside the allowed or approved');
    });

    it('importSkill accepts an approved external folder', async () => {
      const approved = path.resolve('/mock/picked2/ImportMe');
      mockApprovedDirectories.push(path.resolve('/mock/picked2'));
      mockFsStore[approved] = { isDirectory: true };
      mockFsStore[path.join(approved, 'SKILL.md')] = {
        content: '---\nname: ImportMe\n---',
        isDirectory: false,
      };
      const handler = await getProvider('importSkill');
      const result = await handler({ skillPath: approved });
      expect(result.success).toBe(true);
      expect(result.data.skillName).toBe('ImportMe');
    });

    it('scanForSkills rejects an out-of-root, unapproved path and never enumerates it', async () => {
      const handler = await getProvider('scanForSkills');
      const result = await handler({ folderPath: OUT_OF_ROOT });
      expect(result.success).toBe(false);
      expect(result.msg).toContain('outside the allowed or approved');
    });

    it('importSkillWithSymlink rejects an out-of-root, unapproved path and never links it', async () => {
      const handler = await getProvider('importSkillWithSymlink');
      const result = await handler({ skillPath: '/etc' });
      expect(result.success).toBe(false);
      expect(result.msg).toContain('outside the allowed or approved');
    });
  });
});
