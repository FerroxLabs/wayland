import { constants } from 'node:fs';
import { chmod, lstat, mkdir, open, realpath, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { WaylandNanoBinding } from './types';
import { validateWaylandNanoBinding } from './waylandNanoBinding';

const STORE_DIRECTORY = 'wayland-nano';
const STORE_FILE = 'activation-bindings.json';

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
    const document = await this.readDocument();
    if (document.tombstones.includes(valid.productSubjectId)) {
      throw new Error('Wayland Nano binding subject is permanently retired');
    }
    await this.writeDocument({
      schema: 'wayland.nano.activation-bindings/v1',
      bindings: { ...document.bindings, [valid.productSubjectId]: valid },
      tombstones: document.tombstones,
    });
  }

  async retire(productSubjectId: string): Promise<void> {
    const document = await this.readDocument();
    const bindings = { ...document.bindings };
    delete bindings[productSubjectId];
    await this.writeDocument({
      schema: 'wayland.nano.activation-bindings/v1',
      bindings,
      tombstones: [...new Set([...document.tombstones, productSubjectId])].toSorted(),
    });
  }

  private async readDocument(): Promise<BindingDocument> {
    const file = await this.storePath(false);
    if (!file) return EMPTY_DOCUMENT;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readPrivateFile(file));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return EMPTY_DOCUMENT;
      throw new Error('Wayland Nano binding store is unreadable', { cause: error });
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
    await rename(temp, target);
    await chmod(target, 0o600);
  }

  private async storePath(create: boolean): Promise<string | null> {
    const root = await realpath(this.#userDataRoot);
    const rootMetadata = await lstat(root);
    if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
      throw new Error('Wayland Nano binding root is unsafe');
    }
    const directory = path.join(root, STORE_DIRECTORY);
    if (create) await mkdir(directory, { recursive: false, mode: 0o700 }).catch(handleExists);
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
