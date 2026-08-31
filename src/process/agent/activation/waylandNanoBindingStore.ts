import { constants } from 'node:fs';
import { chmod, lstat, mkdir, open, realpath, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import type { WaylandNanoBinding } from './types';
import { validateWaylandNanoBinding } from './waylandNanoBinding';

const STORE_DIRECTORY = 'wayland-nano';
const STORE_FILE = 'activation-bindings.json';
const STORE_LOCK = '.wayland-nano-activation-bindings.lock';
const storeQueues = new Map<string, Promise<void>>();
const execFileAsync = promisify(execFile);

type BindingDocument = Readonly<{
  schema: 'wayland.nano.activation-bindings/v1';
  bindings: Readonly<Record<string, WaylandNanoBinding>>;
  tombstones: readonly string[];
}>;

const EMPTY_DOCUMENT: BindingDocument = Object.freeze({
  schema: 'wayland.nano.activation-bindings/v1',
  bindings: Object.freeze({}),
  tombstones: Object.freeze([]),
});

export class WaylandNanoBindingStore {
  readonly #userDataRoot: string;

  constructor(userDataRoot: string) {
    if (!userDataRoot || userDataRoot.includes('\0')) throw new Error('Wayland Nano binding root is invalid');
    this.#userDataRoot = userDataRoot;
  }

  async load(productSubjectId: string): Promise<WaylandNanoBinding | null> {
    const document = await this.readDocument();
    if (document.tombstones.includes(productSubjectId)) return null;
    return document.bindings[productSubjectId] ?? null;
  }

  async listTombstones(): Promise<ReadonlySet<string>> {
    return new Set((await this.readDocument()).tombstones);
  }

  async put(binding: WaylandNanoBinding): Promise<void> {
    const valid = validateWaylandNanoBinding(binding);
    if (!valid) throw new Error('Wayland Nano binding is invalid');
    await this.withMutationLock(async () => {
      const document = await this.readDocument();
      if (document.tombstones.includes(valid.productSubjectId)) {
        throw new Error('Wayland Nano binding subject is permanently retired');
      }
      const existing = document.bindings[valid.productSubjectId];
      if (existing) {
        if (sameBinding(existing, valid)) return;
        throw new Error('Wayland Nano binding subject cannot be remapped');
      }
      await this.writeDocument({
        schema: 'wayland.nano.activation-bindings/v1',
        bindings: { ...document.bindings, [valid.productSubjectId]: valid },
        tombstones: document.tombstones,
      });
    });
  }

  async retire(productSubjectId: string): Promise<void> {
    await this.withMutationLock(async () => {
      const document = await this.readDocument();
      if (document.tombstones.includes(productSubjectId)) return;
      const bindings = { ...document.bindings };
      delete bindings[productSubjectId];
      await this.writeDocument({
        schema: 'wayland.nano.activation-bindings/v1',
        bindings,
        tombstones: [...new Set([...document.tombstones, productSubjectId])].toSorted(),
      });
    });
  }

  private async withMutationLock<T>(mutation: () => Promise<T>): Promise<T> {
    const root = await realpath(this.#userDataRoot);
    const target = path.join(root, STORE_DIRECTORY, STORE_FILE);
    const previous = storeQueues.get(target) ?? Promise.resolve();
    let releaseQueue!: () => void;
    const queued = new Promise<void>((resolve) => {
      releaseQueue = resolve;
    });
    const tail = previous.then(() => queued);
    storeQueues.set(target, tail);
    await previous;
    const lockPath = path.join(root, STORE_LOCK);
    let lock;
    try {
      lock = await open(lockPath, 'wx', 0o600).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'EEXIST') throw new Error('Wayland Nano binding store is busy');
        throw error;
      });
      await lock.sync();
      await enforceOwnerOnlyPath(lockPath, 'file', 'full');
      const initializedTarget = await this.storePath(true);
      if (initializedTarget !== target)
        throw new Error('Wayland Nano binding store path changed during initialization');
      return await mutation();
    } finally {
      await lock?.close();
      if (lock) {
        try {
          await unlink(lockPath);
        } catch {
          // The lock handle is already closed; stale cleanup is fail-closed on the next mutation.
        }
      }
      releaseQueue();
      if (storeQueues.get(target) === tail) storeQueues.delete(target);
    }
  }

  private async readDocument(): Promise<BindingDocument> {
    const file = await this.storePath(false);
    if (!file) return EMPTY_DOCUMENT;
    let raw: string;
    try {
      raw = await readPrivateFile(file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return EMPTY_DOCUMENT;
      throw error;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error('Wayland Nano binding store is malformed', { cause: error });
    }
    return parseDocument(parsed);
  }

  private async writeDocument(document: BindingDocument): Promise<void> {
    const target = await this.storePath(true);
    if (!target) throw new Error('Wayland Nano binding store is unavailable');
    const temp = `${target}.${process.pid}.${randomUUID()}.tmp`;
    const handle = await open(temp, 'wx', 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(document)}\n`, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await chmod(temp, 0o600);
    await enforceOwnerOnlyPath(temp, 'file', 'full');
    await rename(temp, target);
    await chmod(target, 0o600);
    await enforceOwnerOnlyPath(target, 'file', 'full');
  }

  private async storePath(create: boolean): Promise<string | null> {
    const root = await realpath(this.#userDataRoot);
    const rootMetadata = await lstat(root);
    if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
      throw new Error('Wayland Nano binding root is unsafe');
    }
    const directory = path.join(root, STORE_DIRECTORY);
    let created = false;
    if (create) {
      await mkdir(directory, { recursive: false, mode: 0o700 })
        .then(() => {
          created = true;
        })
        .catch(handleExists);
    }
    let metadata;
    try {
      metadata = await lstat(directory);
    } catch (error) {
      if (!create && (error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    if (
      !metadata.isDirectory() ||
      metadata.isSymbolicLink() ||
      (process.platform !== 'win32' && (metadata.mode & 0o077) !== 0)
    ) {
      throw new Error('Wayland Nano binding directory is unsafe');
    }
    const canonicalDirectory = await realpath(directory);
    if (path.dirname(canonicalDirectory) !== root) throw new Error('Wayland Nano binding directory escaped userData');
    await enforceOwnerOnlyPath(canonicalDirectory, 'directory', 'full', !created);
    return path.join(canonicalDirectory, STORE_FILE);
  }
}

function parseDocument(value: unknown): BindingDocument {
  if (!isRecord(value) || value.schema !== 'wayland.nano.activation-bindings/v1') {
    throw new Error('Wayland Nano binding store schema is invalid');
  }
  if (!isRecord(value.bindings) || !Array.isArray(value.tombstones)) {
    throw new Error('Wayland Nano binding store shape is invalid');
  }
  const bindings: Record<string, WaylandNanoBinding> = {};
  for (const [subject, candidate] of Object.entries(value.bindings)) {
    const binding = validateWaylandNanoBinding(candidate);
    if (!binding || binding.productSubjectId !== subject)
      throw new Error('Wayland Nano binding store entry is invalid');
    bindings[subject] = binding;
  }
  if (!value.tombstones.every((item): item is string => typeof item === 'string')) {
    throw new Error('Wayland Nano binding tombstone is invalid');
  }
  return Object.freeze({
    schema: 'wayland.nano.activation-bindings/v1',
    bindings: Object.freeze(bindings),
    tombstones: Object.freeze([...new Set(value.tombstones)]),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function handleExists(error: unknown): void {
  if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
}

async function readPrivateFile(file: string): Promise<string> {
  const before = await lstat(file);
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    (process.platform !== 'win32' && (before.mode & 0o077) !== 0) ||
    path.dirname(await realpath(file)) !== path.dirname(file)
  ) {
    throw new Error('Wayland Nano binding file is unsafe');
  }
  await enforceOwnerOnlyPath(file, 'file', 'full', true);
  const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const after = await handle.stat();
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size) {
      throw new Error('Wayland Nano binding file changed while opening');
    }
    return handle.readFile('utf8');
  } finally {
    await handle.close();
  }
}

function sameBinding(left: WaylandNanoBinding, right: WaylandNanoBinding): boolean {
  return (
    left.productSubjectId === right.productSubjectId &&
    left.principalId === right.principalId &&
    left.projectId === right.projectId &&
    left.issuerId === right.issuerId &&
    left.issuerKeyRef === right.issuerKeyRef &&
    left.backend === right.backend
  );
}

export async function enforceOwnerOnlyPath(
  target: string,
  kind: 'file' | 'directory',
  ownerAccess: 'full' | 'read-execute' | 'read-execute-delete',
  verifyOnly = false
): Promise<void> {
  if (process.platform !== 'win32') return;
  const [encodedTarget, encodedKind, encodedAccess, encodedVerifyOnly] = [
    target,
    kind,
    ownerAccess,
    String(verifyOnly),
  ].map((value) => Buffer.from(value, 'utf8').toString('base64'));
  const script = String.raw`
$ErrorActionPreference='Stop'
$target=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedTarget}'))
$kind=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedKind}'))
$access=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedAccess}'))
$verifyOnly=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedVerifyOnly}')) -eq 'true'
$current=[Security.Principal.WindowsIdentity]::GetCurrent().User
$system=New-Object Security.Principal.SecurityIdentifier('S-1-5-18')
$admins=New-Object Security.Principal.SecurityIdentifier('S-1-5-32-544')
if(-not $verifyOnly) {
  $acl=if($kind -eq 'directory'){[IO.Directory]::GetAccessControl($target)}else{[IO.File]::GetAccessControl($target)}
  $acl.SetAccessRuleProtection($true,$false)
  foreach($rule in @($acl.GetAccessRules($true,$false,[Security.Principal.SecurityIdentifier]))){[void]$acl.RemoveAccessRuleSpecific($rule)}
  $inherit=if($kind -eq 'directory'){[Security.AccessControl.InheritanceFlags]'ContainerInherit,ObjectInherit'}else{[Security.AccessControl.InheritanceFlags]::None}
  $rights=if($access -eq 'full'){[Security.AccessControl.FileSystemRights]::FullControl}elseif($access -eq 'read-execute-delete'){[Security.AccessControl.FileSystemRights]::ReadAndExecute -bor [Security.AccessControl.FileSystemRights]::Delete}else{[Security.AccessControl.FileSystemRights]::ReadAndExecute}
  $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($current,$rights,$inherit,[Security.AccessControl.PropagationFlags]::None,[Security.AccessControl.AccessControlType]::Allow)))
  foreach($sid in @($system,$admins)){$acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,[Security.AccessControl.FileSystemRights]::FullControl,$inherit,[Security.AccessControl.PropagationFlags]::None,[Security.AccessControl.AccessControlType]::Allow)))}
  if($kind -eq 'directory'){[IO.Directory]::SetAccessControl($target,$acl)}else{[IO.File]::SetAccessControl($target,$acl)}
}
$actual=if($kind -eq 'directory'){[IO.Directory]::GetAccessControl($target)}else{[IO.File]::GetAccessControl($target)}
$owner=$actual.GetOwner([Security.Principal.SecurityIdentifier]).Value
if($owner -ne $current.Value -or -not $actual.AreAccessRulesProtected){exit 41}
$allowed=@($current.Value,$system.Value,$admins.Value)
$contentWriteMask=2 -bor 4 -bor 16 -bor 64 -bor 256
$authorityMask=262144 -bor 524288
$deleteMask=65536
foreach($rule in $actual.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){
  $sid=$rule.IdentityReference.Value
  if($rule.IsInherited -or ($rule.AccessControlType -eq 'Allow' -and $allowed -notcontains $sid)){exit 42}
  if($access -eq 'read-execute' -and $sid -eq $current.Value -and (([int]$rule.FileSystemRights -band ($contentWriteMask -bor $authorityMask -bor $deleteMask)) -ne 0)){exit 43}
  if($access -eq 'read-execute-delete' -and $sid -eq $current.Value -and (([int]$rule.FileSystemRights -band ($contentWriteMask -bor $authorityMask)) -ne 0)){exit 43}
}
`;
  await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    windowsHide: true,
    timeout: 15_000,
  }).catch((error) => {
    throw new Error(`Wayland Nano owner-only ACL ${verifyOnly ? 'verification' : 'enforcement'} failed`, {
      cause: error,
    });
  });
}
