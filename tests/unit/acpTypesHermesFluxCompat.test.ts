import { describe, it, expect } from 'vitest';
import { getFluxCompat } from '@/common/types/acpTypes';

/**
 * `fluxCompat` is only ever read to answer one user-facing question: is there
 * something for ME to do? Every behavioural consumer (the model pickers,
 * flux-auto defaulting) tests `=== 'env' || === 'setup'` and treats them
 * identically, so the split earns its keep at the chip and nowhere else.
 *
 * hermes and kimi both need a config FILE - neither routes by env injection -
 * which is why hermes was originally classified `setup` alongside kimi. But that
 * groups them on mechanism when the chip is asking about the user:
 *
 *   kimi   - the USER writes it, by clicking the Flux setup chip. Actionable.
 *   hermes - WE write it, per spawn, into a Wayland-scoped HERMES_HOME the user
 *            never sees and never has to create. Nothing to click.
 *
 * Classified `setup`, hermes rendered an INERT chip reading "Flux setup" - the
 * same words as kimi's, which opens a real modal - so the one agent that was
 * already routing looked like the one still waiting on the user.
 */
describe('hermes flux capability', () => {
  it('classifies hermes as env: already routing, nothing for the user to do', () => {
    expect(getFluxCompat('hermes')).toBe('env');
  });
});

describe('wayland nano flux capability', () => {
  // Nano shipped with no `fluxCompat` at all, so it rendered with no chip while
  // all 18 other agents carried one — the absence reads as "Flux does not apply
  // here" for the agent Wayland ships itself. It is `env` by the hermes rule:
  // AcpAgentManager writes the connected Flux key to a file for the spawn and
  // exports the provider-parity env with it. The user clicks nothing.
  it('classifies wnano as env: Desktop routes it per spawn', () => {
    expect(getFluxCompat('wnano')).toBe('env');
  });
});

describe('kimi flux capability', () => {
  // Verified by execution against the real binary: Kimi Code's config.toml takes
  // a generic `type = "openai"` provider, and env injection registers nothing.
  //
  // Kept beside hermes deliberately: it is the contrast that gives the case above
  // meaning. If a later change collapses the two back together, one of these two
  // assertions fails rather than both quietly agreeing on a wrong answer.
  it('classifies kimi as setup (config-file routable, not vendor-locked)', () => {
    expect(getFluxCompat('kimi')).toBe('setup');
  });
});
