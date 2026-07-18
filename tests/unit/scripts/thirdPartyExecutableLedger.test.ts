import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  LEDGER_FILE,
  verifyThirdPartyExecutableLedger,
} = require('../../../scripts/supply-chain/verifyThirdPartyExecutableLedger');

function ledger() {
  return JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
}

describe('bundled third-party executable authority ledger', () => {
  it('covers every known third-party executable and cross-checks its authority manifest', () => {
    expect(verifyThirdPartyExecutableLedger()).toEqual({
      contract: 'wayland-third-party-executables/1.0',
      entries: 4,
      ids: ['7zip-recovery', 'bun', 'officecli', 'signal-cli'],
    });
  });

  it.each(['owner', 'updateOwner', 'authorityFile'])('fails closed when %s is missing', (field) => {
    const candidate = ledger();
    delete candidate.entries[0][field];
    expect(() => verifyThirdPartyExecutableLedger({ ledger: candidate })).toThrow(
      new RegExp(`missing ${field}|authority file`)
    );
  });

  it('fails closed when hosted fallback or network/cost consent facts are missing', () => {
    const fallback = ledger();
    delete fallback.entries[0].hostedFallback;
    expect(() => verifyThirdPartyExecutableLedger({ ledger: fallback })).toThrow(/hosted fallback/);

    const consent = ledger();
    delete consent.entries[1].networkCostConsent.required;
    expect(() => verifyThirdPartyExecutableLedger({ ledger: consent })).toThrow(/network\/cost consent/);
  });

  it('rejects a wrong executable identity and a digest that disagrees with authority', () => {
    const wrongExecutable = ledger();
    wrongExecutable.entries.find((entry: { id: string }) => entry.id === 'bun').executables[0].name = 'node';
    expect(() => verifyThirdPartyExecutableLedger({ ledger: wrongExecutable })).toThrow(/wrong executable/);

    const wrongDigest = ledger();
    wrongDigest.entries.find((entry: { id: string }) => entry.id === 'officecli').executables[0].sha256 = '0'.repeat(
      64
    );
    expect(() => verifyThirdPartyExecutableLedger({ ledger: wrongDigest })).toThrow(/digest disagrees/);
  });

  it('rejects missing and unknown ledger members', () => {
    const missing = ledger();
    missing.entries.pop();
    expect(() => verifyThirdPartyExecutableLedger({ ledger: missing })).toThrow(/coverage mismatch/);

    const extra = ledger();
    extra.entries.push({ ...extra.entries[0], id: 'unknown-runtime' });
    expect(() => verifyThirdPartyExecutableLedger({ ledger: extra })).toThrow(/coverage mismatch/);
  });

  it('rejects an incomplete executable set even when the component remains listed', () => {
    const candidate = ledger();
    candidate.entries.find((entry: { id: string }) => entry.id === 'officecli').executables.pop();
    expect(() => verifyThirdPartyExecutableLedger({ ledger: candidate })).toThrow(/executable coverage disagrees/);
  });

  it('does not allow authority paths to escape the project', () => {
    const candidate = ledger();
    candidate.entries[0].authorityFile = path.resolve('/tmp/attacker.json');
    expect(() => verifyThirdPartyExecutableLedger({ ledger: candidate })).toThrow(/authority file is invalid/);
  });
});
