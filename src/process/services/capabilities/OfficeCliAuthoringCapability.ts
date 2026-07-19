/** OfficeCLI capability evidence producer. It never decides readiness. */
import { constants } from 'node:fs';
import { access, lstat, readFile, readdir, realpath } from 'node:fs/promises';
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
    const binaryPath = path.join(bundledDir, binaryName);
    const [manifestBytes, binaryBytes] = await Promise.all([
      readFile(path.join(bundledDir, 'manifest.json')),
      readFile(binaryPath),
      platform === 'win32' ? Promise.resolve() : access(binaryPath, constants.X_OK),
    ]);
    const binarySha256 = digestOfficeCliEvidence(binaryBytes);
    const manifest = JSON.parse(manifestBytes.toString('utf8')) as Record<string, unknown>;
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
