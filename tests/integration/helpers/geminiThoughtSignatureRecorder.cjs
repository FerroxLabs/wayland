#!/usr/bin/env node
/**
 * Recording stand-in for the Gemini generateContent endpoint.
 *
 * Purpose: settle Core's C-4 without a Gemini key or the real API. Core's claim
 * is that a `thoughtSignature` arriving on a THOUGHT part is now captured and
 * re-emitted on the next turn's replayed history. That is a pure round-trip
 * property, so a canned response plus a full record of every outbound body
 * proves it deterministically - and it also gives Core the request body they
 * have never captured.
 *
 * Turn 1 answers with a thought part carrying a signature, then a text part.
 * Turn 2 onwards answers with plain text. Every inbound body is written to
 * REQ_LOG as one JSON line so the replayed history can be inspected.
 *
 * Usage: PORT=8car REQ_LOG=/path/requests.jsonl node gemini-recorder.js
 */
const http = require('http');
const fs = require('fs');

const PORT = Number(process.env.PORT || 8787);
const REQ_LOG = process.env.REQ_LOG || '/tmp/gemini-requests.jsonl';
const SIGNATURE = process.env.SIGNATURE || 'SIG-C4-ROUNDTRIP-0001';

let turn = 0;

const sse = (obj) => `data: ${JSON.stringify(obj)}\n\n`;

/** Turn 1: a thought part that carries the signature, then ordinary text. */
const firstTurnFrames = () => [
  sse({
    candidates: [
      {
        content: {
          role: 'model',
          parts: [{ text: 'Let me think about that. ', thought: true, thoughtSignature: SIGNATURE }],
        },
      },
    ],
  }),
  sse({
    candidates: [{ content: { role: 'model', parts: [{ text: 'The answer is 4.' }] } }],
  }),
  sse({
    candidates: [{ content: { role: 'model', parts: [] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
  }),
];

const laterTurnFrames = () => [
  sse({ candidates: [{ content: { role: 'model', parts: [{ text: 'Still 4.' }] } }] }),
  sse({
    candidates: [{ content: { role: 'model', parts: [] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 3, totalTokenCount: 15 },
  }),
];

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    turn += 1;
    let parsed = null;
    try {
      parsed = JSON.parse(body);
    } catch {
      /* record it raw below */
    }
    fs.appendFileSync(
      REQ_LOG,
      `${JSON.stringify({ turn, method: req.method, url: req.url, body: parsed ?? body })}\n`
    );
    // eslint-disable-next-line no-console
    console.error(`[recorder] turn ${turn} ${req.method} ${req.url} (${body.length} bytes)`);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const frames = turn === 1 ? firstTurnFrames() : laterTurnFrames();
    for (const f of frames) res.write(f);
    res.end();
  });
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.error(`[recorder] listening on 127.0.0.1:${PORT}, logging to ${REQ_LOG}`);
});
