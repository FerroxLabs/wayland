/**
 * The context gauge must never present SPEND as OCCUPANCY.
 *
 * Measured on a live buyer run: a turn with 12 tool calls displayed
 * "711.8K / 1M context used" on a 69KB conversation. The engine emits three
 * usage shapes on the same channel - per-request, turn total (carries `turns`),
 * and session total - and the journal shows turn totals of input_tokens
 * 1,709,797 against a 1M window, which no single request can be.
 *
 * Two consequences, both user-facing: the figure is alarming and wrong, and it
 * grows with TOOL CALLS rather than conversation length, so the harder the
 * agent works the closer it looks to running out.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '../../../..');
const hook = readFileSync(join(ROOT, 'src/renderer/pages/conversation/platforms/wcore/useWCoreMessage.ts'), 'utf-8');
const gauge = readFileSync(join(ROOT, 'src/renderer/components/agent/ContextUsageIndicator.tsx'), 'utf-8');

/** The occupancy arithmetic, extracted exactly as useWCoreMessage computes it. */
function readUsage(u: {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
  turns?: number;
}) {
  return {
    totalTokens:
      (u.input_tokens || 0) + (u.cache_read_tokens || 0) + (u.cache_creation_tokens || 0) + (u.output_tokens || 0),
    isCumulative: typeof u.turns === 'number' && u.turns > 0,
  };
}

describe('context usage is occupancy, not spend', () => {
  it('counts the CACHED prompt, which still occupies the window', () => {
    // Real frame: input_tokens is only the uncached part. Ignoring cache_read
    // made a 34K request read as 1K.
    const r = readUsage({ input_tokens: 1081, cache_read_tokens: 32896, output_tokens: 358 });
    expect(r.totalTokens).toBe(34335);
    expect(r.isCumulative).toBe(false);
  });

  it('marks a TURN total as cumulative so it is never drawn against the window', () => {
    // Real frame from the run's journal.
    const r = readUsage({ input_tokens: 986503, cache_read_tokens: 723294, output_tokens: 7467, turns: 8 });
    expect(r.isCumulative).toBe(true);
    expect(r.totalTokens).toBeGreaterThan(1_000_000); // exceeds the window: cannot be occupancy
  });

  it('CONTROL: a single-request frame is NOT marked cumulative', () => {
    expect(readUsage({ input_tokens: 5000, output_tokens: 100 }).isCumulative).toBe(false);
  });

  it('the old arithmetic understated a cached request by 33x', () => {
    const frame = { input_tokens: 1081, cache_read_tokens: 32896, output_tokens: 358 };
    const old = (frame.input_tokens || 0) + (frame.output_tokens || 0);
    expect(old).toBe(1439);
    expect(readUsage(frame).totalTokens / old).toBeGreaterThan(20);
  });

  // The block above models the arithmetic; these bind it to the shipped code, so
  // the model cannot drift away from the implementation and stay green.
  it('the real handler counts cached tokens IN THE SUM, not just in the type', () => {
    // Matching the bare word passes on the type declaration alone - it did, and
    // deleting both terms from the arithmetic left this green. Bind to the sum.
    const sum = hook.match(/const occupancy =[\s\S]{0,400}?;/)?.[0] ?? '';
    expect(sum, 'occupancy sum not found').not.toBe('');
    expect(sum).toMatch(/cache_read_tokens/);
    expect(sum).toMatch(/cache_creation_tokens/);
    expect(sum).toMatch(/input_tokens/);
    expect(sum).toMatch(/output_tokens/);
  });

  it('the real handler marks cumulative frames', () => {
    expect(hook).toMatch(/isCumulative:\s*typeof usageData\.turns/);
  });

  it('the gauge does not word spend as "context used"', () => {
    expect(gauge).toMatch(/isSpend/);
    expect(gauge).toMatch(/tokensThisTurn/);
  });

  it('the gauge never raises a warning colour on spend', () => {
    expect(gauge).toMatch(/isWarning:\s*!isSpend/);
    expect(gauge).toMatch(/isDanger:\s*!isSpend/);
  });
});
