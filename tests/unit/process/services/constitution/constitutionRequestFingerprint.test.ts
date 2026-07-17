import {
  canonicalConstitutionRequestFingerprintBytes,
  constitutionRequestFingerprintPreimage,
  createConstitutionRequestFingerprint,
  sameConstitutionFingerprintTarget,
} from '@process/services/constitution/constitutionRequestFingerprint';
import type { ConstitutionFsTarget } from '@process/services/constitution/constitutionFsTransaction';

const TARGET = { kind: 'constitution', sourceName: 'CONSTITUTION.md' } as const;
const CONTENT_SHA256 = `sha256:${'a'.repeat(64)}` as const;

describe('canonical Constitution request fingerprint', () => {
  it('binds the exact v2 mutation facts with restricted RFC 8785 bytes', () => {
    const facts = {
      intent: 'replace' as const,
      target: TARGET,
      contentSha256: CONTENT_SHA256,
      expectedRevision: 'rev:v2:expected',
      archiveIdentity: null,
    };

    expect(constitutionRequestFingerprintPreimage(facts)).toEqual({
      schemaVersion: 2,
      intent: 'replace',
      target: { kind: 'constitution', sourceName: 'CONSTITUTION.md' },
      contentSha256: CONTENT_SHA256,
      expectedRevision: 'rev:v2:expected',
      archiveIdentity: null,
    });
    expect(canonicalConstitutionRequestFingerprintBytes(facts).toString('utf8')).toBe(
      `{"archiveIdentity":null,"contentSha256":"${CONTENT_SHA256}","expectedRevision":"rev:v2:expected","intent":"replace","schemaVersion":2,"target":{"kind":"constitution","sourceName":"CONSTITUTION.md"}}`
    );
    expect(createConstitutionRequestFingerprint(facts)).toBe(
      'sha256:14c6fb170f62839726356d04143fcd32e502f89816d070d271a6153366f5a6fd'
    );
  });

  it.each([
    {
      name: 'delete',
      facts: {
        intent: 'delete' as const,
        target: TARGET,
        contentSha256: null,
        expectedRevision: 'rev:v2:expected',
        archiveIdentity: null,
      },
      expected: 'sha256:372a66d373ef8ada9d5a2d7c36339da627b1a542fe814895a455d4ff297f5ece',
    },
    {
      name: 'legacy migration',
      facts: {
        intent: 'migrate_legacy' as const,
        target: TARGET,
        contentSha256: CONTENT_SHA256,
        expectedRevision: 'rev:v2:legacy',
        archiveIdentity: null,
      },
      expected: 'sha256:8da99a32886b3f34d95e64a1ab9ba536c37b09b7e90b38de72b654612c5f04d1',
    },
    {
      name: 'specialist archive restore',
      facts: {
        intent: 'restore' as const,
        target: { kind: 'specialist', specialistId: 'copy', sourceName: 'copy.md' } as const,
        contentSha256: CONTENT_SHA256,
        expectedRevision: 'rev:v2:current',
        archiveIdentity: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      expected: 'sha256:bf321451cc1eb3aafa33fb3bfdf94955dedb4d963d70d1e4edfa793fcb6af92a',
    },
  ])('has an exact $name known-answer fingerprint', ({ facts, expected }) => {
    expect(createConstitutionRequestFingerprint(facts)).toBe(expected);
  });

  it('changes for every authoritative fact and normalizes explicit specialist identity', () => {
    const baseline = {
      intent: 'replace' as const,
      target: { kind: 'specialist', specialistId: 'copy', sourceName: 'copy.md' } as const,
      contentSha256: CONTENT_SHA256,
      expectedRevision: 'rev:v2:expected',
      archiveIdentity: null,
    };
    const fingerprint = createConstitutionRequestFingerprint(baseline);
    expect(constitutionRequestFingerprintPreimage(baseline).target).toEqual({
      kind: 'specialist',
      sourceName: 'copy.md',
      specialistId: 'copy',
    });
    expect(
      [
        { ...baseline, contentSha256: `sha256:${'b'.repeat(64)}` as const },
        { ...baseline, expectedRevision: 'rev:v2:other' },
        { ...baseline, target: { ...baseline.target, specialistId: 'research' } },
        { ...baseline, target: { ...baseline.target, sourceName: 'research.md' } },
      ].every((facts) => createConstitutionRequestFingerprint(facts) !== fingerprint)
    ).toBe(true);
  });

  it('rejects malformed or contradictory facts', () => {
    expect(() =>
      createConstitutionRequestFingerprint({
        intent: 'delete',
        target: TARGET,
        contentSha256: CONTENT_SHA256,
        expectedRevision: 'rev:v2:expected',
        archiveIdentity: null,
      })
    ).toThrow('null content digest');
    expect(() =>
      createConstitutionRequestFingerprint({
        intent: 'restore',
        target: TARGET,
        contentSha256: CONTENT_SHA256,
        expectedRevision: 'rev:v2:expected',
        archiveIdentity: null,
      })
    ).toThrow('archive identity');
    expect(() =>
      createConstitutionRequestFingerprint({
        intent: 'replace',
        target: TARGET,
        contentSha256: 'sha256:not-canonical',
        expectedRevision: 'rev:v2:expected',
        archiveIdentity: null,
      })
    ).toThrow('canonical content digest');
  });

  it('rejects unknown fields, noncanonical targets, revisions, and archive identities', () => {
    const baseline = {
      intent: 'replace' as const,
      target: TARGET,
      contentSha256: CONTENT_SHA256,
      expectedRevision: 'rev:v2:expected',
      archiveIdentity: null,
    };
    expect(() => createConstitutionRequestFingerprint({ ...baseline, extra: true } as never)).toThrow(
      'missing or unknown fields'
    );
    expect(() =>
      createConstitutionRequestFingerprint({
        ...baseline,
        target: { kind: 'constitution', sourceName: 'CONSTITUTION.md', specialistId: null } as never,
      })
    ).toThrow('missing or unknown fields');
    expect(() =>
      createConstitutionRequestFingerprint({
        ...baseline,
        target: { kind: 'constitution', sourceName: 'constitution.md' } as never,
      })
    ).toThrow('source name is invalid');
    expect(() => createConstitutionRequestFingerprint({ ...baseline, expectedRevision: 'e\u0301' })).toThrow(
      'NFC normalization'
    );
    expect(() => createConstitutionRequestFingerprint({ ...baseline, expectedRevision: 'rev\nunsafe' })).toThrow(
      'control character'
    );
    expect(() =>
      createConstitutionRequestFingerprint({ ...baseline, expectedRevision: `r${'x'.repeat(4096)}` })
    ).toThrow('scalar bound');
    expect(() =>
      createConstitutionRequestFingerprint({
        ...baseline,
        intent: 'restore',
        archiveIdentity: 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA',
      })
    ).toThrow('lowercase UUIDv4');

    const accessorTarget = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(accessorTarget, 'kind', { enumerable: true, get: () => 'constitution' });
    Object.defineProperty(accessorTarget, 'sourceName', { enumerable: true, value: 'CONSTITUTION.md' });
    expect(() => createConstitutionRequestFingerprint({ ...baseline, target: accessorTarget as never })).toThrow(
      'enumerable data field'
    );
  });

  it('compares canonical targets independently of property insertion order', () => {
    const reordered = { sourceName: 'copy.md', specialistId: 'copy', kind: 'specialist' } as ConstitutionFsTarget;
    expect(
      sameConstitutionFingerprintTarget({ kind: 'specialist', specialistId: 'copy', sourceName: 'copy.md' }, reordered)
    ).toBe(true);
    expect(
      sameConstitutionFingerprintTarget(
        { kind: 'specialist', specialistId: 'copy', sourceName: 'copy.md' },
        { kind: 'specialist', specialistId: 'research', sourceName: 'research.md' }
      )
    ).toBe(false);
  });
});
