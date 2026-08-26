import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const {
  readPeCertificateTable,
  inspectAuthenticode,
  isAuthenticodeSigned,
  describeAuthenticode,
} = require('../../../scripts/peAuthenticode.js') as {
  readPeCertificateTable(filePath: string): { offset: number; size: number };
  inspectAuthenticode(filePath: string): {
    certificateTableOffset: number;
    certificateTableSize: number;
    certificateLength: number;
    revision: number;
    certificateType: number;
  };
  isAuthenticodeSigned(filePath: string): boolean;
  describeAuthenticode(filePath: string): string;
};

const { verifyWCoreRuntime, verifyWNanoRuntime } = require('../../../scripts/verify-packaged-resources.js') as {
  verifyWCoreRuntime(bundleDir: string, runtimeKey: string, authority: unknown): boolean;
  verifyWNanoRuntime(bundleDir: string, runtimeKey: string, authority: unknown, policySelector: unknown): boolean;
};

const prepareWaylandCore = require('../../../scripts/prepareWaylandCore.js') as {
  DEFAULT_WCORE_VERSION: string;
  BUNDLE_CONTRACT: string;
  BUNDLE_GENERATOR: string;
};
const prepareWaylandNano = require('../../../scripts/prepareWaylandNano.js') as {
  DEFAULT_WNANO_VERSION: string;
  BUNDLE_CONTRACT: string;
  BUNDLE_GENERATOR: string;
};
const { selectPolicy, CONTRACT: PUBLISHER_CONTRACT } = require(
  '../../../scripts/supply-chain/verifyPublisherAttestation.js'
) as {
  selectPolicy(releaseTag: string): {
    id: string;
    repository: string;
    signerWorkflow: string;
    sourceRef: string;
    sourceDigest: string;
    predicateType: string;
    runner: string;
  };
  CONTRACT: string;
};

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function tempDir(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-pe-authenticode-'));
  roots.push(root);
  return root;
}

// ---------------------------------------------------------------------------
// Minimal PE builder.
//
// The shapes below are not invented: they reproduce the header layout measured
// on the real FerroxLabs/wayland-nano win32-x64 executables. Both releases are
// PE32+ (optional header magic 0x20b) with 16 data directories; v0.2.0 carries
// a WIN_CERTIFICATE with revision 0x200 and type 0x2 (PKCS#7 signed data), and
// v0.1.1 carries a certificate data directory of offset 0 / size 0.
// ---------------------------------------------------------------------------
const MAGIC_PE32 = 0x10b;
const MAGIC_PE32PLUS = 0x20b;
const PE_HEADER_OFFSET = 0x40;
const COFF_HEADER_SIZE = 20;
const CERTIFICATE_DIRECTORY_INDEX = 4;

interface PeOptions {
  certificatePayload?: Buffer | null;
  magic?: number;
  numberOfRvaAndSizes?: number;
  sizeOfOptionalHeader?: number;
  tableOffset?: number;
  tableSize?: number;
  certificateLength?: number;
  revision?: number;
  certificateType?: number;
}

function buildPe(options: PeOptions = {}): Buffer {
  const magic = options.magic ?? MAGIC_PE32PLUS;
  const directoriesOffset = magic === MAGIC_PE32PLUS ? 112 : 96;
  const numberOfRvaAndSizesOffset = magic === MAGIC_PE32PLUS ? 108 : 92;
  const optionalHeaderSize = directoriesOffset + 16 * 8;
  const optionalHeaderOffset = PE_HEADER_OFFSET + 4 + COFF_HEADER_SIZE;
  const header = Buffer.alloc(optionalHeaderOffset + optionalHeaderSize);

  header.writeUInt16LE(0x5a4d, 0); // 'MZ'
  header.writeUInt32LE(PE_HEADER_OFFSET, 0x3c); // e_lfanew
  header.writeUInt32LE(0x00004550, PE_HEADER_OFFSET); // 'PE\0\0'
  header.writeUInt16LE(0x8664, PE_HEADER_OFFSET + 4); // Machine: AMD64
  header.writeUInt16LE(options.sizeOfOptionalHeader ?? optionalHeaderSize, PE_HEADER_OFFSET + 4 + 16);
  header.writeUInt16LE(magic, optionalHeaderOffset);
  header.writeUInt32LE(options.numberOfRvaAndSizes ?? 16, optionalHeaderOffset + numberOfRvaAndSizesOffset);

  const entryOffset = optionalHeaderOffset + directoriesOffset + CERTIFICATE_DIRECTORY_INDEX * 8;
  const body = Buffer.alloc(64, 0x90);
  const payload = options.certificatePayload;
  if (!payload) {
    // offset 0 / size 0: the certificate data directory of an unsigned image,
    // byte for byte what wayland-nano v0.1.1 win32-x64 shipped.
    return Buffer.concat([header, body]);
  }

  const certificate = Buffer.alloc(8 + payload.length);
  certificate.writeUInt32LE(options.certificateLength ?? certificate.length, 0);
  certificate.writeUInt16LE(options.revision ?? 0x0200, 4);
  certificate.writeUInt16LE(options.certificateType ?? 0x0002, 6);
  payload.copy(certificate, 8);

  header.writeUInt32LE(options.tableOffset ?? header.length + body.length, entryOffset);
  header.writeUInt32LE(options.tableSize ?? certificate.length, entryOffset + 4);
  return Buffer.concat([header, body, certificate]);
}

function writePe(dir: string, name: string, options: PeOptions = {}): string {
  const target = path.join(dir, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buildPe(options));
  return target;
}

const SIGNED_PAYLOAD = Buffer.from('pkcs7-signed-data-placeholder-for-a-real-authenticode-blob');

describe('PE certificate table reader', () => {
  it('KNOWN POSITIVE: reports a non-zero certificate table for a signed image', () => {
    const dir = tempDir();
    const signed = writePe(dir, 'signed.exe', { certificatePayload: SIGNED_PAYLOAD });
    const table = readPeCertificateTable(signed);
    expect(table.size).toBeGreaterThan(0);
    expect(table.offset).toBeGreaterThan(0);
    const info = inspectAuthenticode(signed);
    expect(info.revision).toBe(0x0200);
    expect(info.certificateType).toBe(0x0002);
    expect(isAuthenticodeSigned(signed)).toBe(true);
    expect(describeAuthenticode(signed)).toContain('Authenticode signature present');
  });

  it('NEGATIVE CONTROL: reports certificate table size 0 for an unsigned image', () => {
    // The exact defect behind #914. If this ever reports a non-zero size the
    // parser is wrong and every verdict it gives is void.
    const dir = tempDir();
    const unsigned = writePe(dir, 'unsigned.exe', { certificatePayload: null });
    expect(readPeCertificateTable(unsigned)).toEqual({ offset: 0, size: 0 });
    expect(isAuthenticodeSigned(unsigned)).toBe(false);
    expect(describeAuthenticode(unsigned)).toContain('NOT Authenticode signed');
  });

  it('reads a PE32 image as well as PE32+', () => {
    const dir = tempDir();
    expect(isAuthenticodeSigned(writePe(dir, 'pe32.exe', { magic: MAGIC_PE32, certificatePayload: SIGNED_PAYLOAD }))).toBe(
      true
    );
    expect(isAuthenticodeSigned(writePe(dir, 'pe32-unsigned.exe', { magic: MAGIC_PE32 }))).toBe(false);
  });

  it('FAILS CLOSED on every file it cannot parse as a signed PE', () => {
    const dir = tempDir();
    const cases: Array<[string, Buffer]> = [
      ['missing.exe', Buffer.alloc(0)],
      ['truncated.exe', buildPe({ certificatePayload: SIGNED_PAYLOAD }).subarray(0, 32)],
      ['not-a-pe.exe', Buffer.from('#!/bin/sh\necho hello\n')],
      ['mz-without-pe.exe', (() => {
        const bytes = buildPe({ certificatePayload: SIGNED_PAYLOAD });
        bytes.writeUInt32LE(0, PE_HEADER_OFFSET); // clobber the PE signature
        return bytes;
      })()],
      ['bad-magic.exe', (() => {
        const bytes = buildPe({ certificatePayload: SIGNED_PAYLOAD });
        bytes.writeUInt16LE(0x1234, PE_HEADER_OFFSET + 4 + COFF_HEADER_SIZE);
        return bytes;
      })()],
    ];
    for (const [name, bytes] of cases) {
      const target = path.join(dir, name);
      if (name !== 'missing.exe') fs.writeFileSync(target, bytes);
      expect(isAuthenticodeSigned(target), name).toBe(false);
      expect(describeAuthenticode(target), name).toContain('Authenticode check FAILED');
    }
    // A file that does not exist at all is a failure, not an absence to excuse.
    expect(isAuthenticodeSigned(path.join(dir, 'missing.exe'))).toBe(false);
  });

  it('FAILS CLOSED on a non-empty but malformed certificate table', () => {
    const dir = tempDir();
    const malformed: Array<[string, PeOptions]> = [
      ['too-few-directories.exe', { certificatePayload: SIGNED_PAYLOAD, numberOfRvaAndSizes: 4 }],
      ['short-optional-header.exe', { certificatePayload: SIGNED_PAYLOAD, sizeOfOptionalHeader: 96 }],
      ['table-past-eof.exe', { certificatePayload: SIGNED_PAYLOAD, tableOffset: 0x7fff0000 }],
      ['table-too-small.exe', { certificatePayload: SIGNED_PAYLOAD, tableSize: 4 }],
      ['length-overruns-table.exe', { certificatePayload: SIGNED_PAYLOAD, certificateLength: 0xffff }],
      ['empty-certificate.exe', { certificatePayload: SIGNED_PAYLOAD, certificateLength: 8 }],
      ['bad-revision.exe', { certificatePayload: SIGNED_PAYLOAD, revision: 0x0300 }],
      ['not-pkcs7.exe', { certificatePayload: SIGNED_PAYLOAD, certificateType: 0x0001 }],
    ];
    for (const [name, options] of malformed) {
      const target = writePe(dir, name, options);
      expect(isAuthenticodeSigned(target), name).toBe(false);
      expect(() => inspectAuthenticode(target), name).toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// The gate itself. wayland-core.exe and wayland-nano.exe are bundled ALREADY
// SIGNED by upstream and are excluded from our own Authenticode pass by the
// negative signExts patterns in electron-builder.yml, because re-signing would
// rewrite the file and break the pinned binarySha256. So the packaged-resource
// gate is the only place that can notice an upstream signature going missing,
// which is precisely what it failed to notice for wayland-nano v0.1.1 (#914).
// ---------------------------------------------------------------------------
function stageRuntime(
  product: 'wayland-core' | 'wayland-nano',
  runtimeKey: string,
  releaseTag: string,
  binary: Buffer
): { bundleDir: string; authority: Record<string, unknown> } {
  const [platform, arch] = runtimeKey.split('-') as [string, string];
  const bundleDir = path.join(tempDir(), `bundled-${product}`);
  const runtimeDir = path.join(bundleDir, runtimeKey);
  fs.mkdirSync(runtimeDir, { recursive: true });
  const binaryName = platform === 'win32' ? `${product}.exe` : product;
  fs.writeFileSync(path.join(runtimeDir, binaryName), binary);

  const real = product === 'wayland-core' ? prepareWaylandCore : prepareWaylandNano;
  const archiveSha256 = 'a'.repeat(64);
  const binarySha256 = crypto.createHash('sha256').update(binary).digest('hex');
  const assetName = `${product}-${releaseTag.replace(/^v/, '')}-${runtimeKey}.zip`;
  const policy = selectPolicy(releaseTag);
  fs.writeFileSync(
    path.join(runtimeDir, 'manifest.json'),
    JSON.stringify({
      contract: real.BUNDLE_CONTRACT,
      generator: real.BUNDLE_GENERATOR,
      platform,
      arch,
      releaseTag,
      version: releaseTag,
      sourceType: 'download',
      verified: true,
      source: {
        owner: 'FerroxLabs',
        repository: product,
        url: `https://github.com/FerroxLabs/${product}/releases/download/${releaseTag}/${assetName}`,
        asset: assetName,
        archiveSha256: `sha256:${archiveSha256}`,
      },
      publisherAttestation: {
        contract: PUBLISHER_CONTRACT,
        policyId: policy.id,
        repository: policy.repository,
        signerWorkflow: policy.signerWorkflow,
        sourceRef: policy.sourceRef,
        sourceDigest: policy.sourceDigest,
        predicateType: policy.predicateType,
        runner: policy.runner,
        asset: assetName,
        sha256: `sha256:${archiveSha256}`,
        verified: true,
      },
      binary: {
        name: binaryName,
        sha256: `sha256:${binarySha256}`,
        stagedSha256: `sha256:${binarySha256}`,
      },
      files: [binaryName],
      skipped: false,
    })
  );

  const authority = {
    BUNDLE_CONTRACT: real.BUNDLE_CONTRACT,
    BUNDLE_GENERATOR: real.BUNDLE_GENERATOR,
    DEFAULT_WCORE_VERSION: releaseTag,
    DEFAULT_WNANO_VERSION: releaseTag,
    getAssetName: () => assetName,
    loadExpectedProvenance: () => ({ archiveSha256, binarySha256 }),
  };
  return { bundleDir, authority };
}

describe('packaged resource gate rejects an unsigned bundled Windows binary', () => {
  const wcoreTag = prepareWaylandCore.DEFAULT_WCORE_VERSION;
  const wnanoTag = prepareWaylandNano.DEFAULT_WNANO_VERSION;

  it('KNOWN POSITIVE: accepts a win32 wayland-nano runtime whose upstream signature is intact', () => {
    const { bundleDir, authority } = stageRuntime(
      'wayland-nano',
      'win32-x64',
      wnanoTag,
      buildPe({ certificatePayload: SIGNED_PAYLOAD })
    );
    expect(verifyWNanoRuntime(bundleDir, 'win32-x64', authority, selectPolicy)).toBe(true);
  });

  it('rejects a win32 wayland-nano runtime whose PE certificate table is empty', () => {
    // This is #914 exactly: correct pinned bytes, correct manifest, no signature.
    const { bundleDir, authority } = stageRuntime('wayland-nano', 'win32-x64', wnanoTag, buildPe());
    expect(verifyWNanoRuntime(bundleDir, 'win32-x64', authority, selectPolicy)).toBe(false);
  });

  it('rejects a win32 wayland-nano runtime whose executable cannot be parsed at all', () => {
    const { bundleDir, authority } = stageRuntime(
      'wayland-nano',
      'win32-x64',
      wnanoTag,
      Buffer.from('not-a-windows-executable')
    );
    expect(verifyWNanoRuntime(bundleDir, 'win32-x64', authority, selectPolicy)).toBe(false);
  });

  it('KNOWN POSITIVE: accepts a win32 wayland-core runtime whose upstream signature is intact', () => {
    const { bundleDir, authority } = stageRuntime(
      'wayland-core',
      'win32-x64',
      wcoreTag,
      buildPe({ certificatePayload: SIGNED_PAYLOAD })
    );
    expect(verifyWCoreRuntime(bundleDir, 'win32-x64', authority)).toBe(true);
  });

  it('rejects a win32 wayland-core runtime whose PE certificate table is empty', () => {
    const { bundleDir, authority } = stageRuntime('wayland-core', 'win32-x64', wcoreTag, buildPe());
    expect(verifyWCoreRuntime(bundleDir, 'win32-x64', authority)).toBe(false);
  });

  it('does not apply the Authenticode check to a non-Windows runtime', () => {
    // A darwin or linux binary has no PE certificate table at all. The gate has
    // to skip the check for those targets rather than fail them - and it must
    // skip because the target is not Windows, never because the file happened
    // to be unparseable.
    const { bundleDir, authority } = stageRuntime(
      'wayland-nano',
      'linux-x64',
      wnanoTag,
      Buffer.from('\x7fELF-not-a-pe-image')
    );
    expect(verifyWNanoRuntime(bundleDir, 'linux-x64', authority, selectPolicy)).toBe(true);
  });
});
