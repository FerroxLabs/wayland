/** RECON PROBE 2: does a realpath/abspath divergence break resolveOutputDir containment? */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveOutputDir } from '@process/agent/wcore/envBuilder';

describe('RECON: realpath divergence vs resolveOutputDir containment', () => {
  it('shows what happens when workspace is realpathed and staging is not', () => {
    const raw = fs.mkdtempSync(path.join(os.tmpdir(), 'mrrecon-div-'));
    const real = fs.realpathSync(raw);
    const staging = path.join(raw, 'artifacts', 'market', '.staging', 'run-1');
    fs.mkdirSync(staging, { recursive: true });
    console.log('[DIV] raw       =', raw);
    console.log('[DIV] realpath  =', real);
    console.log('[DIV] diverges  =', raw !== real);
    const both = resolveOutputDir(raw, staging, 'conv1');
    const mixed = resolveOutputDir(real, staging, 'conv1');
    console.log('[DIV] resolveOutputDir(raw ws , raw staging) =', both);
    console.log('[DIV] resolveOutputDir(real ws, raw staging) =', mixed);
    console.log('[DIV] mixed fell back to chat namespace?      =', mixed !== staging);
    expect(both).toBe(staging);
  });

  it("the real task workspace does NOT diverge", () => {
    const ws = '/Users/seandonahoe/Documents/Wayland/Tasks/Weekday morning report';
    if (!fs.existsSync(ws)) {
      console.log('[DIV] task workspace absent on this host - skipping');
      return;
    }
    const real = fs.realpathSync(ws);
    console.log('[DIV] task ws  =', ws);
    console.log('[DIV] realpath =', real);
    console.log('[DIV] diverges =', ws !== real);
    expect(real).toBe(ws);
  });
});
