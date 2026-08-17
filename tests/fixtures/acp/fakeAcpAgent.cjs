// Minimal ACP-speaking child used to drive ProcessAcpClient's four disconnect
// signals from real OS process behaviour. MODE selects what it does after it
// answers `initialize`.
const MODE = process.env.FAKE_ACP_MODE || 'stay';
const NOISE = process.env.FAKE_ACP_STDERR || '';

if (NOISE) process.stderr.write(NOISE);

let buf = '';
process.stdin.on('data', (chunk) => {
  buf += chunk.toString();
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
    if (msg.method === 'initialize') {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: { protocolVersion: msg.params?.protocolVersion ?? 1, agentCapabilities: {}, authMethods: [] },
        }) + '\n'
      );
      setTimeout(act, 30);
    }
  }
});

function act() {
  switch (MODE) {
    case 'exit-code':
      process.exit(7);
      break;
    case 'signal':
      process.kill(process.pid, 'SIGKILL');
      break;
    case 'pipe-close':
      // Drop the stdio pipe but keep running: this is the shape the customer hit.
      process.stdout.end();
      setTimeout(() => {}, 60_000);
      break;
    case 'garbage':
      process.stdout.write('this is not ndjson\n');
      setTimeout(() => {}, 60_000);
      break;
    default:
      setTimeout(() => {}, 60_000);
  }
}
