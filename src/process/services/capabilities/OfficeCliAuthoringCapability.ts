/** OfficeCLI capability evidence producer. It never decides readiness. */
import { constants, type Stats } from 'node:fs';
import { lstat, open, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import {
  CAPABILITY_EVIDENCE_CONTRACT,
  OFFICECLI_CAPABILITY,
  WAYLAND_CAPABILITY_MANIFEST,
  type CapabilityEvidence,
  type CapabilityPlatform,
} from '@/common/capabilities';
import { getBundledOfficeCliDir } from '@process/utils/shellEnv';
import {
  OFFICECLI_CONTRACT_SHA256,
  OFFICECLI_LEDGER_PROOF,
  OFFICECLI_PINNED_AUTHORING_VERSION,
  OFFICECLI_SKILL_PROOF,
  REQUIRED_OFFICECLI_AUTHORING_COMMANDS,
  classifyBundledOfficeCli,
  digestOfficeCliEvidence,
  validOfficeCliSkillProof,
} from './OfficeCliContractValidator';

export {
  OFFICECLI_CONTRACT_SHA256,
  OFFICECLI_LEDGER_PROOF,
  OFFICECLI_PINNED_AUTHORING_VERSION,
  OFFICECLI_SKILL_PROOF,
  REQUIRED_OFFICECLI_AUTHORING_COMMANDS,
  classifyBundledOfficeCli,
} from './OfficeCliContractValidator';

const EVIDENCE_TTL_MS = 5 * 60_000;

type StablePathIdentity = Readonly<{
  dev: number;
  ino: number;
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
}>;

function pathIdentity(stat: Stats): StablePathIdentity {
  return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    ctimeMs: stat.ctimeMs,
  };
}

function samePathIdentity(left: StablePathIdentity, right: StablePathIdentity): boolean {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.mode === right.mode &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs
  );
}

async function authenticateBundleDirectory(bundledDir: string): Promise<{
  realPath: string;
  identity: StablePathIdentity;
}> {
  const stat = await lstat(bundledDir);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('invalid OfficeCLI bundle directory');
  return { realPath: await realpath(bundledDir), identity: pathIdentity(stat) };
}

async function readAuthenticatedBundleFile(
  bundledDir: string,
  bundleRealPath: string,
  name: string,
  executable: boolean
): Promise<{ bytes: Buffer; identity: StablePathIdentity; realPath: string }> {
  const filePath = path.join(bundledDir, name);
  const before = await lstat(filePath);
  if (before.isSymbolicLink() || !before.isFile()) throw new Error('invalid OfficeCLI bundle file');
  const beforeIdentity = pathIdentity(before);
  const beforeRealPath = await realpath(filePath);
  if (path.dirname(beforeRealPath) !== bundleRealPath) throw new Error('OfficeCLI bundle file escapes its directory');

  const noFollow = process.platform === 'win32' ? 0 : constants.O_NOFOLLOW;
  const handle = await open(filePath, constants.O_RDONLY | noFollow);
  try {
    const opened = await handle.stat();
    const openedIdentity = pathIdentity(opened);
    if (
      !opened.isFile() ||
      !samePathIdentity(beforeIdentity, openedIdentity) ||
      (executable && process.platform !== 'win32' && (opened.mode & 0o111) === 0)
    ) {
      throw new Error('OfficeCLI bundle file identity changed before read');
    }
    const bytes = await handle.readFile();
    const afterRead = pathIdentity(await handle.stat());
    if (!samePathIdentity(openedIdentity, afterRead)) {
      throw new Error('OfficeCLI bundle file identity changed during read');
    }
    return { bytes, identity: openedIdentity, realPath: beforeRealPath };
  } finally {
    await handle.close();
  }
}

async function verifyBundleIdentityAfterRead(
  bundledDir: string,
  expectedRealPath: string,
  expectedIdentity: StablePathIdentity,
  expectedFiles: ReadonlyArray<Readonly<{ name: string; identity: StablePathIdentity; realPath: string }>>
): Promise<void> {
  const afterBundle = await authenticateBundleDirectory(bundledDir);
  if (afterBundle.realPath !== expectedRealPath || !samePathIdentity(afterBundle.identity, expectedIdentity)) {
    throw new Error('OfficeCLI bundle directory identity changed during read');
  }
  await Promise.all(
    expectedFiles.map(async (expected) => {
      const filePath = path.join(bundledDir, expected.name);
      const [stat, canonicalPath] = await Promise.all([lstat(filePath), realpath(filePath)]);
      if (
        stat.isSymbolicLink() ||
        !stat.isFile() ||
        !samePathIdentity(pathIdentity(stat), expected.identity) ||
        canonicalPath !== expected.realPath
      ) {
        throw new Error('OfficeCLI bundle file identity changed after read');
      }
    })
  );
}

export type OfficeCliProbeContext = Readonly<{
  correlationId: string;
  backend: string;
  now?: number;
  platform?: CapabilityPlatform['platform'];
  arch?: CapabilityPlatform['arch'];
  bundledDir?: string | null;
  skillsRoot?: string | null;
}>;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
/** Re-authenticate the exact installed OfficeCLI skill bytes before advertising the capability. */
export async function verifyInstalledOfficeCliSkillProof(skillsRoot: string, value: unknown): Promise<boolean> {
  if (!validOfficeCliSkillProof(value)) return false;
  try {
    const rootReal = await realpath(skillsRoot);
    const expected = new Set(OFFICECLI_SKILL_PROOF.skills.map((skill) => skill.path));
    const discovered = new Set<string>();
    const visit = async (relativeDir: string): Promise<void> => {
      const absoluteDir = path.join(skillsRoot, relativeDir);
      await Promise.all(
        (await readdir(absoluteDir, { withFileTypes: true })).map(async (entry) => {
          const relative = path.posix.join(relativeDir.split(path.sep).join('/'), entry.name);
          if (entry.isSymbolicLink()) throw new Error('symbolic skill path');
          if (entry.isDirectory()) await visit(relative);
          else if (entry.isFile()) discovered.add(relative);
          else throw new Error('unsupported skill path');
        })
      );
    };
    const topLevelEntries = await readdir(skillsRoot, { withFileTypes: true });
    const officeCliEntries = topLevelEntries.filter((entry) => entry.name.startsWith('officecli-'));
    if (officeCliEntries.some((entry) => entry.isSymbolicLink() || !entry.isDirectory())) return false;
    await Promise.all(officeCliEntries.map((entry) => visit(entry.name)));
    const builtinDir = path.join(skillsRoot, '_builtin', 'office-cli');
    try {
      const builtinStat = await lstat(builtinDir);
      if (builtinStat.isSymbolicLink() || !builtinStat.isDirectory()) return false;
      await visit('_builtin/office-cli');
    } catch {
      // Exact-set comparison below rejects the missing builtin skill.
    }
    if (canonical([...discovered].toSorted()) !== canonical([...expected].toSorted())) return false;
    const checks = await Promise.all(
      OFFICECLI_SKILL_PROOF.skills.map(async (skill) => {
        const absolute = path.join(skillsRoot, skill.path);
        const stat = await lstat(absolute);
        if (!stat.isFile() || stat.isSymbolicLink()) return false;
        const canonicalPath = await realpath(absolute);
        if (!canonicalPath.startsWith(`${rootReal}${path.sep}`)) return false;
        return digestOfficeCliEvidence(await readFile(canonicalPath)) === skill.sha256;
      })
    );
    return checks.every(Boolean);
  } catch {
    return false;
  }
}

function evidenceBase(
  context: Required<Pick<OfficeCliProbeContext, 'correlationId' | 'backend'>>,
  now: number,
  platform: CapabilityPlatform['platform'],
  arch: CapabilityPlatform['arch']
) {
  return {
    contract: CAPABILITY_EVIDENCE_CONTRACT,
    capabilityId: OFFICECLI_CAPABILITY.id,
    capabilityVersion: OFFICECLI_CAPABILITY.version,
    manifestId: WAYLAND_CAPABILITY_MANIFEST.id,
    manifestVersion: WAYLAND_CAPABILITY_MANIFEST.version,
    fixtureDigest: OFFICECLI_CAPABILITY.fixtureDigest,
    source: 'officecli-bundle',
    correlationId: context.correlationId,
    observedAt: now,
    expiresAt: now + EVIDENCE_TTL_MS,
    platform,
    arch,
    backend: context.backend,
    executionMode: OFFICECLI_CAPABILITY.executionMode,
    dependencies: [],
    requirements: OFFICECLI_CAPABILITY.requirements,
  } as const;
}

/** Read only the canonical bundled target. PATH executables are never consulted. */
export async function probeOfficeCliAuthoringEvidence(context: OfficeCliProbeContext): Promise<CapabilityEvidence> {
  const now = context.now ?? Date.now();
  const platform = context.platform ?? (process.platform as CapabilityPlatform['platform']);
  const arch = context.arch ?? (process.arch as CapabilityPlatform['arch']);
  const base = evidenceBase(context, now, platform, arch);
  const bundledDir = context.bundledDir === undefined ? getBundledOfficeCliDir() : context.bundledDir;
  if (!bundledDir)
    return {
      ...base,
      evidenceId: `officecli-missing:${platform}:${arch}`,
      sourceInstance: `officecli-missing:${platform}:${arch}`,
      status: 'unavailable',
      operations: [],
      formats: [],
      reason: 'The target-exact bundled OfficeCLI runtime is unavailable.',
    };
  try {
    const binaryName = platform === 'win32' ? 'officecli.exe' : 'officecli';
    const bundle = await authenticateBundleDirectory(bundledDir);
    const [manifestFile, binaryFile] = await Promise.all([
      readAuthenticatedBundleFile(bundledDir, bundle.realPath, 'manifest.json', false),
      readAuthenticatedBundleFile(bundledDir, bundle.realPath, binaryName, true),
    ]);
    await verifyBundleIdentityAfterRead(bundledDir, bundle.realPath, bundle.identity, [
      { name: 'manifest.json', identity: manifestFile.identity, realPath: manifestFile.realPath },
      { name: binaryName, identity: binaryFile.identity, realPath: binaryFile.realPath },
    ]);
    const binarySha256 = digestOfficeCliEvidence(binaryFile.bytes);
    const manifest = JSON.parse(manifestFile.bytes.toString('utf8')) as Record<string, unknown>;
    const result = classifyBundledOfficeCli(manifest, binarySha256, platform, arch);
    if ('reason' in result)
      return {
        ...base,
        evidenceId: `officecli-invalid:${platform}:${arch}`,
        sourceInstance: `officecli-invalid:${platform}:${arch}`,
        status: 'unavailable',
        operations: [],
        formats: [],
        reason: result.reason,
      };
    if (!context.skillsRoot || !(await verifyInstalledOfficeCliSkillProof(context.skillsRoot, manifest.skillProof))) {
      return {
        ...base,
        evidenceId: `officecli-invalid-skills:${platform}:${arch}`,
        sourceInstance: `officecli-invalid-skills:${platform}:${arch}`,
        status: 'unavailable',
        operations: [],
        formats: [],
        reason: 'The installed OfficeCLI skill set does not match the executable contract.',
      };
    }
    return {
      ...base,
      evidenceId: `officecli:${binarySha256.slice(7)}`,
      sourceInstance: `officecli:${binarySha256.slice(7)}`,
      status: 'available',
      operations: OFFICECLI_CAPABILITY.operations,
      formats: OFFICECLI_CAPABILITY.formats,
      artifact: { binarySha256, publisherProof: result.publisherProof },
      reason: 'Target-exact OfficeCLI bundle evidence is valid.',
    };
  } catch {
    return {
      ...base,
      evidenceId: `officecli-invalid:${platform}:${arch}`,
      sourceInstance: `officecli-invalid:${platform}:${arch}`,
      status: 'unavailable',
      operations: [],
      formats: [],
      reason: 'The target-exact OfficeCLI bundle could not be validated.',
    };
  }
}
