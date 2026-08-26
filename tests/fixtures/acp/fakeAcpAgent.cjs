// Minimal ACP-speaking child used to drive ProcessAcpClient's disconnect signals
// from real OS process behaviour. MODE selects what it does.
//
//   exit-code       exit(7) shortly after answering `initialize`
//   signal          SIGKILL itself shortly after answering `initialize`
//   pipe-close      end stdout after `initialize` but STAY ALIVE
//   drop-on-prompt  answer `initialize` + `session/new`, then end stdout on
//                   `session/prompt` and STAY ALIVE - the customer shape of
//                   #1020, and the shape the disconnect-ordering proof needs
//   silent-on-prompt answer `initialize` + `session/new`, then answer NOTHING on
//                   `session/prompt` and STAY ALIVE with stdout still OPEN. This
//                   is the Windows shape of #1061: no pipe event can ever fire,
//                   so only a silence watchdog can notice. Reachable on every
//                   platform, which is what lets it be tested off Windows.
//   chatty-on-prompt like silent-on-prompt, but keeps emitting notifications. The
//                   transport is demonstrably ALIVE, so the watchdog must NOT fire.
//   stay (default)  answer everything and stay alive
//
// Any other request carrying an `id` is answered with an empty result, so a
// session can reach `session/prompt` without hanging on config re-assertion.
const MODE = process.env.FAKE_ACP_MODE || 'stay';
const NOISE = process.env.FAKE_ACP_STDERR || '';

if (NOISE) process.stderr.write(NOISE);

/** Keep the process alive without holding the event loop busy. */
function stayAlive() {
  setTimeout(() => {}, 60_000);
}

function send(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

/** Drop the stdio pipe but keep running: nothing about a process exit is true. */
function dropTransport() {
  process.stdout.end();
  stayAlive();
}

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
    if (msg.id === undefined || msg.id === null) continue;
    handle(msg);
  }
});

function handle(msg) {
  switch (msg.method) {
    case 'initialize':
      send(msg.id, {
        protocolVersion: msg.params?.protocolVersion ?? 1,
        agentCapabilities: { loadSession: true },
        authMethods: [],
      });
      setTimeout(act, 30);
      return;
    case 'session/new':
      send(msg.id, { sessionId: 'fake-session-1' });
      return;
    case 'session/load':
      send(msg.id, {});
      return;
    case 'session/prompt':
      if (MODE === 'drop-on-prompt') {
        dropTransport();
        return;
      }
      if (MODE === 'silent-on-prompt') {
        // Never answer. stdout stays open, the process stays alive.
        stayAlive();
        return;
      }
      if (MODE === 'chatty-on-prompt') {
        // Never answer, but keep the pipe demonstrably moving. An unknown-method
        // NOTIFICATION carries no id, so JSON-RPC requires no reply and nothing
        // downstream can error on it.
        const beat = setInterval(() => {
          process.stdout.write(JSON.stringify({ jsonrpc: '2.0', method: '_wayland/heartbeat', params: {} }) + '\n');
        }, 25);
        beat.unref?.();
        stayAlive();
        return;
      }
      send(msg.id, { stopReason: 'end_turn' });
      return;
    default:
      send(msg.id, {});
      return;
  }
}

function act() {
  switch (MODE) {
    case 'exit-code':
      process.exit(7);
      break;
    case 'signal':
      process.kill(process.pid, 'SIGKILL');
      break;
    case 'pipe-close':
      dropTransport();
      break;
    default:
      stayAlive();
  }
}
