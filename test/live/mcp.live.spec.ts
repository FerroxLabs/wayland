/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
// P0 — MCP (#344/#347/#348 train + engine cap). MC-1..MC-6 in the live-test plan.
// Scaffold: implement against the running app + a real/test MCP server.
import { test } from './fixtures/app';

test.fixme('MC-1 connect stdio + hosted MCP → appears in Connected-MCPs overview (#347/#349)', async ({ app }) => {});
test.fixme('MC-2 hosted MCP BYO-OAuth sign-in completes via install+test, not HTTP OAuth (#306/#341, #283/#313)', async ({ app }) => {});
test.fixme('MC-3 per-server allowed_tools toggles scope the candidate pool (#348/#351)', async ({ app }) => {});
test.fixme('MC-4 per-conversation MCP scoping persists per chat (#348/#371)', async ({ app }) => {});
test.fixme('MC-5 >15 tools: count-vs-cap nudge (#370) + engine caps to 15, no tool-overflow 400', async ({ app }) => {});
test.fixme('MC-6 BYO MCP package versions pinned at spawn (#343/#363)', async ({ app }) => {});
