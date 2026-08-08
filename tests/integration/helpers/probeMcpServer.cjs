#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A one-tool stdio MCP server for the live end-to-end MCP proof.
 *
 * The point of this server is the WITNESS FILE. `tools/call` appends a line
 * before returning, so the file is written by the tool's own body inside a
 * process the engine spawned. That makes it evidence the model cannot fake by
 * merely claiming success, and it distinguishes "the tool was discovered"
 * (LIST) from "the tool actually ran" (CALL) — which is exactly the distinction
 * W-1 turned on.
 *
 * Deliberately dependency-free and CommonJS: it is spawned by the engine as a
 * bare `node <path>` child, outside the app's module graph and bundler.
 */
const fs = require('fs');

const WITNESS = process.env.PROBE_WITNESS;
const SENTINEL = process.env.PROBE_SENTINEL || 'PROBE-OK-8842';

const TOOL = {
  name: 'wld_probe_secret',
  description:
    'Returns the secret probe code for this session. The ONLY way to obtain the probe code ' +
    'is to call this tool. Call it whenever the user asks for the probe code.',
  inputSchema: { type: 'object', properties: {}, required: [] },
};

const witness = (line) => {
  if (WITNESS) fs.appendFileSync(WITNESS, `${line}\n`);
};

const send = (msg) => process.stdout.write(`${JSON.stringify(msg)}\n`);
const reply = (id, result) => send({ jsonrpc: '2.0', id, result });

let buf = '';
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    handle(msg);
  }
});

function handle(msg) {
  const { id, method } = msg;

  if (method === 'initialize') {
    reply(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'wld-probe', version: '1.0.0' },
    });
    return;
  }

  // Notifications carry no id and expect no response.
  if (method === 'notifications/initialized') return;

  if (method === 'tools/list') {
    witness('LIST');
    reply(id, { tools: [TOOL] });
    return;
  }

  if (method === 'tools/call') {
    witness(`CALL ${msg.params && msg.params.name}`);
    reply(id, { content: [{ type: 'text', text: `The probe code is ${SENTINEL}.` }] });
    return;
  }

  if (id !== undefined) reply(id, {});
}
