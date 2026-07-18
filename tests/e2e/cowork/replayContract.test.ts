import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertArtifactEnvelope,
  assertCitedText,
  assertEquivalentJ23State,
  assertTrustedArtifactReceipts,
  sha256File,
  type ArtifactEvidence,
} from './replayContract';

const artifact = (kind: 'docx' | 'pdf', digest: `sha256:${string}`): ArtifactEvidence => ({
  path: `/tmp/report.${kind}`,
  kind,
  bytes: 1024,
  digest,
  text: 'Northstar Outcome Brief LOCAL-001 WEB-001 Sources Limitations 71 percent to 84 percent 19 hours to 7 hours',
});

describe('M8 Cowork replay acceptance contract', () => {
  it('rejects model or adapter claims that are not matching trusted Core receipts', () => {
    const output = artifact('docx', `sha256:${'1'.repeat(64)}`);
    expect(() =>
      assertTrustedArtifactReceipts(
        [
          {
            status: 'verified',
            origin: 'adapter/model',
            artifactDigest: output.digest,
            gateClosureDigest: `sha256:${'2'.repeat(64)}`,
          },
        ],
        [output]
      )
    ).toThrow('M8_RECEIPT_AUTHORITY_MISSING');
  });

  it('accepts only a verified core/anvil receipt bound to the exact artifact digest', () => {
    const output = artifact('pdf', `sha256:${'3'.repeat(64)}`);
    expect(() =>
      assertTrustedArtifactReceipts(
        [
          {
            status: 'verified',
            origin: 'core/anvil',
            artifactDigest: output.digest,
            gateClosureDigest: `sha256:${'4'.repeat(64)}`,
          },
        ],
        [output]
      )
    ).not.toThrow();
  });

  it('requires the cited facts, source IDs, Sources, and Limitations in native output text', () => {
    expect(() => assertCitedText('LOCAL-001 only', ['LOCAL-001', 'WEB-001', 'Limitations'])).toThrow(
      'M8_CITATION_OR_CONTENT_MISSING:WEB-001'
    );
  });

  it('requires both native formats on both J23 entry paths', () => {
    const docx = artifact('docx', `sha256:${'5'.repeat(64)}`);
    const pdf = artifact('pdf', `sha256:${'6'.repeat(64)}`);
    expect(() => assertEquivalentJ23State([docx, pdf], [docx, pdf], ['LOCAL-001', 'WEB-001'])).not.toThrow();
    expect(() => assertEquivalentJ23State([docx], [docx, pdf], ['LOCAL-001'])).toThrow(
      'M8_J23_NATIVE_OUTPUT_PAIR_INCOMPLETE'
    );
  });

  it('rejects files whose extension disguises a non-native payload', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'm8-artifact-envelope-'));
    try {
      const fakePdf = path.join(dir, 'report.pdf');
      fs.writeFileSync(fakePdf, Buffer.alloc(512, 0x41));
      expect(() => assertArtifactEnvelope(fakePdf, 'pdf')).toThrow('M8_PDF_HEADER_INVALID');
      expect(sha256File(fakePdf)).toMatch(/^sha256:[a-f0-9]{64}$/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
